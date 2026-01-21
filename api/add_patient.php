<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$conn = new mysqli("localhost", "root", "", "bagares_system");

if ($conn->connect_error) {
    echo json_encode([
        "success" => false,
        "error" => "Database connection failed"
    ]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode([
        "success" => false,
        "error" => "Invalid JSON payload"
    ]);
    exit;
}

// Extract patient data
$firstname = trim($data['firstname'] ?? '');
$middlename = trim($data['middlename'] ?? '');
$lastname = trim($data['lastname'] ?? '');
$suffix = trim($data['suffix'] ?? '');
$email = trim($data['email'] ?? '');
$birthdate = $data['birthdate'] ?? '';
$address = trim($data['address'] ?? '');
$phone = trim($data['phone'] ?? '');

// Validate required fields (only firstname, lastname, and birthdate are required)
if (empty($firstname) || empty($lastname) || empty($birthdate)) {
    $missing = [];
    if (empty($firstname)) $missing[] = 'firstname';
    if (empty($lastname)) $missing[] = 'lastname';
    if (empty($birthdate)) $missing[] = 'birthdate';
    
    echo json_encode([
        "success" => false,
        "error" => "Missing required fields: " . implode(', ', $missing)
    ]);
    exit;
}

try {
    // Insert patient into database
    $stmt = $conn->prepare("
        INSERT INTO patient 
        (firstname, middlename, lastname, suffix, email, birthdate, address, phone, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    
    $stmt->bind_param(
        "ssssssss",
        $firstname,
        $middlename,
        $lastname,
        $suffix,
        $email,
        $birthdate,
        $address,
        $phone
    );
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to insert patient: " . $stmt->error);
    }
    
    $patient_id = $conn->insert_id;
    $stmt->close();
    
    echo json_encode([
        "success" => true,
        "patient_id" => $patient_id,
        "message" => "Patient added successfully"
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}

$conn->close();
?>