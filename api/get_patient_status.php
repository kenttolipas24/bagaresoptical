<?php
session_start();
header('Content-Type: application/json');
include 'db_connect.php';

if (!isset($_SESSION['patient_id'])) {
    echo json_encode(['success' => false]);
    exit;
}

$id = $_SESSION['patient_id'];

// Fetch User Info
$userStmt = $pdo->prepare("SELECT full_name FROM patient_account WHERE account_id = ?");
$userStmt->execute([$id]);
$user = $userStmt->fetch();

// Fetch Appointments
$aptStmt = $pdo->prepare("SELECT appointment_type, appointment_date, status FROM appointment WHERE account_id = ?");
$aptStmt->execute([$id]);
$apts = $aptStmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    'full_name' => $user['full_name'],
    'appointments' => $apts
]);
?>