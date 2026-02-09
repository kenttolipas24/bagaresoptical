<?php
header('Content-Type: application/json');
include '../db.php';

try {
    if ($conn->connect_error) {
        throw new Exception("Database connection failed");
    }

    /**
     * SQL Logic:
     * 1. Select all columns from suppliers
     * 2. Use a Subquery to count how many purchase orders belong to this supplier
     * 3. Return lowercase slugs for the CSS category/status badges
     */
    $sql = "SELECT s.*, 
            (SELECT COUNT(*) FROM purchase_orders WHERE supplier_id = s.supplier_id) as total_orders,
            LOWER(s.category) as category_slug,
            LOWER(s.status) as status_slug
            FROM suppliers s 
            ORDER BY s.supplier_name ASC";

    $result = $conn->query($sql);
    $suppliers = [];

    if ($result && $result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $suppliers[] = $row;
        }
    }

    echo json_encode($suppliers);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

$conn->close();
?>