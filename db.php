<?php
$host = "sql210.infinityfree.com";
$user = "if0_40876922";
$pass = "qLYjaZzaxUKa";
$db   = "if0_40876922_bagares";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Database connection failed: " . $conn->connect_error);
}

$conn->set_charset("utf8mb4");
?>