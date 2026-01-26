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

if (!$input || !is_array($input)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid JSON"]);
    exit;
}

// Required fields
$required = ['service', 'date', 'time', 'firstname', 'lastname', 'address', 'birthdate', 'email'];
foreach ($required as $field) {
    if (empty(trim($input[$field] ?? ''))) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Missing field: $field"]);
        exit;
    }
}

$conn->begin_transaction();

try {
    // Prepare variables first (this fixes the bind_param reference issue)
    $email     = $input['email'];
    $phone     = !empty($input['phone']) ? trim($input['phone']) : null;
    $firstname = trim($input['firstname']);
    $lastname  = trim($input['lastname']);
    $birthdate = $input['birthdate'];

    // Stricter patient lookup: match email/phone + name + birthdate
    $stmt = $conn->prepare("
        SELECT patient_id 
        FROM patient 
        WHERE (email = ? OR phone = ?)
          AND firstname  = ?
          AND lastname   = ?
          AND birthdate  = ?
        LIMIT 1
    ");

    $stmt->bind_param("sssss", $email, $phone, $firstname, $lastname, $birthdate);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($row = $res->fetch_assoc()) {
        $patient_id = $row['patient_id'];
    } else {
        // Create new patient
        $stmt = $conn->prepare("
            INSERT INTO patient 
            (firstname, middlename, lastname, suffix, address, birthdate, phone, email, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");

        $middlename = !empty($input['middlename']) ? trim($input['middlename']) : null;
        $suffix     = !empty($input['suffix'])     ? trim($input['suffix'])     : null;
        $address    = trim($input['address']);

        $stmt->bind_param(
            "ssssssss",
            $firstname,
            $middlename,
            $lastname,
            $suffix,
            $address,
            $birthdate,
            $phone,
            $email
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

    $service = $input['service'];
    $date    = $input['date'];
    $time    = $input['time'];

    $stmt->bind_param("isss", $patient_id, $service, $date, $time);
    $stmt->execute();
    $request_id = $conn->insert_id;
    $stmt->close();

    $conn->commit();

    echo json_encode([
        "success"    => true,
        "message"    => "Request submitted successfully",
        "request_id" => $request_id
    ]);

} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error"   => $e->getMessage()
    ]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}