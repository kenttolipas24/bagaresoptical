<?php
// Upload this to: InfinityFree /site/api/get_online_bookings.php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *"); // Allow localhost to access
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

error_reporting(0);
ini_set('display_errors', 0);

try {
    // InfinityFree database connection
    $DB_HOST = "sql210.infinityfree.com";
    $DB_USER = "if0_40876922";
    $DB_PASS = "wwPkdzJx2o";
    $DB_NAME = "if0_40876922_bagares";
    
    $conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
    
    if ($conn->connect_error) {
        throw new Exception("Database connection failed");
    }
    
    // Get status filter (default: pending)
    $status = isset($_GET['status']) ? trim($_GET['status']) : 'pending';
    
    // Query to get booking requests
    $sql = "SELECT 
                id,
                service,
                appointment_date,
                appointment_time,
                firstname,
                middlename,
                lastname,
                suffix,
                address,
                birthdate,
                email,
                status,
                created_at
            FROM patient_request";
    
    // Filter by status
    if ($status !== 'all') {
        $sql .= " WHERE status = ?";
    }
    
    $sql .= " ORDER BY created_at DESC";
    
    // Execute query
    if ($status !== 'all') {
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception("Prepare failed");
        }
        $stmt->bind_param("s", $status);
        $stmt->execute();
        $result = $stmt->get_result();
    } else {
        $result = $conn->query($sql);
    }
    
    if (!$result) {
        throw new Exception("Query failed");
    }
    
    // Fetch all requests
    $requests = [];
    while ($row = $result->fetch_assoc()) {
        $requests[] = [
            'id'           => $row['id'],
            'firstname'    => $row['firstname'] ?? '',
            'middlename'   => $row['middlename'] ?? '',
            'lastname'     => $row['lastname'] ?? '',
            'suffix'       => $row['suffix'] ?? '',
            'address'      => $row['address'] ?? '',
            'birthdate'    => $row['birthdate'] ?? '',
            'email'        => $row['email'] ?? '',
            'service'      => $row['service'] ?? '',
            'date'         => $row['appointment_date'],
            'time'         => $row['appointment_time'],
            'status'       => $row['status'] ?? 'pending',
            'created_at'   => $row['created_at'],
            'source'       => 'online' // Tag to identify it's from online
        ];
    }
    
    // Return JSON response
    echo json_encode([
        'success' => true,
        'data' => $requests,
        'count' => count($requests)
    ]);
    
    if (isset($stmt)) $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>