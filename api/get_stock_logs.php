<?php
header('Content-Type: application/json');
include '../db.php'; 

try {
    if ($conn->connect_error) {
        throw new Exception("Database connection failed");
    }

    // Querying the stocks_history table and ensuring processed_by is selected
    $sql = "SELECT 
                i.product_name, 
                i.category, 
                i.stock as current_inventory,
                h.type as trans_type,
                h.created_at as trans_date,
                h.quantity,
                h.reason,
                h.processed_by 
            FROM inventory i
            JOIN stocks_history h ON i.inventory_id = h.inventory_id
            ORDER BY h.created_at DESC";

    $result = $conn->query($sql);
    $logs = [];

    if ($result && $result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $logs[] = $row;
        }
    }
    echo json_encode($logs);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
$conn->close();
?>