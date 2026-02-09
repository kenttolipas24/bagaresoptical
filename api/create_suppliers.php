<?php
// Prevent any PHP errors from echoing as HTML and breaking JSON
error_reporting(0); 
header('Content-Type: application/json');

include '../db.php'; 

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(["status" => "error", "message" => "No data received"]);
    exit;
}

try {
    if (!isset($conn) || $conn->connect_error) {
        throw new Exception("Database connection failed. Check your db.php file.");
    }

    $stmt = $conn->prepare("INSERT INTO suppliers (supplier_name, contact_person, email, phone, category, status) VALUES (?, ?, ?, ?, ?, ?)");
    
    // Ensure all keys exist in the data array to prevent "Undefined index" errors
    $name    = $data['supplier_name'] ?? '';
    $contact = $data['contact_person'] ?? '';
    $email   = $data['email'] ?? '';
    $phone   = $data['phone'] ?? '';
    $cat     = $data['category'] ?? '';
    $stat    = $data['status'] ?? 'Active';

    $stmt->bind_param("ssssss", $name, $contact, $email, $phone, $cat, $stat);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Supplier added successfully"]);
    } else {
        throw new Exception($stmt->error);
    }

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

if (isset($conn)) $conn->close();
?>