<?php
// Laragon Apache VirtualHost Entry Point
$distPath = __DIR__ . '/frontend/dist';

$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($requestUri !== '/' && file_exists($distPath . $requestUri)) {
    $mime = mime_content_type($distPath . $requestUri);
    if (str_ends_with($requestUri, '.js')) $mime = 'application/javascript';
    if (str_ends_with($requestUri, '.css')) $mime = 'text/css';
    if (str_ends_with($requestUri, '.svg')) $mime = 'image/svg+xml';
    
    header("Content-Type: $mime");
    readfile($distPath . $requestUri);
    exit;
}

if (file_exists($distPath . '/index.html')) {
    readfile($distPath . '/index.html');
    exit;
}
?>
