<?php
/**
 * GET SALES HISTORY API
 * Returns sales with filtering by date and status
 */
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

$conn = new mysqli("localhost", "root", "", "bagares_system");

if ($conn->connect_error) {
    echo json_encode([]);
    exit;
}

// Get filter parameters
$date_from = isset($_GET['date_from']) ? $_GET['date_from'] : date('Y-m-d', strtotime('-30 days'));
$date_to = isset($_GET['date_to']) ? $_GET['date_to'] : date('Y-m-d');
$status = isset($_GET['status']) ? $_GET['status'] : '';

// Build query
$sql = "
    SELECT 
        s.sale_id,
        s.sale_date,
        s.patient_id,
        COALESCE(s.patient_name, CONCAT(p.firstname, ' ', p.lastname), 'Walk-in') as patient_name,
        s.total_amount,
        s.payment_method,
        s.payment_status,
        COALESCE(s.staff_name, 'N/A') as staff_name,
        COUNT(si.sale_item_id) as item_count
    FROM sales s
    LEFT JOIN patient p ON s.patient_id = p.patient_id
    LEFT JOIN sale_items si ON s.sale_id = si.sale_id
    WHERE s.sale_date BETWEEN ? AND ?
";

$params = [$date_from, $date_to];
$types = "ss";

if (!empty($status)) {
    $sql .= " AND s.payment_status = ?";
    $params[] = $status;
    $types .= "s";
}

$sql .= " GROUP BY s.sale_id ORDER BY s.sale_date DESC, s.sale_id DESC LIMIT 100";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    // Fallback for simpler schema
    $sql = "
        SELECT 
            sale_id,
            sale_date,
            patient_id,
            'Walk-in' as patient_name,
            total_amount,
            'cash' as payment_method,
            payment_status,
            'N/A' as staff_name,
            0 as item_count
        FROM sales
        WHERE sale_date BETWEEN ? AND ?
        ORDER BY sale_date DESC, sale_id DESC
        LIMIT 100
    ";
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        echo json_encode([]);
        exit;
    }
    $stmt->bind_param("ss", $date_from, $date_to);
} else {
    $stmt->bind_param($types, ...$params);
}

$stmt->execute();
$result = $stmt->get_result();

$sales = [];
while ($row = $result->fetch_assoc()) {
    $sales[] = $row;
}

echo json_encode($sales);

$stmt->close();
$conn->close();
?>