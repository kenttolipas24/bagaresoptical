<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$url = 'https://bagaresoptical.fwh.is/site/api/get_online_bookings.php';

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 45,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
    CURLOPT_REFERER => 'https://bagaresoptical.fwh.is/',
    CURLOPT_HTTPHEADER => [
        'Accept: application/json',
        'Accept-Language: en-US,en;q=0.9',
        'X-Requested-With: XMLHttpRequest',
        'Sec-Fetch-Site: same-origin',
        'Sec-Fetch-Mode: cors',
        'Sec-Fetch-Dest: empty',
        'Connection: keep-alive'
    ],
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$error = curl_error($ch);
curl_close($ch);

if ($response === false || $httpCode >= 400 || strpos($contentType, 'json') === false) {
    echo json_encode([
        'success' => false,
        'error' => 'Blocked or failed',
        'http_code' => $httpCode,
        'content_type' => $contentType,
        'curl_error' => $error,
        'preview' => substr($response ?? '', 0, 500)
    ]);
} else {
    echo $response;
}
?>