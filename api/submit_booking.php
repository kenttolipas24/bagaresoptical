<?php
header("Content-Type: application/json");
error_reporting(0);
ini_set('display_errors', 0);

try {
    $conn = new mysqli("localhost", "root", "", "bagares_system");
    
    if ($conn->connect_error) {
        throw new Exception("Database connection failed");
    }
    
    $conn->set_charset("utf8mb4");
    
    $input = json_decode(file_get_contents("php://input"), true);
    if (!$input) throw new Exception("Invalid JSON");

    $required = ['service','date','time','firstname','lastname','address','birthdate','phone','email'];
    foreach ($required as $f) {
        if (empty($input[$f])) throw new Exception("Missing: $f");
    }

    $conn->begin_transaction();
    
    try {
        // Check if patient exists
        $checkStmt = $conn->prepare("
            SELECT patient_id 
            FROM patient 
            WHERE email = ? OR phone = ?
        ");
        
        $checkStmt->bind_param("ss", $input['email'], $input['phone']);
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        $existing = $result->fetch_assoc();
        $checkStmt->close();
        
        if ($existing) {
            // Update existing patient to 'online'
            $patient_id = $existing['patient_id'];
            $updateStmt = $conn->prepare("UPDATE patient SET patient_type = 'online' WHERE patient_id = ?");
            $updateStmt->bind_param("i", $patient_id);
            $updateStmt->execute();
            $updateStmt->close();
        } else {
            // Create new patient with patient_type = 'online'
            $patientStmt = $conn->prepare("
                INSERT INTO patient 
                (firstname, middlename, lastname, suffix, address, birthdate, phone, email, patient_type, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'online', NOW())
            ");
            
            $patientStmt->bind_param(
                "ssssssss",
                $input['firstname'],
                $input['middlename'],
                $input['lastname'],
                $input['suffix'],
                $input['address'],
                $input['birthdate'],
                $input['phone'],
                $input['email']
            );
            
            $patientStmt->execute();
            $patient_id = $conn->insert_id;
            $patientStmt->close();
        }
        
        // Create appointment
        $apptStmt = $conn->prepare("
            INSERT INTO appointment
            (patient_id, appointment_date, appointment_time, service, status, created_at)
            VALUES (?, ?, ?, ?, 'scheduled', NOW())
        ");
        
        $apptStmt->bind_param(
            "isss",
            $patient_id,
            $input['date'],
            $input['time'],
            $input['service']
        );
        
        $apptStmt->execute();
        $appointment_id = $apptStmt->insert_id;
        $apptStmt->close();
        
        $conn->commit();
        
        echo json_encode([
            "success" => true,
            "patient_id" => $patient_id,
            "appointment_id" => $appointment_id
        ]);
        
    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    }
    
    $conn->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>