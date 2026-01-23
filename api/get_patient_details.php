<?php
// ==============================================
// api/get_patient_details.php
// Get patient info directly by patient_id (no appointment needed)
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

    // Get patient information
    $stmt = $conn->prepare("
        SELECT 
            patient_id,
            firstname,
            middlename,
            lastname,
            suffix,
            email,
            birthdate,
            address,
            phone,
            patient_type
        FROM patient 
        WHERE patient_id = ?
    ");
    
    if (!$stmt) {
        throw new Exception("Query failed: " . $conn->error);
    }
    
    $stmt->bind_param("i", $patientId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception('Patient #' . $patientId . ' not found');
    }
    
    $data = $result->fetch_assoc();
    $stmt->close();
    
    // Build full name
    $nameParts = array_filter([
        $data['firstname'],
        $data['middlename'],
        $data['lastname'],
        $data['suffix']
    ]);
    $fullName = implode(' ', $nameParts);
    
    // Calculate age
    $age = null;
    if ($data['birthdate']) {
        $birthDate = new DateTime($data['birthdate']);
        $today = new DateTime();
        $age = $birthDate->diff($today)->y;
    }
    
    // Format birthdate
    $birthdateFormatted = null;
    if ($data['birthdate']) {
        $birthdateFormatted = date('F d, Y', strtotime($data['birthdate']));
    }
    
    // Check for existing eye exam
    $examStmt = $conn->prepare("
        SELECT 
            exam_id,
            exam_date,
            od_sph, od_cyl, od_axis, od_add,
            os_sph, os_cyl, os_axis, os_add,
            pd,
            lens_type,
            lens_material,
            notes
        FROM eye_examinations 
        WHERE patient_id = ? 
        ORDER BY exam_date DESC 
        LIMIT 1
    ");
    
    $examData = null;
    $hasExam = false;
    
    if ($examStmt) {
        $examStmt->bind_param("i", $patientId);
        $examStmt->execute();
        $examResult = $examStmt->get_result();
        
        if ($examResult->num_rows > 0) {
            $examData = $examResult->fetch_assoc();
            $hasExam = true;
            
            if ($examData['exam_date']) {
                $examData['exam_date_formatted'] = date('F d, Y', strtotime($examData['exam_date']));
            }
        }
        $examStmt->close();
    }
    
    $conn->close();
    
    // Return response
    echo json_encode([
        'success' => true,
        'patient_id' => $data['patient_id'],
        'patient_name' => $fullName,
        'age' => $age,
        'birthdate' => $birthdateFormatted,
        'email' => $data['email'] ?: 'N/A',
        'address' => $data['address'] ?: 'N/A',
        'phone' => $data['phone'] ?: 'N/A',
        'patient_type' => $data['patient_type'] ?: 'walk-in',
        'has_exam' => $hasExam,
        'exam_data' => $examData
    ]);
    
} catch (Exception $e) {
    http_response_code(200);
    echo json_encode([
        'success' => false,
        'error' => true,
        'message' => $e->getMessage()
    ]);
}
?>