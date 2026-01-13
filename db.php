<?php
$host = "localhost";
$user = "root";
$pass = "";
$db   = "bagares_system";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Local DB connection failed: " . $conn->connect_error);
}

$conn->set_charset("utf8mb4");
?>