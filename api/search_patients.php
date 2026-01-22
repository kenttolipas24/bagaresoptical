<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$conn = new mysqli("localhost", "root", "", "bagares_system");

if ($conn->connect_error) {
    echo json_encode([]);
    exit;
}

$search = isset($_GET['search']) ? trim($_GET['search']) : '';

// 🔥 MODIFIED: If no search term, return all patients (limited)
if ($search === '') {
    $sql = "
        SELECT 
            patient_id as id,
            CONCAT(
                firstname, ' ',
                COALESCE(CONCAT(middlename, ' '), ''),
                lastname,
                COALESCE(CONCAT(' ', suffix), '')
            ) AS name
        FROM patient
        WHERE patient_type IN ('walk-in', 'online')
        ORDER BY firstname ASC, lastname ASC
        LIMIT 100
    ";
    
    $result = $conn->query($sql);
    $data = [];
    
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
    
    echo json_encode($data);
    $conn->close();
    exit;
}

// 🔥 ORIGINAL: Search functionality when term is provided
$sql = "
    SELECT 
        patient_id as id,
        CONCAT(
            firstname, ' ',
            COALESCE(CONCAT(middlename, ' '), ''),
            lastname,
            COALESCE(CONCAT(' ', suffix), '')
        ) AS name
    FROM patient
    WHERE 
        patient_type IN ('walk-in', 'online')
        AND (
            firstname LIKE ? OR
            lastname LIKE ? OR
            middlename LIKE ? OR
            CONCAT(firstname, ' ', lastname) LIKE ? OR
            CONCAT(firstname, ' ', middlename, ' ', lastname) LIKE ?
        )
    ORDER BY firstname ASC, lastname ASC
    LIMIT 20
";

$stmt = $conn->prepare($sql);
$like = "%$search%";
$stmt->bind_param("sssss", $like, $like, $like, $like, $like);
$stmt->execute();

$result = $stmt->get_result();
$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);

$stmt->close();
$conn->close();
?>