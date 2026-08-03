<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// CONFIG DATABASE INFINITYFREE
$DB_HOST = 'sql211.infinityfree.com';
$DB_USER = 'if0_42562191';
$DB_PASS = 'Nfbe7t9jhXW42J';
$DB_NAME = 'if0_42562191_db_laundry';

try {
    $pdo = new PDO("mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4", $DB_USER, $DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Koneksi Database Gagal: ' . $e->getMessage()]);
    exit();
}

$requestUri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// Parse Route
$path = parse_url($requestUri, PHP_URL_PATH);
$path = str_replace('/api.php', '', $path);
$parts = explode('/', trim($path, '/'));

$resource = isset($parts[0]) && $parts[0] !== '' ? $parts[0] : '';
$id = isset($parts[1]) ? $parts[1] : null;
$subresource = isset($parts[2]) ? $parts[2] : null;

// ROUTER HANDLERS
try {
    if ($resource === 'settings') {
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM store_settings WHERE id = 1 LIMIT 1");
            $data = $stmt->fetch();
            echo json_encode(['success' => true, 'data' => $data]);
        } elseif ($method === 'PUT') {
            $stmt = $pdo->prepare("UPDATE store_settings SET store_name = ?, tagline = ?, address = ?, phone = ?, logo_url = ?, banner_url = ?, header_receipt_note = ?, footer_receipt_note = ? WHERE id = 1");
            $stmt->execute([
                $input['store_name'] ?? '',
                $input['tagline'] ?? '',
                $input['address'] ?? '',
                $input['phone'] ?? '',
                $input['logo_url'] ?? '',
                $input['banner_url'] ?? '',
                $input['header_receipt_note'] ?? '',
                $input['footer_receipt_note'] ?? ''
            ]);
            echo json_encode(['success' => true, 'message' => 'Settings updated']);
        }
    } elseif ($resource === 'services') {
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM services ORDER BY id ASC");
            echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
        }
    } elseif ($resource === 'customers') {
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM customers ORDER BY id DESC");
            echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
        } elseif ($method === 'POST') {
            if ($id && $subresource === 'deposit') {
                $amt = (float)($input['amount'] ?? 0);
                $stmt = $pdo->prepare("UPDATE customers SET deposit_balance = deposit_balance + ? WHERE id = ?");
                $stmt->execute([$amt, $id]);
                echo json_encode(['success' => true, 'message' => 'Deposit updated']);
            } else {
                $stmt = $pdo->prepare("INSERT INTO customers (name, phone, password, address) VALUES (?, ?, ?, ?)");
                $stmt->execute([$input['name'] ?? '', $input['phone'] ?? '', $input['password'] ?? '123', $input['address'] ?? '']);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
            }
        }
    } elseif ($resource === 'reviews') {
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM reviews ORDER BY id DESC");
            echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
        } elseif ($method === 'POST') {
            $stmt = $pdo->prepare("INSERT INTO reviews (customer_name, rating, package_used, comment) VALUES (?, ?, ?, ?)");
            $stmt->execute([$input['customer_name'] ?? '', $input['rating'] ?? 5, $input['package_used'] ?? 'Paket Kiloan Reguler', $input['comment'] ?? '']);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        }
    } elseif ($resource === 'orders') {
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM orders ORDER BY id DESC");
            $rows = $stmt->fetchAll();
            foreach ($rows as &$row) {
                if (!empty($row['items_json'])) {
                    $row['items'] = json_decode($row['items_json'], true);
                } else {
                    $row['items'] = [];
                }
            }
            echo json_encode(['success' => true, 'data' => $rows]);
        } elseif ($method === 'POST') {
            $itemsJson = json_encode($input['items'] ?? []);
            $stmt = $pdo->prepare("INSERT INTO orders (invoice_number, customer_id, customer_name, customer_phone, subtotal_amount, discount_amount, shipping_fee, other_fee, total_amount, paid_amount, change_amount, payment_type, payment_status, work_status, rack_location, perfume_variant, notes, created_at, items_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $input['invoice_number'] ?? '',
                $input['customer_id'] ?? null,
                $input['customer_name'] ?? '',
                $input['customer_phone'] ?? '',
                $input['subtotal_amount'] ?? 0,
                $input['discount_amount'] ?? 0,
                $input['shipping_fee'] ?? 0,
                $input['other_fee'] ?? 0,
                $input['total_amount'] ?? 0,
                $input['paid_amount'] ?? 0,
                $input['change_amount'] ?? 0,
                $input['payment_type'] ?? 'cash',
                $input['payment_status'] ?? 'paid',
                $input['work_status'] ?? 'diterima',
                $input['rack_location'] ?? 'RAK A-01',
                $input['perfume_variant'] ?? 'Original Fresh',
                $input['notes'] ?? '',
                $input['created_at'] ?? date('Y-m-d H:i:s'),
                $itemsJson
            ]);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        } elseif ($method === 'PATCH' && $id) {
            if ($subresource === 'status') {
                $stmt = $pdo->prepare("UPDATE orders SET work_status = ? WHERE id = ?");
                $stmt->execute([$input['work_status'] ?? 'diterima', $id]);
            } elseif ($subresource === 'payment') {
                $stmt = $pdo->prepare("UPDATE orders SET payment_status = ? WHERE id = ?");
                $stmt->execute([$input['payment_status'] ?? 'paid', $id]);
            }
            echo json_encode(['success' => true, 'message' => 'Order updated']);
        }
    } elseif ($resource === 'outlets') {
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM outlets ORDER BY id ASC");
            echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
        } elseif ($method === 'POST') {
            $stmt = $pdo->prepare("INSERT INTO outlets (store_name, address, phone) VALUES (?, ?, ?)");
            $stmt->execute([$input['store_name'] ?? '', $input['address'] ?? '', $input['phone'] ?? '']);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        } elseif ($method === 'PUT' && $id) {
            $stmt = $pdo->prepare("UPDATE outlets SET store_name = ?, address = ?, phone = ? WHERE id = ?");
            $stmt->execute([$input['store_name'] ?? '', $input['address'] ?? '', $input['phone'] ?? '', $id]);
            echo json_encode(['success' => true, 'message' => 'Outlet updated']);
        }
    } elseif ($resource === 'expenses') {
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM expenses ORDER BY id DESC");
            echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
        } elseif ($method === 'POST') {
            $stmt = $pdo->prepare("INSERT INTO expenses (title, category, amount, notes, date) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$input['title'] ?? '', $input['category'] ?? 'Operasional', $input['amount'] ?? 0, $input['notes'] ?? '', $input['date'] ?? date('Y-m-d H:i')]);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        }
    } elseif ($resource === 'employees') {
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM employees ORDER BY id ASC");
            echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
        } elseif ($method === 'POST') {
            $stmt = $pdo->prepare("INSERT INTO employees (name, role, phone, salary, status) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$input['name'] ?? '', $input['role'] ?? 'Kasir', $input['phone'] ?? '', $input['salary'] ?? 0, 'Aktif']);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        }
    } elseif ($resource === 'attendances') {
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM attendances ORDER BY id DESC");
            echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
        }
    } else {
        echo json_encode(['success' => true, 'message' => 'API Endpoint Active']);
    }
} catch (Exception $ex) {
    echo json_encode(['success' => false, 'error' => $ex->getMessage()]);
}
?>
