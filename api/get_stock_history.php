<?php
// ================================================
// get_stock_history.php - CLEAN & CONSISTENT
// ================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Development only - comment out later
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    $host     = 'localhost';
    $dbname   = 'bagares_system';
    $username = 'root';
    $password = '';

    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );

    $inventory_id = filter_input(INPUT_GET, 'inventory_id', FILTER_VALIDATE_INT);

    if ($inventory_id === false || $inventory_id <= 0) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error'   => 'Invalid or missing inventory_id'
        ]);
        exit;
    }

    $stmt = $pdo->prepare("
        SELECT 
            type,
            quantity,
            reason,
            created_at
        FROM stocks_history
        WHERE inventory_id = :id
        ORDER BY created_at DESC
    ");

    $stmt->execute(['id' => $inventory_id]);
    $history = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'data'    => $history
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => $e->getMessage()
    ]);
}