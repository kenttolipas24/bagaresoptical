<?php
header('Content-Type: application/json');
include 'db_connect.php'; // Ensure you have a central DB connection file

$data = json_decode(file_get_contents('php://input'), true);
$name = $data['name'];
$email = $data['email'];
$pass = password_hash($data['pass'], PASSWORD_BCRYPT);

try {
    $stmt = $pdo->prepare("INSERT INTO patient_account (full_name, email, password) VALUES (?, ?, ?)");
    $stmt->execute([$name, $email, $pass]);
    
    session_start();
    $_SESSION['patient_id'] = $pdo->lastInsertId();
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Registration failed: Email might exist.']);
}
?>