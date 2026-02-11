<?php
session_start();
header('Content-Type: application/json');

// Check the session variable you set during login
$isLoggedIn = isset($_SESSION['patient_id']);

echo json_encode([
    'isLoggedIn' => $isLoggedIn,
    'patient_id' => $isLoggedIn ? $_SESSION['patient_id'] : null
]);
?>