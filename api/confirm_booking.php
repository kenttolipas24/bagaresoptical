<?php
// ==============================================
// confirm_booking.php
// ==============================================
header("Content-Type: application/json");

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, ['http://localhost','https://bagaresoptical-com.onrender.com'])) {
    header("Access-Control-Allow-Origin: $origin");
}

$isLocal = in_array($_SERVER['HTTP_HOST'], ['localhost','127.0.0.1']);

if ($isLocal) {
    require_once __DIR__ . '/../db.php';
} else {
    $conn = new mysqli(
        $_ENV['DB_HOST'],
        $_ENV['DB_USER'],
        $_ENV['DB_PASS'],
        $_ENV['DB_NAME'],
        $_ENV['DB_PORT'] ?? 3306
    );
    if ($conn->connect_error) {
        throw new Exception("DB connection failed");
    }
    $conn->set_charset("utf8mb4");
}

try {
    $input = json_decode(file_get_contents("php://input"), true);
    $request_id = $input['request_id'] ?? null;

    if (!$request_id) {
        throw new Exception("Request ID required");
    }

    // Get the booking request details
    $stmt = $conn->prepare("
        SELECT patient_id, service, appointment_date, appointment_time
        FROM patient_request
        WHERE id = ?
    ");
    $stmt->bind_param("i", $request_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $request = $result->fetch_assoc();
    
    if (!$request) {
        throw new Exception("Booking request not found");
    }
    
    $stmt->close();

    // Create appointment record
    $appointmentStmt = $conn->prepare("
        INSERT INTO appointment 
        (patient_id, appointment_date, appointment_time, service, status, created_at)
        VALUES (?, ?, ?, ?, 'scheduled', NOW())
    ");
    
    $appointmentStmt->bind_param(
        "isss",
        $request['patient_id'],
        $request['appointment_date'],
        $request['appointment_time'],
        $request['service']
    );
    
    $appointmentStmt->execute();
    $appointment_id = $conn->insert_id;
    $appointmentStmt->close();
    
    // Update request status to confirmed
    $updateStmt = $conn->prepare("
        UPDATE patient_request 
        SET status = 'confirmed', updated_at = NOW()
        WHERE id = ?
    ");
    $updateStmt->bind_param("i", $request_id);
    $updateStmt->execute();
    $updateStmt->close();

    echo json_encode([
        "success" => true,
        "message" => "Booking confirmed",
        "appointment_id" => $appointment_id
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["success"=>false,"error"=>$e->getMessage()]);
}

$conn->close();
?>