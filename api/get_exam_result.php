<?php
// ==============================================
// api/get_exam_results.php
// ==============================================

// CORS Headers
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = [
    'http://localhost',
    'http://127.0.0.1',
    'https://bagaresopticalclinic.fwh.is'
];

if (in_array($origin, $allowed)) {
    header("Access-Control-Allow-Origin: $origin");
}
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 🔥 DB CONNECT (LOCALHOST + INFINITYFREE)
$isLocal = in_array($_SERVER['HTTP_HOST'], ['localhost', '127.0.0.1']);

try {
    if ($isLocal) {
        // 🏠 LOCALHOST (XAMPP)
        $conn = new mysqli("localhost", "root", "", "bagares_system");
    } else {
        // ☁️ INFINITYFREE
        $conn = new mysqli(
            "sql205.infinityfree.com",        
            "if0_40958657",                  
            "2xKP5yHV7yP5j",                  
            "if0_40958657_bagares_system"     
        );
    }
    
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }
    
    $conn->set_charset("utf8mb4");

    // Query all eye examination results
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
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}

if (isset($conn)) {
    $conn->close();
}
?>