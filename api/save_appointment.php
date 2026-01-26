<?php
header('Content-Type: application/json');

$conn = new mysqli("localhost", "root", "", "bagares_system");
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'error' => 'DB connection failed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

// Required fields validation
if (empty($data['firstname']) || empty($data['lastname']) ||
    empty($data['appointment_date']) || empty($data['appointment_time']) ||
    empty($data['service'])) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

$conn->begin_transaction();

try {
    $patient_id = null;

    // Try to find existing patient
    $stmt = $conn->prepare("
        SELECT patient_id 
        FROM patient 
        WHERE firstname = ? 
          AND lastname = ?
          AND (COALESCE(middlename, '') = COALESCE(?, ''))
          AND (COALESCE(suffix, '') = COALESCE(?, ''))
        LIMIT 1
    ");

    $middlename = $data['middlename'] ?? null;
    $suffix     = $data['suffix']     ?? null;
    $phone      = $data['phone']      ?? null;
    $email      = $data['email']      ?? null;

    $stmt->bind_param("ssss",
        $data['firstname'],
        $data['lastname'],
        $middlename,
        $suffix
    );

    $stmt->execute();
    $res = $stmt->get_result();

    if ($row = $res->fetch_assoc()) {
        $patient_id = $row['patient_id'];
    }
    $stmt->close();

    // Create new patient if not found
    if (!$patient_id) {
        $stmt = $conn->prepare("
            INSERT INTO patient 
            (firstname, middlename, lastname, suffix, phone, email, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");

        $stmt->bind_param("ssssss",
            $data['firstname'],
            $middlename,
            $data['lastname'],
            $suffix,
            $phone,
            $email
        );
        $stmt->execute();
        $patient_id = $conn->insert_id;
        $stmt->close();
    }

    // Insert appointment
    $stmt = $conn->prepare("
        INSERT INTO appointment 
        (patient_id, appointment_date, appointment_time, service, status, notes, created_at)
        VALUES (?, ?, ?, ?, 'scheduled', ?, NOW())
    ");

    $notes = $data['notes'] ?? null;
    $stmt->bind_param("issss",
        $patient_id,
        $data['appointment_date'],
        $data['appointment_time'],
        $data['service'],
        $notes
    );

    $stmt->execute();
    $stmt->close();

    $conn->commit();

    echo json_encode(['success' => true]);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

$conn->close();
?>