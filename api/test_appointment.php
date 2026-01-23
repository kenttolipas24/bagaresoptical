<?php
// ==============================================
// api/test_appointment.php
// Debug script to see what's in your database
// ==============================================

header("Content-Type: application/json");
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    $conn = new mysqli("localhost", "root", "", "bagares_system");
    
    if ($conn->connect_error) {
        die(json_encode(['error' => "Connection failed: " . $conn->connect_error]));
    }

    $appointmentId = isset($_GET['id']) ? intval($_GET['id']) : 0;

    $result = [
        'requested_id' => $appointmentId,
        'message' => 'Debug information for appointment system'
    ];

    // Get ALL appointments (last 20)
    $sql = "SELECT * FROM appointment ORDER BY appointment_id DESC LIMIT 20";
    $res = $conn->query($sql);
    
    if ($res) {
        $result['total_appointments'] = $res->num_rows;
        $result['appointments'] = [];
        
        while ($row = $res->fetch_assoc()) {
            $result['appointments'][] = $row;
        }
    } else {
        $result['appointments_error'] = $conn->error;
    }

    // Get ALL patients (last 20)
    $sql = "SELECT patient_id, firstname, lastname, email, patient_type FROM patient ORDER BY patient_id DESC LIMIT 20";
    $res = $conn->query($sql);
    
    if ($res) {
        $result['total_patients'] = $res->num_rows;
        $result['patients'] = [];
        
        while ($row = $res->fetch_assoc()) {
            $result['patients'][] = $row;
        }
    } else {
        $result['patients_error'] = $conn->error;
    }

    // If specific ID requested, check it
    if ($appointmentId > 0) {
        $stmt = $conn->prepare("SELECT * FROM appointment WHERE appointment_id = ?");
        
        if ($stmt) {
            $stmt->bind_param("i", $appointmentId);
            $stmt->execute();
            $res = $stmt->get_result();
            
            if ($res->num_rows > 0) {
                $result['requested_appointment'] = $res->fetch_assoc();
                $result['status'] = 'FOUND';
            } else {
                $result['requested_appointment'] = null;
                $result['status'] = 'NOT FOUND';
            }
            $stmt->close();
        }
    }

    echo json_encode($result, JSON_PRETTY_PRINT);
    $conn->close();

} catch (Exception $e) {
    echo json_encode([
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>