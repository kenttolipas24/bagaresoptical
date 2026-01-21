<?php
// ==============================================
// api/get_exam_results.php
// Fetch all eye examination results
// ==============================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
error_reporting(0);
ini_set('display_errors', 0);

$conn = new mysqli("localhost", "root", "", "bagares_system");

if ($conn->connect_error) {
    echo json_encode([]);
    exit;
}

try {
    // Query matches your save_eye_exam.php structure
    $query = "
        SELECT 
            e.exam_id,
            e.patient_id,
            e.appointment_id,
            e.request_id,
            e.exam_date,
            e.od_sph,
            e.od_cyl,
            e.od_axis,
            e.od_add,
            e.os_sph,
            e.os_cyl,
            e.os_axis,
            e.os_add,
            e.pd,
            e.lens_type,
            e.lens_material,
            e.created_at,
            p.firstname,
            p.middlename,
            p.lastname,
            p.suffix,
            p.birthdate,
            p.address,
            p.email,
            p.phone
        FROM eye_examinations e
        INNER JOIN patient p ON e.patient_id = p.patient_id
        ORDER BY e.exam_date DESC, e.created_at DESC
    ";
    
    $result = $conn->query($query);
    
    if (!$result) {
        throw new Exception("Query failed: " . $conn->error);
    }
    
    $examResults = [];
    while ($row = $result->fetch_assoc()) {
        $examResults[] = $row;
    }
    
    echo json_encode($examResults);
    
} catch (Exception $e) {
    error_log("get_exam_results.php error: " . $e->getMessage());
    echo json_encode([]);
}

$conn->close();
?>