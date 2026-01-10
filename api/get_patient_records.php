<?php
header("Content-Type: application/json");
$conn = new mysqli("localhost", "root", "", "bagares_system");

if ($conn->connect_error) {
    echo json_encode([]);
    exit;
}

$sql = "
SELECT
    e.exam_id,
    e.exam_date,

    CONCAT(
        p.firstname, ' ',
        COALESCE(CONCAT(p.middlename, ' '), ''),
        p.lastname,
        COALESCE(CONCAT(' ', p.suffix), '')
    ) AS patient_name,

    e.od_sph, e.od_cyl, e.od_axis,
    e.os_sph, e.os_cyl, e.os_axis,
    e.od_add,
    e.pd

FROM eye_examinations e
JOIN patient_request p ON e.request_id = p.id
ORDER BY e.exam_date DESC
";

$result = $conn->query($sql);
$rows = [];

while ($row = $result->fetch_assoc()) {
    $rows[] = $row;
}

echo json_encode($rows);
$conn->close();
