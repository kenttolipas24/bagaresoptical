<?php
// ==============================================
// get_online_bookings.php - PRODUCTION READY (Render)
// ==============================================

// CORS Headers
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed_origins = [
    'https://bagaresoptical-com.onrender.com',
    'http://localhost'
];

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: *"); // Temporary for debugging
}
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

error_reporting(0);
ini_set('display_errors', 0);

try {
    // Render Database Connection (REPLACE THESE WITH YOUR ACTUAL RENDER DB CREDENTIALS)
    $conn = new mysqli(
        "mysql-xxxx.provider.com",      // ← your DB_HOST (copy exactly from dashboard)
        "admin",                        // ← your DB_USER
        "12345678",                     // ← your DB_PASS (keep secure!)
        "bagares_system",               // ← your DB_NAME
        3306                            // ← your DB_PORT
    );

    if ($conn->connect_error) {
        throw new Exception("Database connection failed");
    }

    // Get status filter (default: pending)
    $status = isset($_GET['status']) ? trim($_GET['status']) : 'pending';

    // Query
    $sql = "SELECT 
                id, service, appointment_date, appointment_time, firstname, middlename, 
                lastname, suffix, address, birthdate, email, status, created_at
            FROM patient_request";

    if ($status !== 'all') {
        $sql .= " WHERE status = ?";
    }

    $sql .= " ORDER BY created_at DESC";

    // Execute
    if ($status !== 'all') {
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $status);
        $stmt->execute();
        $result = $stmt->get_result();
    } else {
        $result = $conn->query($sql);
    }

    if (!$result) {
        throw new Exception("Query failed");
    }

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
            'source'       => 'online'
        ];
    }

    echo json_encode([
        'success' => true,
        'data'    => $requests,
        'count'   => count($requests)
    ]);

    if (isset($stmt)) $stmt->close();
    $conn->close();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => $e->getMessage()
    ]);
}
?>