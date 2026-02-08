<?php
/**
 * GET SALE DETAILS API
 * Returns detailed information about a specific sale
 */
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

$conn = new mysqli("localhost", "root", "", "bagares_system");

if ($conn->connect_error) {
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

$sale_id = isset($_GET['sale_id']) ? intval($_GET['sale_id']) : 0;

if (!$sale_id) {
    echo json_encode(["error" => "Sale ID required"]);
    exit;
}

// Get sale info
$saleSql = "
    SELECT 
        s.*,
        COALESCE(s.patient_name, CONCAT(p.firstname, ' ', p.lastname), 'Walk-in Customer') as patient_name
    FROM sales s
    LEFT JOIN patient p ON s.patient_id = p.patient_id
    WHERE s.sale_id = ?
";

$stmt = $conn->prepare($saleSql);
$stmt->bind_param("i", $sale_id);
$stmt->execute();
$saleResult = $stmt->get_result();
$sale = $saleResult->fetch_assoc();
$stmt->close();

if (!$sale) {
    echo json_encode(["error" => "Sale not found"]);
    exit;
}

// Get sale items
$itemsSql = "
    SELECT 
        si.*,
        COALESCE(i.product_name, 'Unknown Item') as product_name,
        i.sku
    FROM sale_items si
    LEFT JOIN inventory i ON si.inventory_id = i.inventory_id
    WHERE si.sale_id = ?
";

$stmt = $conn->prepare($itemsSql);
$stmt->bind_param("i", $sale_id);
$stmt->execute();
$itemsResult = $stmt->get_result();

$items = [];
while ($row = $itemsResult->fetch_assoc()) {
    $items[] = $row;
}
$stmt->close();

echo json_encode([
    "sale" => $sale,
    "items" => $items
]);

$conn->close();
?>