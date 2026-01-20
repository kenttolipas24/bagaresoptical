<?php
// ==============================================
// cancel_booking.php
// ==============================================
error_reporting(0);
ini_set('display_errors', 0);

header("Content-Type: application/json");

try {
    $conn = new mysqli("localhost", "root", "", "bagares_system");
    
    if ($conn->connect_error) {
        throw new Exception("Database connection failed");
    }
    
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);
    
    if (!isset($data['request_id'])) {
        throw new Exception("Request ID is required");
    }
    
    // Extract numeric ID from "REQ-0001" format
    $requestId = intval(str_replace('REQ-', '', $data['request_id']));

    // Update status to cancelled
    $stmt = $conn->prepare("UPDATE patient_request SET status = 'cancelled', updated_at = NOW() WHERE id = ?");
    $stmt->bind_param("i", $requestId);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to cancel booking");
    }

    $stmt->close();
    $conn->close();
    
    echo json_encode([
        "success" => true,
        "message" => "Booking cancelled successfully"
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        "error" => $e->getMessage()
    ]);
}
?>