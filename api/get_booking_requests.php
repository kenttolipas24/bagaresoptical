<?php
// ==============================================
// get_booking_request.php
// ==============================================

header("Content-Type: application/json");

// Optional: show errors during development (remove later)
// error_reporting(E_ALL);
// ini_set('display_errors', 1);

$conn = new mysqli("localhost", "root", "", "bagares_system");

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

// Get only PENDING requests by default
$status = isset($_GET['status']) ? trim($_GET['status']) : 'pending';

$sql = "SELECT 
            pr.id,
            pr.service,
            pr.appointment_date,
            pr.appointment_time,
            pr.status,
            pr.created_at,
            p.firstname,
            p.middlename,
            p.lastname,
            p.suffix,
            p.address,
            p.birthdate,
            p.email
        FROM patient_request pr
        JOIN patient p ON pr.patient_id = p.patient_id";

// Always filter by status (show pending by default, or specific status if requested)
if ($status !== 'all') {
    $sql .= " WHERE pr.status = ?";
}

$sql .= " ORDER BY pr.created_at DESC";

if ($status !== 'all') {
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["error" => "Prepare failed: " . $conn->error]);
        exit;
    }
    $stmt->bind_param("s", $status);
    $stmt->execute();
    $result = $stmt->get_result();
} else {
    $result = $conn->query($sql);
}

if (!$result) {
    http_response_code(500);
    echo json_encode(["error" => "Query failed: " . $conn->error]);
    exit;
}

$requests = [];
while ($row = $result->fetch_assoc()) {
    $requests[] = [
        'id'           => $row['id'],
        'firstname'    => $row['firstname'] ?? '',
        'middlename'   => $row['middlename'] ?? '',
        'lastname'     => $row['lastname'] ?? '',
        'suffix'       => $row['suffix'] ?? '',
        'address'      => $row['address'] ?? '',
        'birthdate'    => $row['birthdate'] ?? '',
        'email'        => $row['email'] ?? '',
        'service'      => $row['service'] ?? '',
        'date'         => $row['appointment_date'],
        'time'         => $row['appointment_time'],
        'status'       => $row['status'] ?? 'pending',
        'created_at'   => $row['created_at']
    ];
}

// Success: pure JSON
echo json_encode($requests);

if (isset($stmt)) $stmt->close();
$conn->close();
?>