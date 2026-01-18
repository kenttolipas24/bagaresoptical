<?php
// header('Content-Type: application/json');

// $pdo = new PDO(
//     "mysql:host=localhost;dbname=bagares_system;charset=utf8mb4",
//     "root",
//     "",
//     [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
// );

// $stmt = $pdo->query("
//     SELECT 
//         inventory_id,
//         product_name,
//         sku,
//         category,
//         price,
//         stock
//     FROM inventory
// ");

// $stmt = $pdo->query("
//     SELECT 
//         inventory_id,
//         type,
//         quantity,
//         reason,
//         created_at
//     FROM inventory
// ");

// echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));

header('Content-Type: application/json');
$host = 'localhost';
$dbname = 'bagares_system';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    
    $inventory_id = $_GET['inventory_id'] ?? 0;

    $stmt = $pdo->prepare("SELECT type, quantity, reason, created_at FROM stocks_history WHERE inventory_id = :id ORDER BY created_at DESC");
    $stmt->execute(['id' => $inventory_id]);
    $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($history);
} catch (PDOException $e) {
    echo json_encode([]);
}

?>