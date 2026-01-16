<?php
header('Content-Type: application/json');

// 1. Database connection details
$host = "localhost";
$user = "root";
$pass = "";
$dbname = "bagares_system";

$conn = new mysqli($host, $user, $pass, $dbname);

// 2. Check connection
if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

// 3. Get POST data from the form (Match keys in add-item-modal.js)
$name     = $_POST['product_name'] ?? '';
$sku      = $_POST['sku'] ?? '';
$category = $_POST['category'] ?? '';
$price    = $_POST['price'] ?? 0;
$stock    = $_POST['stock'] ?? 0;

// 4. Basic validation: Ensure required fields are not empty
if (empty($name) || empty($sku) || empty($category)) {
    echo json_encode(["status" => "error", "message" => "Please fill in all required fields (Name, SKU, and Category)."]);
    exit;
}

/**
 * 5. FIXED BIND_PARAM:
 * s = string (product_name)
 * s = string (sku)
 * s = string (category) -> Corrected to 's' so text like "frames" is saved
 * d = double (price)
 * i = integer (stock)
 */
$stmt = $conn->prepare("INSERT INTO inventory (product_name, sku, category, price, stock) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("sssdi", $name, $sku, $category, $price, $stock);

// 6. Execute and return JSON response
if ($stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "Item added successfully"]);
} else {
    // If there is a DB error (like a duplicate SKU), send the specific error message
    echo json_encode(["status" => "error", "message" => "Failed to save to database: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>