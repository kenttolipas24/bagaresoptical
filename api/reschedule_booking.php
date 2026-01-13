<?php
// ==============================================
// reschedule_booking.php - PRODUCTION READY (Render)
// ==============================================

// CORS Headers
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
header("Content-Type: application/json");

// Preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

error_reporting(0);
ini_set('display_errors', 0);

try {
    // Render Database Connection (REPLACE WITH YOUR RENDER DB CREDENTIALS)
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

    $input = json_decode(file_get_contents('php://input'), true);

    $requestId = $input['request_id'] ?? null;
    $newDate   = $input['new_date'] ?? null;
    $newTime   = $input['new_time'] ?? null;

    if (!$requestId || !$newDate || !$newTime) {
        throw new Exception('Missing required fields');
    }

    $stmt = $conn->prepare("
        UPDATE patient_request 
        SET appointment_date = ?, 
            appointment_time = ?,
            status = 'rescheduled'
        WHERE id = ?
    ");

    $stmt->bind_param("ssi", $newDate, $newTime, $requestId);
    $stmt->execute();

    if ($stmt->affected_rows === 0) {
        throw new Exception('No booking found or already rescheduled');
    }

    $stmt->close();
    $conn->close();

    echo json_encode(['success' => true, 'message' => 'Appointment rescheduled']);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>