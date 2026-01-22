<?php
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "bagares_system");

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Connection failed"]);
    exit;
}

$conn->set_charset("utf8mb4");

$input = json_decode(file_get_contents("php://input"), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid JSON"]);
    exit;
}

// Required fields
$required = ['service', 'date', 'time', 'firstname', 'lastname', 'address', 'birthdate', 'phone', 'email'];
foreach ($required as $field) {
    if (empty(trim($input[$field] ?? ''))) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Missing field: $field"]);
        exit;
    }
}

$conn->begin_transaction();

try {
    // Find or create patient
    $stmt = $conn->prepare("SELECT patient_id FROM patient WHERE email = ? OR phone = ? LIMIT 1");
    $stmt->bind_param("ss", $input['email'], $input['phone']);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($row = $res->fetch_assoc()) {
        $patient_id = $row['patient_id'];
    } else {
        $stmt = $conn->prepare("
            INSERT INTO patient 
            (firstname, middlename, lastname, suffix, address, birthdate, phone, email, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $middlename = $input['middlename'] ?? null;
        $suffix = $input['suffix'] ?? null;
        $stmt->bind_param("ssssssss",
            $input['firstname'], $middlename, $input['lastname'], $suffix,
            $input['address'], $input['birthdate'], $input['phone'], $input['email']
        );
        $stmt->execute();
        $patient_id = $conn->insert_id;
    }
    $stmt->close();

    // Create request
    $stmt = $conn->prepare("
        INSERT INTO patient_request 
        (patient_id, service, appointment_date, appointment_time, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'pending', NOW(), NOW())
    ");
    $stmt->bind_param("isss", $patient_id, $input['service'], $input['date'], $input['time']);
    $stmt->execute();
    $request_id = $conn->insert_id;
    $stmt->close();

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Request submitted",
        "request_id" => $request_id
    ]);

} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}

$conn->close();