<?php
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "bagares_system");

if ($conn->connect_error) {
    die(json_encode(['success' => false, 'message' => 'Connection failed']));
}

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if (!$id) {
    die(json_encode(['success' => false, 'message' => 'ID required']));
}

// Try as appointment_id first
$stmt = $conn->prepare("
    SELECT 
        a.appointment_id,
        a.patient_id,
        p.firstname,
        p.middlename,
        p.lastname,
        p.suffix,
        p.email,
        p.birthdate,
        p.address,
        p.phone,
        p.patient_type
    FROM appointment a
    JOIN patient p ON a.patient_id = p.patient_id
    WHERE a.appointment_id = ?
");

$stmt->bind_param("i", $id);
$stmt->execute();
$result = $stmt->get_result();

// If not found as appointment, try as patient_id
if ($result->num_rows === 0) {
    $stmt->close();
    
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
    
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        die(json_encode(['success' => false, 'message' => 'Patient not found']));
    }
}

$data = $result->fetch_assoc();
$stmt->close();

// Build name
$name = trim($data['firstname'] . ' ' . 
              ($data['middlename'] ?? '') . ' ' . 
              $data['lastname'] . ' ' . 
              ($data['suffix'] ?? ''));

// Calculate age
$age = null;
if ($data['birthdate']) {
    $birthDate = new DateTime($data['birthdate']);
    $today = new DateTime();
    $age = $birthDate->diff($today)->y;
}

// Format birthdate
$birthdateFormatted = $data['birthdate'] 
    ? date('F d, Y', strtotime($data['birthdate'])) 
    : null;

// Get patient_id
$patientId = $data['patient_id'] ?? $id;

// Check for exam
$examStmt = $conn->prepare("
    SELECT * FROM eye_examinations 
    WHERE patient_id = ? 
    ORDER BY exam_date DESC 
    LIMIT 1
");

$examStmt->bind_param("i", $patientId);
$examStmt->execute();
$examResult = $examStmt->get_result();

$examData = null;
$hasExam = false;

if ($examResult->num_rows > 0) {
    $examData = $examResult->fetch_assoc();
    $hasExam = true;
    if ($examData['exam_date']) {
        $examData['exam_date_formatted'] = date('F d, Y', strtotime($examData['exam_date']));
    }
}

$examStmt->close();
$conn->close();

echo json_encode([
    'success' => true,
    'patient_name' => $name,
    'age' => $age,
    'birthdate' => $birthdateFormatted,
    'email' => $data['email'] ?: 'N/A',
    'address' => $data['address'] ?: 'N/A',
    'phone' => $data['phone'] ?: 'N/A',
    'patient_type' => $data['patient_type'] ?: 'walk-in',
    'has_exam' => $hasExam,
    'exam_data' => $examData,
    'patient_id' => $patientId
]);
?>