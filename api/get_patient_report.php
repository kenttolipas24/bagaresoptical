<?php
// ================================================
// get_patient_report.php - FIXED (no gender column)
// ================================================
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    require_once __DIR__ . '/../db.php';
    if (!isset($conn) || $conn->connect_error) {
        throw new Exception('Database connection failed');
    }

    // ─── GET parameters ───────────────────────────────────────────────────
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $sort   = isset($_GET['sort'])   ? trim($_GET['sort'])   : 'newest';

    // ─── WHERE clause for search ──────────────────────────────────────────
    $where  = "WHERE 1=1";
    $params = [];
    $types  = "";

    if ($search !== '') {
        $where .= " AND (p.firstname LIKE ? OR p.lastname LIKE ? OR p.phone LIKE ? OR p.email LIKE ? OR CONCAT(p.firstname, ' ', p.lastname) LIKE ?)";
        $searchTerm = "%$search%";
        $params = [$searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm];
        $types  = "sssss";
    }

    // ─── ORDER BY ─────────────────────────────────────────────────────────
    $orderBy = "ORDER BY ";
    switch ($sort) {
        case 'oldest':
            $orderBy .= "p.created_at ASC";
            break;
        case 'name_asc':
            $orderBy .= "p.lastname ASC, p.firstname ASC";
            break;
        case 'name_desc':
            $orderBy .= "p.lastname DESC, p.firstname DESC";
            break;
        default: // newest
            $orderBy .= "p.created_at DESC";
    }

    // ─── Main patient query with latest exam per patient ──────────────────
    $query = "
        SELECT 
            p.patient_id,
            TRIM(CONCAT(p.firstname, ' ', COALESCE(p.middlename, ''), ' ', p.lastname, ' ', COALESCE(p.suffix, ''))) AS full_name,
            p.address,
            p.birthdate,
            TIMESTAMPDIFF(YEAR, p.birthdate, CURDATE()) AS age,
            p.phone,
            p.email,
            p.patient_type,
            p.created_at,
            -- Latest eye exam details (per patient)
            latest.exam_date AS last_exam_date,
            latest.od_add,
            latest.os_add,
            latest.pd
        FROM patient p
        LEFT JOIN (
            SELECT 
                patient_id,
                exam_date,
                od_add,
                os_add,
                pd,
                ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY exam_date DESC) AS rn
            FROM eye_examinations
        ) latest ON latest.patient_id = p.patient_id AND latest.rn = 1
        $where
        $orderBy
    ";

    $stmt = $conn->prepare($query);
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();

    $patients = [];
    while ($row = $result->fetch_assoc()) {
        $add_value = ($row['od_add'] !== null || $row['os_add'] !== null)
            ? ($row['od_add'] ?? 0) . ' / ' . ($row['os_add'] ?? 0)
            : '—';

        $patients[] = [
            'patient_id'     => $row['patient_id'],
            'full_name'      => trim($row['full_name']) ?: '—',
            'address'        => $row['address'] ?: '—',
            'age'            => $row['age'] ?: '—',
            'last_exam_date' => $row['last_exam_date'] ? date('Y-m-d', strtotime($row['last_exam_date'])) : 'No exam',
            'add'            => $add_value,
            'pd'             => $row['pd'] !== null ? $row['pd'] : '—',
            'phone'          => $row['phone'] ?: '—'
        ];
    }

    // ─── Stats (no gender reference) ──────────────────────────────────────
    $statsQuery = "
        SELECT 
            COUNT(*) AS total_patients,
            COUNT(CASE WHEN patient_type = 'walk-in' THEN 1 END) AS walkin_count,
            COUNT(CASE WHEN patient_type = 'online' THEN 1 END) AS online_count,
            COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) AS registered_today
        FROM patient
    ";
    $statsResult = $conn->query($statsQuery);
    $stats = $statsResult->fetch_assoc() ?? [];

    // ─── Response ─────────────────────────────────────────────────────────
    echo json_encode([
        'success' => true,
        'stats'   => [
            'total_patients'    => (int)($stats['total_patients'] ?? 0),
            'walkin_count'      => (int)($stats['walkin_count'] ?? 0),
            'online_count'      => (int)($stats['online_count'] ?? 0),
            'registered_today'  => (int)($stats['registered_today'] ?? 0)
        ],
        'data'    => $patients,
        'count'   => count($patients)
    ], JSON_NUMERIC_CHECK);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => $e->getMessage()
    ]);
} finally {
    if (isset($conn)) $conn->close();
}
?>