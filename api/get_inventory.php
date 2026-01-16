<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0); // Hide raw errors from output to keep JSON clean

$host = "localhost";
$user = "root";
$pass = "";
$dbname = "bagares_system";

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    echo json_encode(["error" => "Connection failed"]);
    exit;
}

$sql = "SELECT inventory_id, product_name, sku, category, price, stock FROM inventory ORDER BY inventory_id DESC";
$result = $conn->query($sql);

$inventory = [];

if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        // Generate initials
        $words = explode(" ", $row['product_name']);
        $initials = "";
        foreach ($words as $w) {
            $initials .= strtoupper(substr($w, 0, 1));
        }
        $row['initials'] = substr($initials, 0, 2);
        
        // Ensure numeric types
        $row['price'] = (float)$row['price'];
        $row['stock'] = (int)$row['stock'];
        
        $inventory[] = $row;
    }
}

// Even if empty, this will return "[]", which is valid JSON
echo json_encode($inventory);
$conn->close();
?>