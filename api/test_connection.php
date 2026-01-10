<?php
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "bagares_system");

if ($conn->connect_error) {
    echo json_encode([
        'success' => false,
        'error' => 'Connection failed: ' . $conn->connect_error
    ]);
} else {
    // Test query
    $result = $conn->query("SELECT COUNT(*) as count FROM patient_request WHERE status = 'confirmed'");
    $row = $result->fetch_assoc();
    
    echo json_encode([
        'success' => true,
        'message' => 'Connected successfully',
        'confirmed_appointments' => $row['count']
    ]);
}

$conn->close();
?>