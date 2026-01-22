<?php
// ================================================
// get_condemnations.php – FIXED & DEBUG VERSION
// ================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

try {
    require_once __DIR__ . '/../db.php';

    // Quick connection check
    if (!isset($conn) || $conn->connect_error) {
        throw new Exception("Database connection failed: " . ($conn->connect_error ?? 'no $conn object'));
    }

    $sql = "SELECT 
                c.condemnation_id,
                c.inventory_id,
                c.quantity,
                c.unit_price,
                c.total_loss,
                c.reason,
                c.notes,
                c.condemned_by,
                c.condemned_date,
                i.product_name,
                i.sku,
                i.category
            FROM condemnation c 
            LEFT JOIN inventory i ON c.inventory_id = i.inventory_id 
            ORDER BY c.condemned_date DESC";

    $result = $conn->query($sql);
    
    if (!$result) {
        throw new Exception("Query failed: " . $conn->error);
    }
    
    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }

    echo json_encode($data);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error'   => true,
        'message' => $e->getMessage(),
    ]);
} finally {
    if (isset($conn) && $conn) {
        $conn->close();
    }
}