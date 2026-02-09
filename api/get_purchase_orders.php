<?php
header('Content-Type: application/json');
include '../db.php';

$sql = "SELECT po.*, s.supplier_name 
        FROM purchase_orders po 
        JOIN suppliers s ON po.supplier_id = s.supplier_id 
        ORDER BY po.created_at DESC";

$result = $conn->query($sql);
$orders = [];

if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $orders[] = $row;
    }
}

echo json_encode($orders);
?>