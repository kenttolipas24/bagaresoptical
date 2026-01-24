<?php
// ==============================================
// api/save_eye_exam.php
// Save eye examination results (appointment_id nullable)
// ==============================================

header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    $conn = new mysqli("localhost", "root", "", "bagares_system");
    
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }

    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!$data) {
        throw new Exception("Invalid JSON");
    }

    // Allow appointment_id to be null
    $appointment_id = isset($data['appointment_id']) ? intval($data['appointment_id']) : null;
    $exam_date = $data['exam_date'] ?? null;

    $patient_id = null;

    // If appointment_id is provided, fetch patient_id from appointment
    if ($appointment_id) {
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
    }

    // If no appointment, patient_id must be provided in the request
    if (!$patient_id) {
        if (empty($data['patient_id'])) {
            throw new Exception("Patient ID is required when appointment is null");
        }
        $patient_id = intval($data['patient_id']);
    }

    // Convert eye exam fields to proper types
    $od_sph = isset($data['od_sph']) && $data['od_sph'] !== '' ? floatval($data['od_sph']) : 0;
    $od_cyl = isset($data['od_cyl']) && $data['od_cyl'] !== '' ? floatval($data['od_cyl']) : 0;
    $od_axis = isset($data['od_axis']) && $data['od_axis'] !== '' ? intval($data['od_axis']) : 0;
    $od_add = isset($data['od_add']) && $data['od_add'] !== '' ? floatval($data['od_add']) : 0;

    $os_sph = isset($data['os_sph']) && $data['os_sph'] !== '' ? floatval($data['os_sph']) : 0;
    $os_cyl = isset($data['os_cyl']) && $data['os_cyl'] !== '' ? floatval($data['os_cyl']) : 0;
    $os_axis = isset($data['os_axis']) && $data['os_axis'] !== '' ? intval($data['os_axis']) : 0;
    $os_add = isset($data['os_add']) && $data['os_add'] !== '' ? floatval($data['os_add']) : 0;

    $pd = isset($data['pd']) && $data['pd'] !== '' ? intval($data['pd']) : 0;

    $request_id = null; // No direct link

    // Prepare insert statement
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

    // Update appointment status only if appointment exists
    if ($appointment_id) {
        $updateStmt = $conn->prepare("
            UPDATE appointment
            SET status = 'completed'
            WHERE appointment_id = ?
        ");
        $updateStmt->bind_param("i", $appointment_id);
        $updateStmt->execute();
        $updateStmt->close();
    }

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
