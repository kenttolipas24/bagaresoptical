<?php
// ==============================================
// api/save_eye_exam.php
// Save eye examination results
// ==============================================

header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    $conn = new mysqli("localhost", "root", "", "bagares_system");
    
    if ($conn->connect_error) {
        throw new Exception("Database connection failed");
    }

    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!$data) {
        throw new Exception("Invalid JSON");
    }

    $appointment_id = intval($data['appointment_id'] ?? 0);
    $exam_date = $data['exam_date'] ?? null;

    if (!$appointment_id || !$exam_date) {
        throw new Exception("Missing appointment ID or exam date");
    }

    // Get patient_id from appointment
    $stmt = $conn->prepare("SELECT patient_id FROM appointment WHERE appointment_id = ?");
    $stmt->bind_param("i", $appointment_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception("Appointment not found");
    }
    
    $row = $result->fetch_assoc();
    $patient_id = $row['patient_id'];
    $stmt->close();

    // 🔥 FIX: Set request_id to NULL since there's no direct link
    $request_id = null;

    // Insert eye examination with NULL request_id
    $insertStmt = $conn->prepare("
        INSERT INTO eye_examinations (
            patient_id,
            appointment_id,
            request_id,
            exam_date,
            od_sph,
            od_cyl,
            od_axis,
            od_add,
            os_sph,
            os_cyl,
            os_axis,
            os_add,
            pd,
            lens_type,
            lens_material,
            created_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())
    ");

    // Convert values to proper types
    $od_sph = $data['od_sph'] !== '' ? floatval($data['od_sph']) : 0;
    $od_cyl = $data['od_cyl'] !== '' ? floatval($data['od_cyl']) : 0;
    $od_axis = $data['od_axis'] !== '' ? intval($data['od_axis']) : 0;
    $od_add = $data['od_add'] !== '' ? floatval($data['od_add']) : 0;
    
    $os_sph = $data['os_sph'] !== '' ? floatval($data['os_sph']) : 0;
    $os_cyl = $data['os_cyl'] !== '' ? floatval($data['os_cyl']) : 0;
    $os_axis = $data['os_axis'] !== '' ? intval($data['os_axis']) : 0;
    $os_add = $data['os_add'] !== '' ? floatval($data['os_add']) : 0;
    
    $pd = $data['pd'] !== '' ? intval($data['pd']) : 0;

    // 15 parameters: 3 ints (patient_id, appointment_id, request_id=NULL), 
    // 1 string (exam_date), 8 decimals, 3 ints, 2 strings
    $insertStmt->bind_param(
        "iiisddiddiddiss",
        $patient_id,
        $appointment_id,
        $request_id,
        $exam_date,
        $od_sph,
        $od_cyl,
        $od_axis,
        $od_add,
        $os_sph,
        $os_cyl,
        $os_axis,
        $os_add,
        $pd,
        $data['lens_type'],
        $data['lens_material']
    );

    if (!$insertStmt->execute()) {
        throw new Exception("Failed to save examination: " . $insertStmt->error);
    }

    $exam_id = $conn->insert_id;
    $insertStmt->close();

    // Update appointment status to completed
    $updateStmt = $conn->prepare("
        UPDATE appointment
        SET status = 'completed'
        WHERE appointment_id = ?
    ");
    
    $updateStmt->bind_param("i", $appointment_id);
    $updateStmt->execute();
    $updateStmt->close();

    echo json_encode([
        "success" => true,
        "exam_id" => $exam_id,
        "message" => "Eye examination saved successfully"
    ]);

    $conn->close();

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>