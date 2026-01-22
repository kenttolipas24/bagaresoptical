<?php
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "bagares_system");

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Connection failed"]);
    exit;
}

$conn->set_charset("utf8mb4");

$sql = "
    SELECT 
        pr.id,
        pr.patient_id,
        pr.service,
        pr.appointment_date,
        pr.appointment_time,
        pr.status,
        pr.created_at,
        CONCAT(
            p.firstname, ' ',
            IFNULL(p.middlename, ''), ' ',
            p.lastname, ' ',
            IFNULL(p.suffix, '')
        ) AS patient_name
    FROM patient_request pr
    INNER JOIN patient p ON p.patient_id = pr.patient_id
    WHERE pr.status = 'pending'
      AND pr.patient_id IS NOT NULL
    ORDER BY pr.created_at DESC
    LIMIT 50
";

$result = $conn->query($sql);

if (!$result) {
    echo json_encode(["error" => $conn->error]);
    exit;
}

$requests = [];

while ($row = $result->fetch_assoc()) {
    $requests[] = [
        "id"               => (int)$row["id"],
        "patient_id"       => (int)$row["patient_id"],
        "patient_name"     => trim($row["patient_name"]),
        "appointment_date" => $row["appointment_date"],
        "appointment_time" => $row["appointment_time"],
        "service"          => $row["service"],
        "address"          => "N/A",
        "status"           => $row["status"],
        "created_at"       => $row["created_at"]
    ];
}

echo json_encode($requests);

$conn->close();