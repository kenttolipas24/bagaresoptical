<?php
// ==============================================
// api/get_patient_appointment.php
// Get the latest appointment ID for a patient
// ==============================================

header("Content-Type: application/json");

try {
    $conn = new mysqli("localhost", "root", "", "bagares_system");
    
    if ($conn->connect_error) {
        throw new Exception("Database connection failed");
    }

    $patientId = isset($_GET['patient_id']) ? intval($_GET['patient_id']) : 0;
    
    if (!$patientId) {
        throw new Exception('Patient ID is required');
    }

    // Get the most recent appointment for this patient
    // Note: Using appointment_id as the primary key column name
    $stmt = $conn->prepare("
        SELECT appointment_id, appointment_date, appointment_time, status 
        FROM appointment 
        WHERE patient_id = ? 
        ORDER BY appointment_date DESC, appointment_time DESC 
        LIMIT 1
    ");
    
    if (!$stmt) {
        throw new Exception("Query failed: " . $conn->error);
    }
    
    $stmt->bind_param("i", $patientId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $appointment = $result->fetch_assoc();
        
        echo json_encode([
            'success' => true,
            'appointment_id' => $appointment['appointment_id'],
            'appointment_date' => $appointment['appointment_date'],
            'appointment_time' => $appointment['appointment_time'],
            'status' => $appointment['status']
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No appointments found for this patient',
            'appointment_id' => null
        ]);
    }
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    http_response_code(200);
    echo json_encode([
        'success' => false,
        'error' => true,
        'message' => $e->getMessage()
    ]);
}
?>