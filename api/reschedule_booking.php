<?php
// ✅ CORS HEADERS FIRST
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

error_reporting(0);
ini_set('display_errors', 0);

try {
    $conn = new mysqli("sql210.infinityfree.com", "if0_40876922", "wwPkdzJx2o", "if0_40876922_bagares");
    
    if ($conn->connect_error) {
        throw new Exception("Database connection failed");
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $requestId = $input['request_id'] ?? null;
    $newDate = $input['new_date'] ?? null;
    $newTime = $input['new_time'] ?? null;
    
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
    $stmt->close();
    $conn->close();
    
    echo json_encode(['success' => true, 'message' => 'Appointment rescheduled']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>