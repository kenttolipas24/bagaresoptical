<?php
/**
 * VOID SALE API
 * Voids a sale and restores inventory stock
 */
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

$sale_id = $data['sale_id'] ?? null;
$reason = $data['reason'] ?? '';
$notes = $data['notes'] ?? '';
$voided_by = $data['voided_by'] ?? null;
$voided_by_name = $data['voided_by_name'] ?? 'Unknown';

if (!$sale_id) {
    echo json_encode(["success" => false, "error" => "Sale ID required"]);
    exit;
}

// Check if sale exists and is not already voided
$checkStmt = $conn->prepare("SELECT payment_status FROM sales WHERE sale_id = ?");
$checkStmt->bind_param("i", $sale_id);
$checkStmt->execute();
$checkResult = $checkStmt->get_result();
$saleStatus = $checkResult->fetch_assoc();
$checkStmt->close();

if (!$saleStatus) {
    echo json_encode(["success" => false, "error" => "Sale not found"]);
    exit;
}

if ($saleStatus['payment_status'] === 'voided') {
    echo json_encode(["success" => false, "error" => "Sale is already voided"]);
    exit;
}

$conn->begin_transaction();

try {
    // 1️⃣ Get sale items to restore stock
    $itemsStmt = $conn->prepare("
        SELECT inventory_id, quantity 
        FROM sale_items 
        WHERE sale_id = ?
    ");
    $itemsStmt->bind_param("i", $sale_id);
    $itemsStmt->execute();
    $itemsResult = $itemsStmt->get_result();
    
    $items = [];
    while ($row = $itemsResult->fetch_assoc()) {
        $items[] = $row;
    }
    $itemsStmt->close();

    // 2️⃣ Restore stock for each item
    $stockStmt = $conn->prepare("
        UPDATE inventory 
        SET stock = stock + ? 
        WHERE inventory_id = ?
    ");

    $historyStmt = $conn->prepare("
        INSERT INTO stocks_history 
        (inventory_id, type, quantity, reason, created_at)
        VALUES (?, 'Stock In', ?, ?, NOW())
    ");

    foreach ($items as $item) {
        // Restore stock
        $stockStmt->bind_param("ii", $item['quantity'], $item['inventory_id']);
        if (!$stockStmt->execute()) {
            throw new Exception("Failed to restore stock: " . $stockStmt->error);
        }

        // Record stock movement
        $historyReason = "Void Sale #$sale_id - $reason" . ($voided_by_name ? " by $voided_by_name" : "");
        $historyStmt->bind_param("iis", $item['inventory_id'], $item['quantity'], $historyReason);
        if (!$historyStmt->execute()) {
            throw new Exception("Failed to insert stock history: " . $historyStmt->error);
        }
    }

    $stockStmt->close();
    $historyStmt->close();

    // 3️⃣ Update sale status to voided
    $voidReason = $reason . ($notes ? ": $notes" : "");
    $voidStmt = $conn->prepare("
        UPDATE sales 
        SET payment_status = 'voided',
            void_reason = ?,
            voided_by = ?,
            voided_by_name = ?,
            voided_at = NOW()
        WHERE sale_id = ?
    ");
    $voidStmt->bind_param("sisi", $voidReason, $voided_by, $voided_by_name, $sale_id);
    
    if (!$voidStmt->execute()) {
        throw new Exception("Failed to void sale: " . $voidStmt->error);
    }
    $voidStmt->close();

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Sale voided and stock restored"
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