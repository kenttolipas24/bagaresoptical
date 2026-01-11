<?php
session_start();
header("Content-Type: application/json");

// Enable error logging
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

try {
    $conn = new mysqli("localhost", "root", "", "bagares_system");
    
    if ($conn->connect_error) {
        throw new Exception("Database connection failed");
    }

    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!$data) {
        throw new Exception("Invalid JSON input");
    }
    
    $username = trim($data['username'] ?? '');
    $password = $data['password'] ?? '';

    if (empty($username) || empty($password)) {
        throw new Exception("Username and password are required");
    }

    $stmt = $conn->prepare("SELECT * FROM user_account WHERE username=? AND status='active'");
    
    if (!$stmt) {
        throw new Exception("Database error");
    }
    
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($user = $result->fetch_assoc()) {
        if (password_verify($password, $user['password'])) {
            
            // ✅ CRITICAL FIX: Normalize the role to lowercase before storing in session
            $normalizedRole = strtolower(trim($user['role']));
            
            $_SESSION['user'] = [
                "id" => $user['id'],
                "firstname" => $user['firstname'],
                "lastname" => $user['lastname'],
                "role" => $normalizedRole,  // ← Store normalized lowercase version
                "original_role" => $user['role']  // ← Keep original for display (Secretary/Cashier)
            ];
            
            echo json_encode([
                "success" => true,
                "user" => $_SESSION['user']
            ]);
            
            $stmt->close();
            $conn->close();
            exit;
        }
    }

    throw new Exception("Invalid username or password");

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>