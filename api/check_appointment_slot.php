<?php
header('Content-Type: application/json');

$conn = new mysqli("localhost", "root", "", "bagares_system");
if ($conn->connect_error) {
    echo json_encode(['conflict' => false]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$date = $data['appointment_date'] ?? null;
$time = $data['appointment_time'] ?? null;

if (!$date || !$time) {
    echo json_encode(['conflict' => false]);
    exit;
}

$stmt = $conn->prepare("
    SELECT COUNT(*) AS cnt 
    FROM appointment 
    WHERE appointment_date = ? 
      AND appointment_time = ?
      AND status IN ('scheduled', 'pending', 'confirmed')
");

$stmt->bind_param("ss", $date, $time);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();

echo json_encode(['conflict' => (int)$row['cnt'] > 0]);

$stmt->close();
$conn->close();