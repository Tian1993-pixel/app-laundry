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
