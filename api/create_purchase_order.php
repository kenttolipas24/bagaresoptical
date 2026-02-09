<?php
header('Content-Type: application/json'); // Add this!
include '../db.php';

// Check connection
if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Connection failed"]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['items'])) {
    echo json_encode(["status" => "error", "message" => "Invalid data received"]);
    exit;
}

$conn->begin_transaction(); 

try {
    // Generate PO Number logic
    $po_no = "PO-" . date('Ymd') . "-" . strtoupper(substr(uniqid(), -4));
    
    // 1. Insert Header
    $stmt = $conn->prepare("INSERT INTO purchase_orders (po_number, supplier_id, order_date, delivery_date, total_amount, status) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sissss", $po_no, $data['supplier_id'], $data['order_date'], $data['delivery_date'], $data['total_amount'], $data['status']);
    $stmt->execute();
    $po_id = $conn->insert_id; 

    // 2. Insert Items
    $stmtItem = $conn->prepare("INSERT INTO purchase_order_items (po_id, inventory_id, quantity, unit_cost) VALUES (?, ?, ?, ?)");
    foreach ($data['items'] as $item) {
        $stmtItem->bind_param("iiid", $po_id, $item['inventory_id'], $item['quantity'], $item['unit_cost']);
        $stmtItem->execute();
    }

    $conn->commit(); 
    echo json_encode(["status" => "success"]);
} catch (Exception $e) {
    $conn->rollback(); 
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>