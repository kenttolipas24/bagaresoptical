<?php
// Prevent any output before JSON
error_reporting(0); // Or handle errors properly
ini_set('display_errors', 0);

header("Content-Type: application/json");

try {
    $conn = new mysqli("localhost", "root", "", "bagares_system");
    
    if ($conn->connect_error) {
        throw new Exception("Database connection failed");
    }

    // Get and validate input
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Invalid JSON input");
    }

    // Validate required fields
    $required = ['firstname', 'lastname', 'username', 'email', 'role', 'password'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            throw new Exception("Missing required field: " . $field);
        }
    }

    // Validate email format
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception("Invalid email format");
    }

    // Check if username already exists
    $checkStmt = $conn->prepare("SELECT id FROM user_account WHERE username = ?");
    $checkStmt->bind_param("s", $data['username']);
    $checkStmt->execute();
    $checkStmt->store_result();
    
    if ($checkStmt->num_rows > 0) {
        throw new Exception("Username already exists");
    }
    $checkStmt->close();

    // Check if email already exists
    $checkStmt = $conn->prepare("SELECT id FROM user_account WHERE email = ?");
    $checkStmt->bind_param("s", $data['email']);
    $checkStmt->execute();
    $checkStmt->store_result();
    
    if ($checkStmt->num_rows > 0) {
        throw new Exception("Email already exists");
    }
    $checkStmt->close();

    // Hash password
    $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
    
    // Set default status to 'active' if not provided
    $status = isset($data['status']) ? $data['status'] : 'active';

    // Prepare and execute insert
    $stmt = $conn->prepare("
        INSERT INTO user_account
        (firstname, middlename, lastname, suffix, username, email, role, password, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    if (!$stmt) {
        throw new Exception("Failed to prepare statement: " . $conn->error);
    }

    $middlename = $data['middlename'] ?? '';
    $suffix = $data['suffix'] ?? '';

    $stmt->bind_param(
        "sssssssss",
        $data['firstname'],
        $middlename,
        $data['lastname'],
        $suffix,
        $data['username'],
        $data['email'],
        $data['role'],
        $passwordHash,
        $status
    );

    if (!$stmt->execute()) {
        throw new Exception("Failed to insert user: " . $stmt->error);
    }

    $userId = $conn->insert_id;
    $stmt->close();
    $conn->close();

    echo json_encode([
        "success" => true,
        "message" => "User added successfully",
        "userId" => $userId
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        "error" => $e->getMessage()
    ]);
}
?>