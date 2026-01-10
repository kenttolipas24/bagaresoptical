<?php
// api/confirm_booking.php
error_reporting(0);
ini_set('display_errors', 0);

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

try {
    $conn = new mysqli("localhost", "root", "", "bagares_system");
    
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

    // Start transaction for safety
    $conn->begin_transaction();
    
    // 1. Get booking request details from patient_request table
    $stmt = $conn->prepare("
        SELECT 
            firstname, middlename, lastname, suffix,
            email, birthdate, address,
            appointment_date, appointment_time, service,
            status
        FROM patient_request 
        WHERE id = ? AND status = 'pending'
    ");
    $stmt->bind_param("i", $requestId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception('Booking request not found or already processed');
    }
    
    $booking = $result->fetch_assoc();
    $stmt->close();

    // 2. Update the status to 'confirmed'
    $stmt = $conn->prepare("
        UPDATE patient_request 
        SET status = 'confirmed', updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->bind_param("i", $requestId);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to update booking status: " . $stmt->error);
    }
    
    if ($stmt->affected_rows === 0) {
        throw new Exception("No rows updated - booking may have already been confirmed");
    }
    
    $stmt->close();
    
    // Commit transaction
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