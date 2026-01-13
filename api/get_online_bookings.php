<?php
header("Content-Type: application/json");

// CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, ['http://localhost','https://bagaresoptical-com.onrender.com'])) {
    header("Access-Control-Allow-Origin: $origin");
}

$isLocal = in_array($_SERVER['HTTP_HOST'], ['localhost','127.0.0.1']);

if ($isLocal) {
    require_once __DIR__ . '/../db.php';
} else {
    $conn = new mysqli(
        $_ENV['DB_HOST'],
        $_ENV['DB_USER'],
        $_ENV['DB_PASS'],
        $_ENV['DB_NAME'],
        $_ENV['DB_PORT'] ?? 3306
    );
    $conn->set_charset("utf8mb4");
}

$status = $_GET['status'] ?? 'pending';

$sql = "SELECT * FROM patient_request";
if ($status !== 'all') {
    $sql .= " WHERE status = ?";
}

$sql .= " ORDER BY created_at DESC";

if ($status !== 'all') {
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $status);
    $stmt->execute();
    $res = $stmt->get_result();
} else {
    $res = $conn->query($sql);
}

$data = [];
while ($row = $res->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode([
    "success" => true,
    "count" => count($data),
    "data" => $data
]);
