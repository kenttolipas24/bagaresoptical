<?php
// ==============================================
// confirm_booking.php - PRODUCTION READY (Render)
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

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        throw new Exception('Method not allowed');
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $requestId = $input['request_id'] ?? null;

    if (!$requestId) {
        http_response_code(400);
        throw new Exception('Request ID is required');
    }

    $conn->begin_transaction();

    $stmt = $conn->prepare("
        SELECT firstname, middlename, lastname, suffix, email, birthdate, address,
               appointment_date, appointment_time, service, status
        FROM patient_request 
        WHERE id = ? AND status = 'pending'
    ");
    $stmt->bind_param("i", $requestId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        throw new Exception('Booking request not found or already processed');
    }

    $stmt->close();

    $stmt = $conn->prepare("
        UPDATE patient_request 
        SET status = 'confirmed', updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->bind_param("i", $requestId);

    if (!$stmt->execute()) {
        throw new Exception("Failed to update status: " . $stmt->error);
    }

    if ($stmt->affected_rows === 0) {
        throw new Exception("No rows updated");
    }

    $stmt->close();

    $conn->commit();
    $conn->close();

    echo json_encode([
        'success' => true,
        'message' => 'Booking confirmed successfully'
    ]);

} catch (Exception $e) {
    if (isset($conn)) {
        $conn->rollback();
        $conn->close();
    }
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>