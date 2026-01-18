<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0); // Hide raw errors from output to keep JSON clean

$host = "localhost";
$user = "root";
$pass = "";
$dbname = "bagares_system";

// Create connection
$conn = new mysqli($host, $user, $pass, $dbname);

// Check connection
if ($conn->connect_error) {
    echo json_encode(["error" => "Connection failed: " . $conn->connect_error]);
    exit;
}

// Query to get inventory
$sql = "SELECT inventory_id, product_name, sku, category, price, stock 
        FROM inventory 
        WHERE stock IS NOT NULL 
        ORDER BY product_name ASC";

$result = $conn->query($sql);

$inventory = [];

if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        // Generate initials from product name
        $words = explode(" ", $row['product_name']);
        $initials = "";
        foreach ($words as $w) {
            if (!empty($w)) {
                $initials .= strtoupper(substr($w, 0, 1));
            }
        }
        $row['initials'] = substr($initials, 0, 2);
        
        // Ensure numeric types
        $row['inventory_id'] = (int)$row['inventory_id'];
        $row['price'] = (float)$row['price'];
        $row['stock'] = (int)$row['stock'];
        
        $inventory[] = $row;
    }
}

// Return JSON even if empty (valid JSON array)
echo json_encode($inventory);
$conn->close();
?>