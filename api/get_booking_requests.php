<?php
header("Content-Type: application/json");
error_reporting(E_ALL);
ini_set('display_errors', 0); // ❗ hide errors from breaking JSON

$conn = new mysqli("localhost", "root", "", "bagares_system");

if ($conn->connect_error) {
    echo json_encode([]); // ✅ ALWAYS ARRAY
    exit;
}

$date = $_GET['date'] ?? null;

$sql = "
SELECT
    a.appointment_id,
    a.patient_id,
    a.appointment_date,
    a.appointment_time,
    a.service,
    a.status,
    a.created_at,
    CONCAT(
        p.firstname, ' ',
        IFNULL(p.middlename, ''), ' ',
        p.lastname, ' ',
        IFNULL(p.suffix, '')
    ) AS patient_name
FROM appointment a
INNER JOIN patient p ON p.patient_id = a.patient_id
WHERE a.status = 'scheduled'
";

if ($date) {
    $sql .= " AND a.appointment_date = ?";
}

$sql .= " ORDER BY a.appointment_date DESC, a.appointment_time DESC";

$stmt = $conn->prepare($sql);

if ($date) {
    $stmt->bind_param("s", $date);
}

$stmt->execute();
$result = $stmt->get_result();

$appointments = [];

while ($row = $result->fetch_assoc()) {
    $appointments[] = [
        "appointment_id"   => (int)$row["appointment_id"],
        "patient_id"       => (int)$row["patient_id"],
        "patient_name"     => trim($row["patient_name"]),
        "appointment_date" => $row["appointment_date"],
        "appointment_time" => $row["appointment_time"],
        "service"          => $row["service"],
        "status"           => $row["status"],
        "created_at"       => $row["created_at"]
    ];
}

echo json_encode($appointments); // ✅ ALWAYS ARRAY

$stmt->close();
$conn->close();
