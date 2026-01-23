<?php
// ================================================
// get_inventory_report.php - Inventory Report API (updated 2026)
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

    // ─── GET parameters ───────────────────────────────────────────────────
    $category   = isset($_GET['category'])   ? trim($_GET['category'])   : 'all';
    $stock_level = isset($_GET['stock_level']) ? trim($_GET['stock_level']) : 'all';
    $search     = isset($_GET['search'])     ? trim($_GET['search'])     : '';
    $sort       = isset($_GET['sort'])       ? trim($_GET['sort'])       : 'product_name_asc';

    // ─── WHERE clause ─────────────────────────────────────────────────────
    $where  = "WHERE 1=1";
    $params = [];
    $types  = "";

    // Category filter
    if ($category !== 'all' && $category !== '') {
        $where .= " AND category = ?";
        $params[] = $category;
        $types   .= "s";
    }

    // Stock level filter
    if ($stock_level === 'in_stock') {
        $where .= " AND stock > 10";
    } elseif ($stock_level === 'low_stock') {
        $where .= " AND stock > 0 AND stock <= 10";
    } elseif ($stock_level === 'out_of_stock') {
        $where .= " AND stock = 0";
    }

    // Search by product name or SKU
    if ($search !== '') {
        $where .= " AND (product_name LIKE ? OR sku LIKE ?)";
        $searchTerm = "%$search%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $types   .= "ss";
    }

    // ─── ORDER BY clause ──────────────────────────────────────────────────
    $orderBy = "ORDER BY ";
    switch ($sort) {
        case 'product_name_desc':
            $orderBy .= "product_name DESC";
            break;
        case 'stock_high':
            $orderBy .= "stock DESC";
            break;
        case 'stock_low':
            $orderBy .= "stock ASC";
            break;
        case 'price_high':
            $orderBy .= "price DESC";
            break;
        case 'price_low':
            $orderBy .= "price ASC";
            break;
        default:
            $orderBy .= "product_name ASC";
    }

    // ─── Overall stats (unfiltered) ───────────────────────────────────────
    $statsQuery = "
        SELECT 
            COUNT(*) AS total_products,
            SUM(CASE WHEN stock > 10 THEN 1 ELSE 0 END) AS in_stock,
            SUM(CASE WHEN stock > 0 AND stock <= 10 THEN 1 ELSE 0 END) AS low_stock,
            SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) AS out_of_stock,
            COALESCE(SUM(stock * price), 0) AS total_value
        FROM inventory
    ";
    $statsResult = $conn->query($statsQuery);
    $stats = $statsResult->fetch_assoc() ?? [];

    // ─── Filtered inventory list ──────────────────────────────────────────
    $query = "
        SELECT 
            inventory_id,
            product_name,
            sku,
            category,
            price AS unit_price,
            stock AS current_stock,
            (stock * price) AS total_value,
            CASE 
                WHEN stock > 10 THEN 'In Stock'
                WHEN stock > 0  THEN 'Low Stock'
                ELSE 'Out of Stock'
            END AS status
        FROM inventory
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

    $items = [];
    while ($row = $result->fetch_assoc()) {
        $items[] = $row;
    }

    // ─── Final JSON response ──────────────────────────────────────────────
    echo json_encode([
        'success' => true,
        'stats' => [
            'total_products' => (int)($stats['total_products'] ?? 0),
            'in_stock'       => (int)($stats['in_stock'] ?? 0),
            'low_stock'      => (int)($stats['low_stock'] ?? 0),
            'out_of_stock'   => (int)($stats['out_of_stock'] ?? 0),
            'total_value'    => (float)($stats['total_value'] ?? 0)
        ],
        'data'  => $items,
        'count' => count($items)
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