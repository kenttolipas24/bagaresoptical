<?php
error_reporting(0);
ini_set('display_errors', 0);

header("Content-Type: application/json");

try {
    $conn = new mysqli("localhost", "root", "", "bagares_system");
    
    if ($conn->connect_error) {
        throw new Exception("Database connection failed");
    }

    // Get and validate input
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Invalid JSON input");
    }

    // Validate required fields (NO PHONE)
    $required = ['service', 'date', 'time', 'firstname', 'middlename', 'lastname', 
                 'address', 'birthdate', 'email'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            throw new Exception("Missing required field: " . $field);
        }
    }

    // Validate email format
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception("Invalid email format");
    }

    // Prepare and execute insert (NO PHONE)
    $stmt = $conn->prepare("
        INSERT INTO patient_request
        (service, appointment_date, appointment_time, firstname, middlename, lastname, 
         suffix, address, birthdate, email, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
    ");

    if (!$stmt) {
        throw new Exception("Failed to prepare statement: " . $conn->error);
    }

    $suffix = $data['suffix'] ?? '';

    $stmt->bind_param(
        "ssssssssss",
        $data['service'],
        $data['date'],
        $data['time'],
        $data['firstname'],
        $data['middlename'],
        $data['lastname'],
        $suffix,
        $data['address'],
        $data['birthdate'],
        $data['email']
    );

    if (!$stmt->execute()) {
        throw new Exception("Failed to submit booking: " . $stmt->error);
    }

    $requestId = $conn->insert_id;
    $stmt->close();
    $conn->close();

    echo json_encode([
        "success" => true,
        "message" => "Booking request submitted successfully",
        "request_id" => $requestId
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        "error" => $e->getMessage()
    ]);
}
?>