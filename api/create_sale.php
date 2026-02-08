<?php
/**
 * ENHANCED CREATE SALE API
 * Features: Staff tracking, Discount, Exam linking, Payment details
 */
error_log("✅ Using ENHANCED create_sale.php");
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$conn = new mysqli("localhost", "root", "", "bagares_system");

if ($conn->connect_error) {
    echo json_encode(["success" => false, "error" => "Database connection failed"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["success" => false, "error" => "Invalid JSON payload"]);
    exit;
}

// Extract data
$patient_id       = $data['patient_id'] ?? null;
$patient_name     = $data['patient_name'] ?? 'Walk-in Customer';
$sale_date        = $data['sale_date'] ?? date('Y-m-d');
$exam_id          = $data['exam_id'] ?? null;
$payment_method   = $data['payment_method'] ?? null;
$subtotal         = $data['subtotal'] ?? 0;
$discount_type    = $data['discount_type'] ?? 'none';
$discount_amount  = $data['discount_amount'] ?? 0;
$discount_id_num  = $data['discount_id_number'] ?? '';
$total_amount     = $data['total_amount'] ?? 0;
$amount_tendered  = $data['amount_tendered'] ?? null;
$change_amount    = $data['change_amount'] ?? null;
$reference_number = $data['reference_number'] ?? null;
$staff_id         = $data['staff_id'] ?? null;
$staff_name       = $data['staff_name'] ?? null;
$items            = $data['items'] ?? [];

if (!$payment_method || empty($items)) {
    echo json_encode(["success" => false, "error" => "Missing required sale data"]);
    exit;
}

$conn->begin_transaction();

try {
    // 1️⃣ INSERT INTO sales (with enhanced fields)
    $stmt = $conn->prepare("
        INSERT INTO sales 
        (patient_id, patient_name, exam_id, sale_date, subtotal, discount_type, 
         discount_amount, discount_id_number, total_amount, payment_method, 
         payment_status, amount_tendered, change_amount, reference_number,
         staff_id, staff_name, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?, ?, ?, ?, ?, NOW())
    ");
    
    $stmt->bind_param(
        "isisdsdsdsddsiss",
        $patient_id,
        $patient_name,
        $exam_id,
        $sale_date,
        $subtotal,
        $discount_type,
        $discount_amount,
        $discount_id_num,
        $total_amount,
        $payment_method,
        $amount_tendered,
        $change_amount,
        $reference_number,
        $staff_id,
        $staff_name
    );
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to create sale: " . $stmt->error);
    }

    $sale_id = $stmt->insert_id;
    $stmt->close();

    // 2️⃣ Prepare statements for items and stock
    $itemStmt = $conn->prepare("
        INSERT INTO sale_items 
        (sale_id, inventory_id, quantity, price, subtotal)
        VALUES (?, ?, ?, ?, ?)
    ");

    $stockStmt = $conn->prepare("
        UPDATE inventory 
        SET stock = stock - ? 
        WHERE inventory_id = ? AND stock >= ?
    ");

    $historyStmt = $conn->prepare("
        INSERT INTO stocks_history 
        (inventory_id, type, quantity, reason, created_at)
        VALUES (?, 'Stock Out', ?, ?, NOW())
    ");

    // 3️⃣ Process each item
    foreach ($items as $item) {
        $inventory_id = $item['inventory_id'];
        $qty          = $item['quantity'];
        $price        = $item['price'];
        $item_subtotal = $price * $qty;

        // a) Insert sale item
        $itemStmt->bind_param("iiidd", $sale_id, $inventory_id, $qty, $price, $item_subtotal);
        if (!$itemStmt->execute()) {
            throw new Exception("Failed to insert sale item: " . $itemStmt->error);
        }

        // b) Deduct stock
        $stockStmt->bind_param("iii", $qty, $inventory_id, $qty);
        if (!$stockStmt->execute()) {
            throw new Exception("Failed to update stock: " . $stockStmt->error);
        }

        if ($stockStmt->affected_rows === 0) {
            throw new Exception("Insufficient stock for inventory_id: $inventory_id");
        }

        // c) Record stock movement
        $reason = "Sold to: " . $patient_name . " (Sale #" . $sale_id . ")";
        if ($staff_name) {
            $reason .= " by " . $staff_name;
        }
        $historyStmt->bind_param("iis", $inventory_id, $qty, $reason);
        
        if (!$historyStmt->execute()) {
            throw new Exception("Failed to insert stock history: " . $historyStmt->error);
        }
    }

    $itemStmt->close();
    $stockStmt->close();
    $historyStmt->close();

    $conn->commit();

    echo json_encode([
        "success" => true,
        "sale_id" => $sale_id,
        "message" => "Sale completed successfully"
    ]);

} catch (Exception $e) {
    $conn->rollback();
    
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}

$conn->close();
?>