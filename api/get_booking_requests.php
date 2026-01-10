<?php
// ../../api/get_booking_requests.php

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

// Get only PENDING requests by default (THIS IS THE KEY CHANGE)
$status = isset($_GET['status']) ? trim($_GET['status']) : 'pending';

$sql = "SELECT 
            id,
            service,
            appointment_date,
            appointment_time,
            firstname,
            middlename,
            lastname,
            suffix,
            address,
            birthdate,
            email,
            status,
            created_at
        FROM patient_request";

// Always filter by status (show pending by default, or specific status if requested)
if ($status !== 'all') {
    $sql .= " WHERE status = ?";
}

$sql .= " ORDER BY created_at DESC";

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
        'id'           => $row['id'],                          // Keep as string or int (both work)
        'firstname'    => $row['firstname'] ?? '',
        'middlename'   => $row['middlename'] ?? '',
        'lastname'     => $row['lastname'] ?? '',
        'suffix'       => $row['suffix'] ?? '',
        'address'      => $row['address'] ?? '',
        'birthdate'    => $row['birthdate'] ?? '',
        'email'        => $row['email'] ?? '',
        'service'      => $row['service'] ?? '',
        'date'         => $row['appointment_date'],            // Matches JS expectation
        'time'         => $row['appointment_time'],            // Matches JS expectation
        'status'       => $row['status'] ?? 'pending',
        'created_at'   => $row['created_at']
    ];
}

// Success: pure JSON
echo json_encode($requests);

if (isset($stmt)) $stmt->close();
$conn->close();
?>