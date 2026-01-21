<?php
error_log("✅ Using UPDATED create_sale.php with stock history");
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

$conn = new mysqli("localhost", "root", "", "bagares_system");

if ($conn->connect_error) {
    echo json_encode([
        "success" => false,
        "error" => "Database connection failed"
    ]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode([
        "success" => false,
        "error" => "Invalid JSON payload"
    ]);
    exit;
}

$patient_id     = $data['patient_id'] ?? null;
$sale_date      = $data['sale_date'] ?? null;
$payment_method = $data['payment_method'] ?? null;
$total_amount   = $data['total_amount'] ?? 0;
$items          = $data['items'] ?? [];

if (!$sale_date || !$payment_method || empty($items)) {
    echo json_encode([
        "success" => false,
        "error" => "Missing required sale data"
    ]);
    exit;
}

$conn->begin_transaction();

try {
    // Get patient name for stock history reason
    $patient_name = 'Walk-in Customer';
    if ($patient_id) {
        $nameStmt = $conn->prepare("
            SELECT CONCAT(firstname, ' ', lastname) as name 
            FROM patient 
            WHERE patient_id = ?
        ");
        $nameStmt->bind_param("i", $patient_id);
        $nameStmt->execute();
        $nameResult = $nameStmt->get_result();
        if ($nameRow = $nameResult->fetch_assoc()) {
            $patient_name = $nameRow['name'];
        }
        $nameStmt->close();
    }

    // 1️⃣ INSERT INTO sales
    $stmt = $conn->prepare("
        INSERT INTO sales 
        (patient_id, sale_date, total_amount, payment_status, created_at)
        VALUES (?, ?, ?, 'paid', NOW())
    ");
    $stmt->bind_param("isd", $patient_id, $sale_date, $total_amount);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to create sale: " . $stmt->error);
    }

    $sale_id = $stmt->insert_id;
    $stmt->close();

    // 2️⃣ Prepare statements
    $itemStmt = $conn->prepare("
        INSERT INTO sale_items 
        (sale_id, inventory_id, quantity, price, subtotal)
        VALUES (?, ?, ?, ?, ?)
    ");

    $stockStmt = $conn->prepare("
        UPDATE inventory 
        SET stock = stock - ? 
        WHERE inventory_id = ? AND stock >= ?
    ");

    // 🔥 CRITICAL FIX: Insert into stocks_history
    $historyStmt = $conn->prepare("
        INSERT INTO stocks_history 
        (inventory_id, type, quantity, reason, created_at)
        VALUES (?, 'Stock Out', ?, ?, NOW())
    ");

    // 3️⃣ Process each item
    foreach ($items as $item) {
        $inventory_id = $item['inventory_id'];
        $qty          = $item['quantity'];
        $price        = $item['price'];
        $subtotal     = $price * $qty;

        // a) Insert sale item
        $itemStmt->bind_param("iiidd", $sale_id, $inventory_id, $qty, $price, $subtotal);
        if (!$itemStmt->execute()) {
            throw new Exception("Failed to insert sale item: " . $itemStmt->error);
        }

        // b) Deduct stock
        $stockStmt->bind_param("iii", $qty, $inventory_id, $qty);
        if (!$stockStmt->execute()) {
            throw new Exception("Failed to update stock: " . $stockStmt->error);
        }

        if ($stockStmt->affected_rows === 0) {
            throw new Exception("Insufficient stock for inventory_id: $inventory_id");
        }

        // c) 🔥 Record stock movement in stocks_history
        $reason = "Sold to: " . $patient_name . " (Sale #" . $sale_id . ")";
        $historyStmt->bind_param("iis", $inventory_id, $qty, $reason);
        
        if (!$historyStmt->execute()) {
            throw new Exception("Failed to insert stock history: " . $historyStmt->error);
        }
    }

    $itemStmt->close();
    $stockStmt->close();
    $historyStmt->close();

    $conn->commit();

    echo json_encode([
        "success" => true,
        "sale_id" => $sale_id,
        "message" => "Sale completed and stock history recorded"
    ]);

} catch (Exception $e) {
    $conn->rollback();
    
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}

$conn->close();
?>