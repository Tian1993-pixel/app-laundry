<?php
// Prevent browser and server caching for fresh updates
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

// Polyfill for PHP 7.4 compatibility on hosting servers
if (!function_exists('str_starts_with')) {
    function str_starts_with($haystack, $needle) {
        return (string)$needle !== '' && strncmp($haystack, $needle, strlen($needle)) === 0;
    }
}
if (!function_exists('str_ends_with')) {
    function str_ends_with($haystack, $needle) {
        return $needle === '' || substr($haystack, -strlen($needle)) === $needle;
    }
}

// Laragon Apache Entry Point for app-laundry
$distPath = __DIR__ . '/frontend/dist';

$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Remove /frontend/dist or subfolder prefix if present in URL
if (str_starts_with($requestUri, '/frontend/dist')) {
    $relativeUri = substr($requestUri, strlen('/frontend/dist'));
} else {
    $scriptDir = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
    if ($scriptDir !== '' && str_starts_with($requestUri, $scriptDir)) {
        $relativeUri = substr($requestUri, strlen($scriptDir));
    } else {
        $relativeUri = $requestUri;
    }
}

if ($relativeUri === '') {
    $relativeUri = '/';
}

// =========================================================================
// PHP MYSQL API ROUTER FOR CPANEL HOSTING
// =========================================================================
if (str_starts_with($relativeUri, '/api/')) {
    header("Content-Type: application/json; charset=UTF-8");
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        exit;
    }

    // Read DB config from db_config.php or backend/.env
    $dbCfg = file_exists(__DIR__ . '/db_config.php') ? include(__DIR__ . '/db_config.php') : [];
    $dbHost = $dbCfg['host'] ?? 'localhost';
    $dbUser = $dbCfg['user'] ?? 'ruad8174_db_laundry';
    $dbPass = $dbCfg['pass'] ?? '';
    $dbName = $dbCfg['name'] ?? 'ruad8174_db_laundry';

    $pdo = null;
    $possibleDBs = [
        ['host' => $dbHost, 'user' => $dbUser, 'pass' => $dbPass, 'name' => $dbName],
        ['host' => 'localhost', 'user' => 'ruad8174_db_laundry', 'pass' => $dbPass, 'name' => 'ruad8174_db_laundry'],
        ['host' => 'localhost', 'user' => 'root', 'pass' => '', 'name' => 'db_laundry'],
        ['host' => 'localhost', 'user' => 'root', 'pass' => 'root', 'name' => 'db_laundry']
    ];

    $lastErr = '';
    foreach ($possibleDBs as $cfg) {
        if (empty($cfg['user']) || empty($cfg['name'])) continue;
        try {
            $pdo = new PDO("mysql:host={$cfg['host']};dbname={$cfg['name']};charset=utf8mb4", $cfg['user'], $cfg['pass'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);
            if ($pdo) break;
        } catch (Exception $e) {
            $lastErr = $e->getMessage();
        }
    }

    if (!$pdo) {
        echo json_encode([
            "success" => false, 
            "message" => "Database connection error: " . $lastErr,
            "hint" => "Edit file db_config.php atau backend/.env di cPanel File Manager dengan password MySQL Rumahweb Anda."
        ]);
        exit;
    }

    $endpoint = substr($relativeUri, strlen('/api/'));
    $method = $_SERVER['REQUEST_METHOD'];

    // 1. OUTLETS API
    if ($endpoint === 'outlets' || str_starts_with($endpoint, 'outlets/')) {
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM outlets WHERE is_active = 1 ORDER BY id ASC");
            echo json_encode(["success" => true, "data" => $stmt->fetchAll()]);
            exit;
        }
        if ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("INSERT INTO outlets (store_name, address, phone, maps_embed_url) VALUES (?, ?, ?, ?)");
            $stmt->execute([
                $input['store_name'] ?? 'Cabang Baru',
                $input['address'] ?? '-',
                $input['phone'] ?? '-',
                $input['maps_embed_url'] ?? null
            ]);
            echo json_encode(["success" => true, "message" => "Outlet berhasil ditambahkan", "id" => $pdo->lastInsertId()]);
            exit;
        }
        if ($method === 'PUT') {
            $parts = explode('/', $endpoint);
            $id = end($parts);
            $input = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("UPDATE outlets SET store_name = ?, address = ?, phone = ?, maps_embed_url = ? WHERE id = ?");
            $stmt->execute([
                $input['store_name'] ?? 'Cabang',
                $input['address'] ?? '-',
                $input['phone'] ?? '-',
                $input['maps_embed_url'] ?? null,
                $id
            ]);
            echo json_encode(["success" => true, "message" => "Outlet berhasil diupdate"]);
            exit;
        }
    }

    // 2. STORE SETTINGS API
    if ($endpoint === 'settings') {
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM store_settings LIMIT 1");
            $data = $stmt->fetch();
            echo json_encode(["success" => true, "data" => $data ?: []]);
            exit;
        }
        if ($method === 'PUT') {
            $input = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("UPDATE store_settings SET store_name = ?, address = ?, phone = ?, maps_embed_url = COALESCE(?, maps_embed_url) WHERE id = 1");
            $stmt->execute([
                $input['store_name'] ?? 'Laundry Fresh & Clean',
                $input['address'] ?? '',
                $input['phone'] ?? '',
                $input['maps_embed_url'] ?? null
            ]);
            echo json_encode(["success" => true, "message" => "Settings berhasil diupdate"]);
            exit;
        }
    }

    // 3. GENERIC GET FOR SERVICES, BANK ACCOUNTS, CUSTOMERS, REVIEWS, ORDERS
    if ($method === 'GET') {
        $allowedTables = ['services', 'bank_accounts', 'customers', 'reviews', 'orders', 'expenses', 'employees', 'attendances'];
        $cleanTable = str_replace('-', '_', str_replace('bank-accounts', 'bank_accounts', $endpoint));
        if (in_array($cleanTable, $allowedTables)) {
            try {
                $stmt = $pdo->query("SELECT * FROM `$cleanTable` ORDER BY id DESC");
                echo json_encode(["success" => true, "data" => $stmt->fetchAll()]);
                exit;
            } catch (Exception $e) {}
        }
    }

    echo json_encode(["success" => false, "message" => "API endpoint tidak ditemukan"]);
    exit;
}

if ($relativeUri !== '' && $relativeUri !== '/' && file_exists($distPath . $relativeUri)) {
    $mime = mime_content_type($distPath . $relativeUri);
    if (str_ends_with($relativeUri, '.js')) $mime = 'application/javascript';
    if (str_ends_with($relativeUri, '.css')) $mime = 'text/css';
    if (str_ends_with($relativeUri, '.svg')) $mime = 'image/svg+xml';
    if (str_ends_with($relativeUri, '.png')) $mime = 'image/png';
    if (str_ends_with($relativeUri, '.jpg') || str_ends_with($relativeUri, '.jpeg')) $mime = 'image/jpeg';
    
    header("Content-Type: $mime");
    readfile($distPath . $relativeUri);
    exit;
}

if (file_exists($distPath . '/index.html')) {
    header("Content-Type: text/html");
    readfile($distPath . '/index.html');
    exit;
} else if (file_exists(__DIR__ . '/index.html')) {
    header("Content-Type: text/html");
    readfile(__DIR__ . '/index.html');
    exit;
} else {
    echo "Dist folder tidak ditemukan. Silakan jalankan 'npm run build' di folder frontend.";
}
?>
