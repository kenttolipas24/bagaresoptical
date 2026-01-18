<?php
// ============================================================
// RESTOCK ITEM API - restock_item.php
// ============================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Database configuration
$host = 'localhost';
$dbname = 'bagares_system';
$username = 'root';
$password = '';

try {
    // Create database connection
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // Validate input
    if (!isset($data['sku']) || !isset($data['quantity'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields: sku and quantity'
        ]);
        exit();
    }
    
    $sku = trim($data['sku']);
    $quantity = intval($data['quantity']);
    
    // Validate quantity
    if ($quantity <= 0) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Quantity must be greater than 0'
        ]);
        exit();
    }
    
    // Start transaction
    $pdo->beginTransaction();
    
    // Get current stock
    $stmt = $pdo->prepare("SELECT inventory_id, product_name, stock FROM inventory WHERE sku = :sku");
    $stmt->execute(['sku' => $sku]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$product) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Product not found'
        ]);
        exit();
    }
    
    $current_stock = intval($product['stock']);
    $new_stock = $current_stock + $quantity;
    
    // Update inventory stock
    $stmt = $pdo->prepare("UPDATE inventory SET stock = :new_stock WHERE sku = :sku");
    $stmt->execute([
        'new_stock' => $new_stock,
        'sku' => $sku
    ]);
    
    // Optional: Insert stock movement history
    // Uncomment this if you have a stocks_history table
    
    $stmt = $pdo->prepare("
        INSERT INTO stocks_history 
        (inventory_id, type, quantity, reason, created_at) 
        VALUES (:inventory_id, 'Stock In', :quantity, 'Restock', NOW())
    ");
    $stmt->execute([
        'inventory_id' => $product['inventory_id'],
        'quantity' => $quantity
    ]);
    
    
    // Commit transaction
    $pdo->commit();
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Stock updated successfully',
        'product_name' => $product['product_name'],
        'sku' => $sku,
        'previous_stock' => $current_stock,
        'quantity_added' => $quantity,
        'new_stock' => $new_stock
    ]);
    
} catch (PDOException $e) {
    // Rollback transaction on error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    error_log("Restock Error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred',
        'error' => $e->getMessage() // Remove in production
    ]);
} catch (Exception $e) {
    error_log("Restock Error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred',
        'error' => $e->getMessage() // Remove in production
    ]);
}
?>