<?php
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

$patient_request_id = $data['patient_request_id'] ?? null;
$sale_date          = $data['sale_date'] ?? null;
$payment_method     = $data['payment_method'] ?? null;
$total_amount       = $data['total_amount'] ?? 0;
$items              = $data['items'] ?? [];

if (!$patient_request_id || !$sale_date || !$payment_method || empty($items)) {
    echo json_encode([
        "success" => false,
        "error" => "Missing required sale data"
    ]);
    exit;
}

$conn->begin_transaction();

try {
    // 1️⃣ INSERT INTO sales
    $stmt = $conn->prepare("
        INSERT INTO sales 
        (patient_request_id, sale_date, total_amount, payment_status)
        VALUES (?, ?, ?, 'paid')
    ");
    $stmt->bind_param("isd", $patient_request_id, $sale_date, $total_amount);
    $stmt->execute();

    $sale_id = $stmt->insert_id;
    $stmt->close();

    // 2️⃣ INSERT sale items + update inventory
    $itemStmt = $conn->prepare("
        INSERT INTO sale_items 
        (sale_id, inventory_id, quantity, price)
        VALUES (?, ?, ?, ?)
    ");

    $stockStmt = $conn->prepare("
        UPDATE inventory 
        SET stock = stock - ? 
        WHERE inventory_id = ? AND stock >= ?
    ");

    foreach ($items as $item) {
        $inventory_id = $item['inventory_id'];
        $qty          = $item['quantity'];
        $price        = $item['price'];

        // Insert sale item
        $itemStmt->bind_param("iiid", $sale_id, $inventory_id, $qty, $price);
        $itemStmt->execute();

        // Deduct stock
        $stockStmt->bind_param("iii", $qty, $inventory_id, $qty);
        $stockStmt->execute();

        if ($stockStmt->affected_rows === 0) {
            throw new Exception("Insufficient stock for item ID $inventory_id");
        }
    }

    $itemStmt->close();
    $stockStmt->close();

    $conn->commit();

    echo json_encode([
        "success" => true,
        "sale_id" => $sale_id
    ]);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}

$conn->close();
