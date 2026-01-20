<?php
// ==============================================
// submit_booking.php
// ==============================================

// CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = [
    'http://localhost',
    'http://127.0.0.1',
    'https://bagaresoptical-com.onrender.com'
];

if (in_array($origin, $allowed)) {
    header("Access-Control-Allow-Origin: $origin");
}
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// DB CONNECT (LOCAL + RENDER)
$isLocal = in_array($_SERVER['HTTP_HOST'], ['localhost', '127.0.0.1']);

if ($isLocal) {
    require_once __DIR__ . '/../db.php';
} else {
    $conn = new mysqli(
        $_ENV['DB_HOST'],
        $_ENV['DB_USER'],
        $_ENV['DB_PASS'],
        $_ENV['DB_NAME'],
        $_ENV['DB_PORT'] ?? 3306
    );
    if ($conn->connect_error) {
        throw new Exception("DB connection failed");
    }
    $conn->set_charset("utf8mb4");
}

try {
    $input = json_decode(file_get_contents("php://input"), true);
    if (!$input) throw new Exception("Invalid JSON");

    $required = ['service','date','time','firstname','lastname','address','birthdate','email'];
    foreach ($required as $f) {
        if (empty($input[$f])) throw new Exception("Missing field: $f");
    }

    if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception("Invalid email");
    }

    // ==========================================
    // STEP 1: CREATE OR FIND PATIENT
    // ==========================================
    
    // Check if patient already exists (by email + name)
    $checkStmt = $conn->prepare("
        SELECT patient_id 
        FROM patient 
        WHERE email = ? AND firstname = ? AND lastname = ?
    ");
    
    $checkStmt->bind_param(
        "sss",
        $input['email'],
        $input['firstname'],
        $input['lastname']
    );
    
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    $existing = $result->fetch_assoc();
    
    if ($existing) {
        // Patient exists, use their ID
        $patient_id = $existing['patient_id'];
    } else {
        // New patient, create record
        $patientStmt = $conn->prepare("
            INSERT INTO patient 
            (firstname, middlename, lastname, suffix, address, birthdate, email, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $patientStmt->bind_param(
            "sssssss",
            $input['firstname'],
            $input['middlename'],
            $input['lastname'],
            $input['suffix'],
            $input['address'],
            $input['birthdate'],
            $input['email']
        );
        
        $patientStmt->execute();
        $patient_id = $conn->insert_id;
        $patientStmt->close();
    }
    
    $checkStmt->close();

    // ==========================================
    // STEP 2: CREATE BOOKING REQUEST
    // ==========================================
    
    $stmt = $conn->prepare("
        INSERT INTO patient_request
        (patient_id, service, appointment_date, appointment_time, status, created_at)
        VALUES (?, ?, ?, ?, 'pending', NOW())
    ");

    $stmt->bind_param(
        "isss",
        $patient_id,
        $input['service'],
        $input['date'],
        $input['time']
    );

    $stmt->execute();

    echo json_encode([
        "success" => true,
        "request_id" => $stmt->insert_id,
        "patient_id" => $patient_id
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["success"=>false,"error"=>$e->getMessage()]);
}
?>