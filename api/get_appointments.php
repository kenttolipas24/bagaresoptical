<?php
// api/get_appointments.php
error_reporting(0);
ini_set('display_errors', 0);

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

try {
    $conn = new mysqli("localhost", "root", "", "bagares_system");
    
    if ($conn->connect_error) {
        throw new Exception("Database connection failed");
    }

    // Check if filtering by specific date
    $dateFilter = isset($_GET['date']) ? $_GET['date'] : null;
    
    if ($dateFilter) {
        // Get appointments for specific date (only confirmed status)
        $stmt = $conn->prepare("
            SELECT 
                id,
                CONCAT(
                    firstname, ' ', 
                    COALESCE(middlename, ''), ' ', 
                    lastname, ' ', 
                    COALESCE(suffix, '')
                ) as patient_name,
                appointment_date as date,
                appointment_time as time,
                service,
                status
            FROM patient_request
            WHERE appointment_date = ? 
            AND status = 'confirmed'
            ORDER BY appointment_time ASC
        ");
        $stmt->bind_param("s", $dateFilter);
    } else {
        // Get all confirmed appointments
        $stmt = $conn->prepare("
            SELECT 
                id,
                CONCAT(
                    firstname, ' ', 
                    COALESCE(middlename, ''), ' ', 
                    lastname, ' ', 
                    COALESCE(suffix, '')
                ) as patient_name,
                appointment_date as date,
                appointment_time as time,
                service,
                status
            FROM patient_request
            WHERE status = 'confirmed'
            ORDER BY appointment_date DESC, appointment_time ASC
        ");
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $appointments = [];
    while ($row = $result->fetch_assoc()) {
        // Clean up extra spaces in patient name
        $row['patient_name'] = preg_replace('/\s+/', ' ', trim($row['patient_name']));
        $appointments[] = $row;
    }
    
    $stmt->close();
    $conn->close();
    
    echo json_encode($appointments);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage()
    ]);
}
?>