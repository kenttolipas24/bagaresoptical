<?php
// ==============================================
// api/get_appointment_details.php
// Get appointment details with patient info
// ==============================================

error_reporting(0);
ini_set('display_errors', 0);

header("Content-Type: application/json");

try {
    $conn = new mysqli("localhost", "root", "", "bagares_system");
    
    if ($conn->connect_error) {
        throw new Exception("Database connection failed");
    }

    $appointmentId = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if (!$appointmentId) {
        throw new Exception('Appointment ID is required');
    }

    // Get appointment and patient details by joining tables
    $stmt = $conn->prepare("
        SELECT 
            a.appointment_id,
            a.patient_id,
            a.appointment_date,
            a.appointment_time,
            a.service,
            a.status,
            CONCAT(
                p.firstname, ' ', 
                COALESCE(CONCAT(p.middlename, ' '), ''), 
                p.lastname,
                COALESCE(CONCAT(' ', p.suffix), '')
            ) as patient_name,
            p.firstname,
            p.middlename,
            p.lastname,
            p.suffix,
            p.email,
            p.birthdate,
            p.address,
            p.phone
        FROM appointment a
        JOIN patient p ON a.patient_id = p.patient_id
        WHERE a.appointment_id = ?
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

    // Check if there's existing exam data for this patient
    $examStmt = $conn->prepare("
        SELECT * FROM eye_examinations 
        WHERE patient_id = ? 
        ORDER BY exam_date DESC 
        LIMIT 1
    ");
    
    $examStmt->bind_param("i", $appointment['patient_id']);
    $examStmt->execute();
    $examResult = $examStmt->get_result();
    
    if ($examResult->num_rows > 0) {
        $appointment['exam_data'] = $examResult->fetch_assoc();
    }
    
    $examStmt->close();
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