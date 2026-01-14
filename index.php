<?php
// ==========================
// GLOBAL HEADERS (OPEN API)
// ==========================
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json");

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ==========================
// SIMPLE ROUTER
// ==========================
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Remove leading slash
$uri = trim($uri, '/');

// ROUTES
switch ($uri) {

    case '':
    case 'get_user':
        require 'api/get_user.php';
        break;

    case 'get_appointments':
        require 'api/get_appointments.php';
        break;

    case 'get_patient_records':
        require 'api/get_patient_records.php';
        break;

    default:
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "API endpoint not found"
        ]);
}
