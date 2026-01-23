<?php
// ================================================
// get_condemnation_report.php - Condemnation Report API
// ================================================
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    require_once __DIR__ . '/../db.php';
    if (!isset($conn) || $conn->connect_error) {
        throw new Exception('Database connection failed');
    }

    // Filter parameters
    $category = isset($_GET['category']) ? trim($_GET['category']) : 'all';
    $reason   = isset($_GET['reason'])   ? trim($_GET['reason'])   : 'all';
    $search   = isset($_GET['search'])   ? trim($_GET['search'])   : '';
    $sort     = isset($_GET['sort'])     ? trim($_GET['sort'])     : 'newest';

    // Build WHERE clause
    $where  = "WHERE 1=1";
    $params = [];
    $types  = "";

    if ($category !== 'all' && $category !== '') {
        $where .= " AND i.category = ?";
        $params[] = $category;
        $types   .= "s";
    }

    if ($reason !== 'all' && $reason !== '') {
        $where .= " AND c.reason = ?";
        $params[] = $reason;
        $types   .= "s";
    }

    if ($search !== '') {
        $where .= " AND (i.product_name LIKE ? OR i.sku LIKE ? OR c.notes LIKE ?)";
        $searchTerm = "%$search%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $types   .= "sss";
    }

    // Sorting
    $orderBy = "ORDER BY ";
    switch ($sort) {
        case 'oldest':
            $orderBy .= "c.condemned_date ASC";
            break;
        case 'value_high':
            $orderBy .= "c.total_loss DESC";
            break;
        case 'value_low':
            $orderBy .= "c.total_loss ASC";
            break;
        default: // newest
            $orderBy .= "c.condemned_date DESC";
    }

    // Main query
    $query = "
        SELECT
            c.condemnation_id,
            c.condemned_date,
            i.product_name,
            i.sku,
            i.category,
            c.quantity,
            c.unit_price,
            c.total_loss,
            c.reason,
            c.condemned_by,
            c.notes
        FROM condemnation c
        LEFT JOIN inventory i ON c.inventory_id = i.inventory_id
        $where
        $orderBy
    ";

    if (!empty($params)) {
        $stmt = $conn->prepare($query);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
    } else {
        $result = $conn->query($query);
    }

    $records = [];
    while ($row = $result->fetch_assoc()) {
        $records[] = $row;
    }

    // Basic stats
    $statsQuery = "
        SELECT
            COUNT(*) AS total_records,
            SUM(c.quantity) AS total_items_condemned,
            COALESCE(SUM(c.total_loss), 0) AS total_loss_value,
            COUNT(DISTINCT c.reason) AS unique_reasons
        FROM condemnation c
        LEFT JOIN inventory i ON c.inventory_id = i.inventory_id
        $where
    ";

    if (!empty($params)) {
        $statsStmt = $conn->prepare($statsQuery);
        $statsStmt->bind_param($types, ...$params);
        $statsStmt->execute();
        $stats = $statsStmt->get_result()->fetch_assoc();
    } else {
        $stats = $conn->query($statsQuery)->fetch_assoc();
    }

    echo json_encode([
        'success' => true,
        'stats' => [
            'total_records'         => (int)$stats['total_records'],
            'total_items_condemned' => (int)$stats['total_items_condemned'],
            'total_loss_value'      => (float)$stats['total_loss_value'],
            'unique_reasons'        => (int)$stats['unique_reasons']
        ],
        'data'  => $records,
        'count' => count($records)
    ], JSON_NUMERIC_CHECK);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => $e->getMessage()
    ]);
} finally {
    if (isset($conn)) $conn->close();
}
?>