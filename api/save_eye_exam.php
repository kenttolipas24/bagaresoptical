<?php
header('Content-Type: application/json');
error_reporting(0);
ini_set('display_errors', 0);

$conn = new mysqli("localhost", "root", "", "bagares_system");
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "DB connection failed"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
if (!$data) {
    echo json_encode(["success" => false, "message" => "Invalid JSON"]);
    exit;
}

$request_id = intval($data['appointment_id'] ?? 0);
$exam_date  = $data['exam_date'] ?? null;

if (!$request_id || !$exam_date) {
    echo json_encode(["success" => false, "message" => "Missing required data"]);
    exit;
}

/* =========================
   INSERT EYE EXAMINATION
========================= */
$stmt = $conn->prepare("
INSERT INTO eye_examinations (
    request_id, exam_date,
    od_sph, od_cyl, od_axis, od_add,
    os_sph, os_cyl, os_axis, os_add,
    pd, lens_type, lens_material, exam_notes
) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
");

$stmt->bind_param(
    "isddiddiddisss",
    $request_id,
    $exam_date,
    $data['od_sph'],
    $data['od_cyl'],
    $data['od_axis'],
    $data['od_add'],
    $data['os_sph'],
    $data['os_cyl'],
    $data['os_axis'],
    $data['os_add'],
    $data['pd'],
    $data['lens_type'],
    $data['lens_material'],
    $data['notes']
);

if (!$stmt->execute()) {
    echo json_encode(["success" => false, "message" => $stmt->error]);
    exit;
}

/* =========================
   UPDATE REQUEST STATUS
========================= */
$update = $conn->prepare("
    UPDATE patient_request
    SET status = 'examined'
    WHERE id = ?
");
$update->bind_param("i", $request_id);
$update->execute();

echo json_encode(["success" => true]);

$conn->close();
