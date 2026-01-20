<?php
// ==============================================
// get_appointments.php
// Fetch confirmed appointments from appointment table
// ==============================================

header("Content-Type: application/json");
error_reporting(0);
ini_set('display_errors', 0);

try {
    $conn = new mysqli("localhost", "root", "", "bagares_system");
    
    if ($conn->connect_error) {
        throw new Exception("Database connection failed");
    }
    
    $conn->set_charset("utf8mb4");
    
    // Check if filtering by specific date
    $dateFilter = isset($_GET['date']) ? $_GET['date'] : null;
    
    // Query appointments with patient names
    $sql = "SELECT 
                a.appointment_id,
                a.patient_id,
                a.appointment_date,
                a.appointment_time,
                a.service,
                a.status,
                a.created_at,
                CONCAT(p.firstname, ' ', 
                       COALESCE(p.middlename, ''), ' ', 
                       p.lastname, ' ', 
                       COALESCE(p.suffix, '')) as patient_name
            FROM appointment a
            JOIN patient p ON a.patient_id = p.patient_id
            WHERE a.status = 'scheduled'";
    
    // Add date filter if provided
    if ($dateFilter) {
        $sql .= " AND a.appointment_date = ?";
    }
    
    $sql .= " ORDER BY a.appointment_date DESC, a.appointment_time DESC";
    
    if ($dateFilter) {
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $dateFilter);
        $stmt->execute();
        $result = $stmt->get_result();
    } else {
        $result = $conn->query($sql);
    }
    
    if (!$result) {
        throw new Exception("Query failed: " . $conn->error);
    }
    
    $appointments = [];
    while ($row = $result->fetch_assoc()) {
        $appointments[] = [
            'appointment_id' => $row['appointment_id'],
            'patient_id' => $row['patient_id'],
            'patient_name' => trim($row['patient_name']),
            'appointment_date' => $row['appointment_date'],
            'appointment_time' => $row['appointment_time'],
            'service' => $row['service'],
            'status' => $row['status'],
            'created_at' => $row['created_at']
        ];
    }
    
    echo json_encode($appointments);
    
    if (isset($stmt)) $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "error" => $e->getMessage()
    ]);
}
?>