<?php
$host = "localhost";
$port = 3306;
$user = "root";
$pass = "";
$db   = "bagares_system";

$conn = new mysqli($host, $user, $pass, $db, $port);

if ($conn->connect_error) {
    throw new Exception("Database connection failed");
}

$conn->set_charset("utf8mb4");
