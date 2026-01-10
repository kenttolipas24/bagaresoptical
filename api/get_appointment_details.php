<?php
// api/get_appointment_details.php
error_reporting(0);
ini_set('display_errors', 0);

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

try {
    $conn = new mysqli("localhost", "root", "", "bagares_system");
    
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }

    $appointmentId = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if (!$appointmentId) {
        throw new Exception('Appointment ID is required');
    }

    // Get appointment and patient details BY ID
    $stmt = $conn->prepare("
        SELECT 
            id,
            CONCAT(
                firstname, ' ', 
                COALESCE(CONCAT(middlename, ' '), ''), 
                lastname,
                COALESCE(CONCAT(' ', suffix), '')
            ) as patient_name,
            firstname,
            middlename,
            lastname,
            suffix,
            email,
            birthdate,
            address,
            appointment_date,
            appointment_time,
            service,
            status
        FROM patient_request
        WHERE id = ?
    ");
    
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmt->bind_param("i", $appointmentId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception('Appointment not found');
    }
    
    $appointment = $result->fetch_assoc();
    
    // Clean up patient name
    $appointment['patient_name'] = preg_replace('/\s+/', ' ', trim($appointment['patient_name']));
    
    // Calculate age from birthdate
    if ($appointment['birthdate']) {
        $birthDate = new DateTime($appointment['birthdate']);
        $today = new DateTime();
        $age = $birthDate->diff($today)->y;
        $appointment['age'] = $age;
    } else {
        $appointment['age'] = null;
    }
    
    $stmt->close();
    $conn->close();
    
    echo json_encode($appointment);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'error' => true,
        'message' => $e->getMessage()
    ]);
}
?>