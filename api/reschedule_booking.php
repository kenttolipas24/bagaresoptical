<?php
header("Content-Type: application/json");

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
}

$input = json_decode(file_get_contents("php://input"), true);

$id   = $input['request_id'] ?? null;
$date = $input['new_date'] ?? null;
$time = $input['new_time'] ?? null;

if (!$id || !$date || !$time) {
    http_response_code(400);
    echo json_encode(["success"=>false,"error"=>"Missing data"]);
    exit;
}

$stmt = $conn->prepare("
    UPDATE patient_request
    SET appointment_date=?, appointment_time=?, status='rescheduled'
    WHERE id=?
");

$stmt->bind_param("ssi", $date, $time, $id);
$stmt->execute();

echo json_encode([
    "success" => true,
    "message" => "Booking rescheduled"
]);
