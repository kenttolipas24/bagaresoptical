<?php
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "bagares_system");
if ($conn->connect_error) {
    echo json_encode(["error" => "DB error"]);
    exit;
}

$sql = "SELECT id, firstname, middlename, lastname, suffix, username, email, role, created_at FROM user_account";
$result = $conn->query($sql);

$users = [];
while ($row = $result->fetch_assoc()) {
    $users[] = $row;
}

echo json_encode($users);
