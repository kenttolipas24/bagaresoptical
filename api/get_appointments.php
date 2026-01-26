<?php
header("Content-Type: application/json");
error_reporting(0);
ini_set('display_errors', 0);

$conn = new mysqli("localhost", "root", "", "bagares_system");
if ($conn->connect_error) {
    echo json_encode([]);
    exit;
}

$date = $_GET['date'] ?? null;

/*
 FLOW:
 appointment ← patient (required)
 patient_request (optional - only for online bookings)
*/

$sql = "
SELECT
    a.appointment_id,
    a.patient_id,
    a.appointment_date,
    a.appointment_time,
    a.service,
    a.status AS appointment_status,
    a.created_at,

    pr.id AS request_id,
    pr.status AS request_status,

    CONCAT(
        p.firstname, ' ',
        IFNULL(p.middlename, ''), ' ',
        p.lastname, ' ',
        IFNULL(p.suffix, '')
    ) AS patient_name

FROM appointment a
INNER JOIN patient p 
    ON p.patient_id = a.patient_id
LEFT JOIN patient_request pr 
    ON pr.patient_id = a.patient_id
    AND pr.appointment_date = a.appointment_date
    AND pr.appointment_time = a.appointment_time
    AND pr.status = 'confirmed'

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
        "request_id"       => $row["request_id"] ? (int)$row["request_id"] : null,
        "patient_id"       => (int)$row["patient_id"],
        "patient_name"     => trim($row["patient_name"]),
        "appointment_date" => $row["appointment_date"],
        "appointment_time" => $row["appointment_time"],
        "service"          => $row["service"],
        "appointment_status" => $row["appointment_status"],
        "request_status"     => $row["request_status"] ?? null,
        "created_at"       => $row["created_at"]
    ];
}

echo json_encode($appointments);

$stmt->close();
$conn->close();