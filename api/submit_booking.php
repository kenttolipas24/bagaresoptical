<?php
// ================================
// submit_booking.php (Render-ready)
// ================================

// CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Hide PHP errors from JSON output
ini_set('display_errors', 0);
error_reporting(E_ALL);

try {
    // =========================
    // DATABASE CONNECTION
    // =========================
    $conn = new mysqli(
        $_ENV['DB_HOST'],
        $_ENV['DB_USER'],
        $_ENV['DB_PASS'],
        $_ENV['DB_NAME'],
        $_ENV['DB_PORT'] ?? 3306
    );

    if ($conn->connect_error) {
        throw new Exception("Database connection failed");
    }

    // =========================
    // READ JSON INPUT
    // =========================
    $rawInput = file_get_contents("php://input");
    if (!$rawInput) {
        throw new Exception("Empty request body");
    }

    $data = json_decode($rawInput, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Invalid JSON input");
    }

    // =========================
    // VALIDATION
    // =========================
    $required = [
        'service',
        'date',
        'time',
        'firstname',
        'middlename',
        'lastname',
        'address',
        'birthdate',
        'email'
    ];

    foreach ($required as $field) {
        if (!isset($data[$field]) || trim($data[$field]) === '') {
            throw new Exception("Missing required field: {$field}");
        }
    }

    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception("Invalid email format");
    }

    // =========================
    // INSERT DATA
    // =========================
    $stmt = $conn->prepare("
        INSERT INTO patient_request
        (
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
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
    ");

    if (!$stmt) {
        throw new Exception("Prepare failed");
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
        throw new Exception("Insert failed");
    }

    $insertId = $stmt->insert_id;
    $stmt->close();
    $conn->close();

    // =========================
    // SUCCESS RESPONSE
    // =========================
    echo json_encode([
        "success" => true,
        "message" => "Booking request submitted successfully",
        "request_id" => $insertId
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}
