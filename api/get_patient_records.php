<?php
// ==============================================
// get_patient_records.php
// Fetch patient records with their latest eye examination
// ONLY SHOWS PATIENTS WHO HAVE BEEN EXAMINED
// ==============================================

// header("Content-Type: application/json");
// error_reporting(0);
// ini_set('display_errors', 0);

// try {
//     $conn = new mysqli("localhost", "root", "", "bagares_system");
    
//     if ($conn->connect_error) {
//         throw new Exception("Database connection failed");
//     }
    
//     $conn->set_charset("utf8mb4");
    
//     // Get ONLY patients with eye examination results
//     $sql = "SELECT 
//                 p.patient_id,
//                 p.firstname,
//                 p.middlename,
//                 p.lastname,
//                 p.suffix,
//                 p.address,
//                 p.birthdate,
//                 p.email,
//                 p.phone,
//                 e.exam_id,
//                 e.exam_date,
//                 e.od_sph,
//                 e.od_cyl,
//                 e.od_axis,
//                 e.od_add,
//                 e.os_sph,
//                 e.os_cyl,
//                 e.os_axis,
//                 e.os_add,
//                 e.pd
//             FROM patient p
//             INNER JOIN (
//                 SELECT 
//                     patient_id,
//                     exam_id,
//                     exam_date,
//                     od_sph,
//                     od_cyl,
//                     od_axis,
//                     od_add,
//                     os_sph,
//                     os_cyl,
//                     os_axis,
//                     os_add,
//                     pd,
//                     ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY exam_date DESC) as rn
//                 FROM eye_examinations
//             ) e ON p.patient_id = e.patient_id AND e.rn = 1
//             ORDER BY e.exam_date DESC";
    
//     $result = $conn->query($sql);
    
    // if (!$result) {
    //     throw new Exception("Query failed: " . $conn->error);
    // }
    
    // $records = [];
    // while ($row = $result->fetch_assoc()) {
    //     $records[] = [
    //         'patient_id' => $row['patient_id'],
    //         'firstname' => $row['firstname'],
    //         'middlename' => $row['middlename'],
    //         'lastname' => $row['lastname'],
    //         'suffix' => $row['suffix'],
    //         'address' => $row['address'],
    //         'birthdate' => $row['birthdate'],
    //         'email' => $row['email'],
    //         'phone' => $row['phone'],
    //         'exam_date' => $row['exam_date'],
    //         'od_sph' => $row['od_sph'],
    //         'od_cyl' => $row['od_cyl'],
    //         'od_axis' => $row['od_axis'],
    //         'od_add' => $row['od_add'],
    //         'os_sph' => $row['os_sph'],
    //         'os_cyl' => $row['os_cyl'],
    //         'os_axis' => $row['os_axis'],
    //         'os_add' => $row['os_add'],
    //         'pd' => $row['pd']
    //     ];
    // }
    
    // echo json_encode($records);
    
    // $conn->close();
    
// } catch (Exception $e) {
//     http_response_code(500);
//     echo json_encode([
//         "error" => $e->getMessage()
//     ]);
// }








// ==============================================
// get_patient_records.php
// Fetch patient records with their latest eye examination
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
    
    // Get patients with their most recent eye examination
    $sql = "SELECT 
                p.patient_id,
                p.firstname,
                p.middlename,
                p.lastname,
                p.suffix,
                p.address,
                p.birthdate,
                p.email,
                p.phone,
                e.exam_id,
                e.exam_date,
                e.od_sph,
                e.od_cyl,
                e.od_axis,
                e.od_add,
                e.os_sph,
                e.os_cyl,
                e.os_axis,
                e.os_add,
                e.pd
            FROM patient p
            LEFT JOIN (
                SELECT 
                    patient_id,
                    exam_id,
                    exam_date,
                    od_sph,
                    od_cyl,
                    od_axis,
                    od_add,
                    os_sph,
                    os_cyl,
                    os_axis,
                    os_add,
                    pd,
                    ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY exam_date DESC) as rn
                FROM eye_examinations
            ) e ON p.patient_id = e.patient_id AND e.rn = 1
            ORDER BY p.created_at DESC";
    
    $result = $conn->query($sql);
    
    if (!$result) {
        throw new Exception("Query failed: " . $conn->error);
    }
    
    $records = [];
    while ($row = $result->fetch_assoc()) {
        $records[] = [
            'patient_id' => $row['patient_id'],
            'firstname' => $row['firstname'],
            'middlename' => $row['middlename'],
            'lastname' => $row['lastname'],
            'suffix' => $row['suffix'],
            'address' => $row['address'],
            'birthdate' => $row['birthdate'],
            'email' => $row['email'],
            'phone' => $row['phone'],
            'exam_date' => $row['exam_date'],
            'od_sph' => $row['od_sph'] ?? '—',
            'od_cyl' => $row['od_cyl'] ?? '—',
            'od_axis' => $row['od_axis'] ?? '—',
            'od_add' => $row['od_add'] ?? '—',
            'os_sph' => $row['os_sph'] ?? '—',
            'os_cyl' => $row['os_cyl'] ?? '—',
            'os_axis' => $row['os_axis'] ?? '—',
            'os_add' => $row['os_add'] ?? '—',
            'pd' => $row['pd'] ?? '—'
        ];
    }
    
    echo json_encode($records);
    
    $conn->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "error" => $e->getMessage()
    ]);
}



?>