<?php
// ================================================
// create_condemnation.php – RECOMMENDED FIXED VERSION
// ================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ── Show errors during development ────────────────────────────────
// Remove or comment out these lines in production!
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

try {
    require_once __DIR__ . '/../db.php';

    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    if (!$conn || $conn->connect_error) {
        throw new Exception('Database connection failed: ' . ($conn->connect_error ?? 'no connection object'));
    }

    // Read and decode JSON
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
        throw new Exception('Invalid JSON: ' . json_last_error_msg());
    }

    // Required fields
    $required = ['inventory_id', 'quantity', 'reason', 'unit_price', 'total_loss'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || trim($data[$field]) === '') {
            throw new Exception("Missing or empty field: $field");
        }
    }

    $inventory_id = (int) $data['inventory_id'];
    $quantity     = (int) $data['quantity'];
    $unit_price   = (float) $data['unit_price'];
    $total_loss   = (float) $data['total_loss'];
    $reason       = $conn->real_escape_string(trim($data['reason']));
    $notes        = isset($data['notes']) ? $conn->real_escape_string(trim($data['notes'])) : '';
    $condemned_by = !empty($_SESSION['username'])
                    ? $conn->real_escape_string($_SESSION['username'])
                    : 'System';

    if ($quantity < 1) {
        throw new Exception('Quantity must be at least 1');
    }

    // ── Stock check ────────────────────────────────────────────────
    $stmt = $conn->prepare("SELECT stock, product_name FROM inventory WHERE inventory_id = ?");
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    $stmt->bind_param("i", $inventory_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        throw new Exception('Product not found');
    }

    $product = $result->fetch_assoc();
    $stmt->close();

    if ($quantity > (int)$product['stock']) {
        throw new Exception("Insufficient stock. Only {$product['stock']} available.");
    }

    // ── Transaction ────────────────────────────────────────────────
    $conn->begin_transaction();

    // Insert condemnation (added condemned_date = NOW())
    $insertSql = "INSERT INTO condemnation 
                  (inventory_id, quantity, unit_price, total_loss, reason, notes, condemned_by, condemned_date)
                  VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";

    $stmt = $conn->prepare($insertSql);
    if (!$stmt) {
        throw new Exception("Insert prepare failed: " . $conn->error);
    }

    $stmt->bind_param("iiddsss", $inventory_id, $quantity, $unit_price, $total_loss, $reason, $notes, $condemned_by);

    if (!$stmt->execute()) {
        throw new Exception("Insert failed: " . $stmt->error);
    }

    $condemnation_id = $conn->insert_id;
    $stmt->close();

    // Update stock
    $stmt = $conn->prepare("UPDATE inventory SET stock = stock - ? WHERE inventory_id = ?");
    if (!$stmt) {
        throw new Exception("Update prepare failed: " . $conn->error);
    }

    $stmt->bind_param("ii", $quantity, $inventory_id);
    if (!$stmt->execute()) {
        throw new Exception("Stock update failed: " . $stmt->error);
    }
    $stmt->close();

    $conn->commit();

    echo json_encode([
        'success'            => true,
        'message'            => 'Item condemned successfully',
        'condemnation_id'    => $condemnation_id,
        'product_name'       => $product['product_name'],
        'quantity_condemned' => $quantity,
        'new_stock'          => (int)$product['stock'] - $quantity
    ]);

} catch (Exception $e) {
    if (isset($conn)) {
        $conn->rollback();
    }

    http_response_code(500);   // ← Use 500 on error (standard)

    echo json_encode([
        'success' => false,
        'error'   => $e->getMessage()
        // Uncomment during debugging only:
        // , 'file'  => $e->getFile(),
        //   'line'  => $e->getLine()
    ]);

} finally {
    if (isset($conn)) {
        $conn->close();
    }
}