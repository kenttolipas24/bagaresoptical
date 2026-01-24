<?php
// ==============================================
// get_booking_requests.php (Fixed)
// ==============================================

// Disable HTML error output, use JSON only
error_reporting(0);
ini_set('display_errors', 0);

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

try {
    // Use corrected db.php
    $conn = new mysqli("localhost", "root", "", "bagares_system");
if ($conn->connect_error) {
    echo json_encode([]);
    exit;
}

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
        COALESCE(p.firstname, ''), ' ',
        COALESCE(p.middlename, ''), ' ',
        COALESCE(p.lastname, ''), ' ',
        COALESCE(p.suffix, '')
    ) AS patient_name,
    p.address AS address
FROM patient_request pr
LEFT JOIN patient p ON p.patient_id = pr.patient_id
WHERE pr.status = 'pending'
ORDER BY pr.created_at DESC
LIMIT 50

    ";

    $result = $conn->query($sql);

    if (!$result) {
        throw new Exception('Query failed: ' . $conn->error);
    }

    $requests = [];

    while ($row = $result->fetch_assoc()) {
        $requests[] = [
            "id"               => (int)$row["id"],
            "patient_id"       => (int)$row["patient_id"],
            "patient_name"     => trim(preg_replace('/\s+/', ' ', $row["patient_name"])),
            "appointment_date" => $row["appointment_date"],
            "appointment_time" => $row["appointment_time"],
            "service"          => $row["service"],
            "address"          => trim($row["address"]) ?: "N/A",
            "status"           => $row["status"],
            "created_at"       => $row["created_at"]
        ];
    }

    echo json_encode($requests, JSON_NUMERIC_CHECK);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "error" => $e->getMessage(),
        "success" => false
    ]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
?>