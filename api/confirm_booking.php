<?php
// ==============================================
// confirm_booking.php (Fixed)
// ==============================================

// Disable HTML error output, use JSON only
error_reporting(0);
ini_set('display_errors', 0);

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    // Use corrected db.php
    require_once __DIR__ . '/../db.php';
    
    if (!isset($conn) || $conn->connect_error) {
        throw new Exception('Database connection failed');
    }

    // Only accept POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Method not allowed');
    }

    $input = json_decode(file_get_contents("php://input"), true);
    $request_id = $input['request_id'] ?? null;

    if (!$request_id) {
        throw new Exception("Request ID required");
    }

    // Start transaction for data consistency
    $conn->begin_transaction();

    // Get the booking request details
    $stmt = $conn->prepare("
        SELECT patient_id, service, appointment_date, appointment_time
        FROM patient_request
        WHERE id = ? AND status = 'pending'
    ");
    
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("i", $request_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $request = $result->fetch_assoc();
    $stmt->close();
    
    if (!$request) {
        throw new Exception("Booking request not found or already processed");
    }

    // Create appointment record
    $appointmentStmt = $conn->prepare("
        INSERT INTO appointment 
        (patient_id, appointment_date, appointment_time, service, status, created_at)
        VALUES (?, ?, ?, ?, 'scheduled', NOW())
    ");
    
    if (!$appointmentStmt) {
        throw new Exception("Prepare appointment failed: " . $conn->error);
    }
    
    $appointmentStmt->bind_param(
        "isss",
        $request['patient_id'],
        $request['appointment_date'],
        $request['appointment_time'],
        $request['service']
    );
    
    if (!$appointmentStmt->execute()) {
        throw new Exception("Insert appointment failed: " . $appointmentStmt->error);
    }
    
    $appointment_id = $conn->insert_id;
    $appointmentStmt->close();
    
    // Update request status to confirmed
    $updateStmt = $conn->prepare("
        UPDATE patient_request 
        SET status = 'confirmed', updated_at = NOW()
        WHERE id = ?
    ");
    
    if (!$updateStmt) {
        throw new Exception("Prepare update failed: " . $conn->error);
    }
    
    $updateStmt->bind_param("i", $request_id);
    
    if (!$updateStmt->execute()) {
        throw new Exception("Update failed: " . $updateStmt->error);
    }
    
    $updateStmt->close();

    // Commit transaction
    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Booking confirmed successfully",
        "appointment_id" => $appointment_id
    ]);

} catch (Exception $e) {
    // Rollback on error
    if (isset($conn) && $conn->ping()) {
        $conn->rollback();
    }
    
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
?>