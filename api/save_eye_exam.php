<?php
// ==============================================
// api/save_eye_exam.php
// Save eye examination results
// ==============================================

header('Content-Type: application/json');
error_reporting(0);
ini_set('display_errors', 0);

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

    // Insert eye examination
    $insertStmt = $conn->prepare("
        INSERT INTO eye_examinations (
            patient_id,
            appointment_id,
            exam_date,
            od_sph, od_cyl, od_axis, od_add,
            os_sph, os_cyl, os_axis, os_add,
            pd,
            lens_type,
            lens_material,
            exam_notes,
            created_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())
    ");

    $insertStmt->bind_param(
        "iisddiddiddiss",
        $patient_id,
        $appointment_id,
        $exam_date,
        $data['od_sph'],
        $data['od_cyl'],
        $data['od_axis'],
        $data['od_add'],
        $data['os_sph'],
        $data['os_cyl'],
        $data['os_axis'],
        $data['os_add'],
        $data['pd'],
        $data['lens_type'],
        $data['lens_material'],
        $data['notes']
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