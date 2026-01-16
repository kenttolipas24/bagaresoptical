<?php
header("Content-Type: application/json");
$conn = new mysqli("localhost", "root", "", "bagares_system");

if ($conn->connect_error) {
    echo json_encode([]);
    exit;
}

/**
 * SQL logic:
 * We select from eye_examinations and JOIN with patient_request.
 * This ensures ONLY patients with a prescription appear in the results.
 */
$sql = "
SELECT
    e.exam_id,
    e.request_id,
    e.exam_date,
    p.firstname,
    p.middlename,
    p.lastname,
    p.suffix,
    p.address,
    p.birthdate,
    e.od_sph, e.od_cyl, e.od_axis,
    e.os_sph, e.os_cyl, e.os_axis,
    e.pd
FROM eye_examinations e
INNER JOIN patient_request p ON e.request_id = p.id
ORDER BY e.exam_date DESC
";

$result = $conn->query($sql);
$rows = [];

while ($row = $result->fetch_assoc()) {
    $rows[] = $row;
}

echo json_encode($rows);
$conn->close();
?>