<?php
session_start();
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "bagares_system");
if ($conn->connect_error) {
    echo json_encode(["success" => false]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$username = $data['username'];
$password = $data['password'];

$stmt = $conn->prepare("SELECT * FROM user_account WHERE username=? AND status='active'");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($user = $result->fetch_assoc()) {
    if (password_verify($password, $user['password'])) {
        $_SESSION['user'] = [
            "id" => $user['id'],
            "firstname" => $user['firstname'],
            "lastname" => $user['lastname'],
            "role" => $user['role']
        ];
        echo json_encode(["success" => true, "user" => $_SESSION['user']]);
        exit;
    }
}

echo json_encode(["success" => false]);
