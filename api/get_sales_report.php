<?php
// ================================================
// get_sales_report.php - Sales Report API (FINAL - only product names)
// ================================================
error_reporting(E_ALL);
ini_set('display_errors', 0);
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    require_once __DIR__ . '/../db.php';
    if (!isset($conn) || $conn->connect_error) {
        throw new Exception('Database connection failed: ' . $conn->connect_error);
    }

    // ─── Filters ──────────────────────────────────────────────────────────
    $date_from = isset($_GET['date_from']) ? $_GET['date_from'] : date('Y-m-01');
    $date_to   = isset($_GET['date_to'])   ? $_GET['date_to']   : date('Y-m-d');
    $search    = isset($_GET['search'])    ? trim($_GET['search']) : '';

    // ─── WHERE clause ─────────────────────────────────────────────────────
    $where  = "WHERE DATE(s.sale_date) BETWEEN ? AND ?";
    $params = [$date_from, $date_to];
    $types  = "ss";

    if ($search !== '') {
        $where .= " AND (s.patient_name LIKE ? OR CAST(s.sale_id AS CHAR) LIKE ?)";
        $searchTerm = "%$search%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $types   .= "ss";
    }

    // ─── Statistics ───────────────────────────────────────────────────────
    $statsQuery = "
        SELECT
            COUNT(*) as total_transactions,
            COALESCE(SUM(total_amount), 0) as total_revenue,
            COALESCE(AVG(total_amount), 0) as average_sale,
            COUNT(DISTINCT DATE(sale_date)) as active_days
        FROM sales s
        $where
    ";
    $statsStmt = $conn->prepare($statsQuery);
    $statsStmt->bind_param($types, ...$params);
    $statsStmt->execute();
    $stats = $statsStmt->get_result()->fetch_assoc() ?? [];

    // Today's sales
    $todayQuery = "SELECT COALESCE(SUM(total_amount), 0) as today_sales
                   FROM sales WHERE DATE(sale_date) = CURDATE()";
    $todayResult = $conn->query($todayQuery);
    $todaySales = $todayResult->fetch_assoc()['today_sales'] ?? 0;

    // ─── Sales list with product names only ───────────────────────────────
    $salesQuery = "
        SELECT
            s.sale_id,
            COALESCE(s.patient_name, 'Unknown') as patient_name,
            s.total_amount,
            s.payment_status,
            DATE_FORMAT(s.sale_date, '%Y-%m-%d') as sale_date,
            s.created_at,
            (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.sale_id) as item_count,
            (SELECT COALESCE(SUM(quantity), 0) FROM sale_items WHERE sale_id = s.sale_id) as total_quantity,
            (
                SELECT GROUP_CONCAT(i.product_name SEPARATOR ', ')
                FROM sale_items si
                JOIN inventory i ON si.inventory_id = i.inventory_id
                WHERE si.sale_id = s.sale_id
            ) as product_summary
        FROM sales s
        $where
        ORDER BY s.sale_date DESC, s.created_at DESC
    ";
    $salesStmt = $conn->prepare($salesQuery);
    $salesStmt->bind_param($types, ...$params);
    $salesStmt->execute();
    $salesResult = $salesStmt->get_result();

    $sales = [];
    while ($row = $salesResult->fetch_assoc()) {
        $sales[] = $row;
    }

    // ─── Top 5 selling products ───────────────────────────────────────────
    $topQuery = "
        SELECT
            i.product_name,
            i.sku,
            SUM(si.quantity) as total_sold,
            SUM(si.subtotal) as total_revenue
        FROM sale_items si
        JOIN inventory i ON si.inventory_id = i.inventory_id
        JOIN sales s ON si.sale_id = s.sale_id
        WHERE DATE(s.sale_date) BETWEEN ? AND ?
        GROUP BY si.inventory_id, i.product_name, i.sku
        ORDER BY total_sold DESC
        LIMIT 5
    ";
    $topStmt = $conn->prepare($topQuery);
    $topStmt->bind_param("ss", $date_from, $date_to);
    $topStmt->execute();
    $topResult = $topStmt->get_result();

    $topProducts = [];
    while ($row = $topResult->fetch_assoc()) {
        $topProducts[] = $row;
    }

    // ─── Response ─────────────────────────────────────────────────────────
    echo json_encode([
        'success'      => true,
        'stats'        => [
            'total_transactions' => (int)($stats['total_transactions'] ?? 0),
            'total_revenue'      => (float)($stats['total_revenue'] ?? 0),
            'average_sale'       => (float)($stats['average_sale'] ?? 0),
            'today_sales'        => (float)$todaySales,
            'active_days'        => (int)($stats['active_days'] ?? 0)
        ],
        'data'         => $sales,
        'top_products' => $topProducts,
        'count'        => count($sales),
        'filters'      => [
            'date_from' => $date_from,
            'date_to'   => $date_to
        ]
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