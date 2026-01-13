<?php
// ==============================================
// submit_booking.php - PRODUCTION READY (Render)
// ==============================================

// CORS Headers - Allow Render frontend + localhost for testing
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed_origins = [
    'https://bagaresoptical-com.onrender.com',
    'http://localhost'
];

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: *"); // Temporary for debugging
}
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Max-Age: 86400");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

error_reporting(0);
ini_set('display_errors', 0);

try {
    // Render Database Connection (REPLACE THESE WITH YOUR ACTUAL RENDER DB CREDENTIALS)
    $conn = new mysqli(
        "mysql-xxxx.provider.com",      // ← your DB_HOST (copy exactly from dashboard)
        "admin",                        // ← your DB_USER
        "12345678",                     // ← your DB_PASS (keep secure!)
        "bagares_system",               // ← your DB_NAME
        3306                            // ← your DB_PORT
    );

    if ($conn->connect_error) {
        throw new Exception("Database connection failed");
    }

    // Read raw POST body
    $input = file_get_contents('php://input');
    if (empty($input)) {
        throw new Exception('No data received in request body');
    }

    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON: ' . json_last_error_msg());
    }

    // Required fields validation (NO PHONE)
    $required = [
        'service',
        'date',
        'time',
        'firstname',
        'lastname',
        'address',
        'birthdate',
        'email'
    ];

    foreach ($required as $field) {
        if (!isset($data[$field]) || trim($data[$field]) === '') {
            throw new Exception("Missing or empty required field: $field");
        }
    }

    $middlename = trim($data['middlename'] ?? '');
    $suffix     = trim($data['suffix'] ?? '');

    // Validate email
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception("Invalid email format");
    }

    // Prepare insert
    $stmt = $conn->prepare("
        INSERT INTO patient_request
        (service, appointment_date, appointment_time, firstname, middlename, lastname, 
         suffix, address, birthdate, email, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
    ");

    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }

    $stmt->bind_param(
        "ssssssssss",
        $data['service'],
        $data['date'],
        $data['time'],
        $data['firstname'],
        $middlename,
        $data['lastname'],
        $suffix,
        $data['address'],
        $data['birthdate'],
        $data['email']
    );

    if (!$stmt->execute()) {
        throw new Exception("Insert failed: " . $stmt->error);
    }

    $requestId = $conn->insert_id;

    $stmt->close();
    $conn->close();

    echo json_encode([
        "success" => true,
        "message" => "Booking submitted successfully",
        "request_id" => $requestId
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}
?>