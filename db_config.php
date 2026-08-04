<?php
/**
 * Konfigurasi Database MySQL untuk Local & Server Hosting Rumahweb
 */

// 1. Baca dari backend/.env terlebih dahulu jika ada
$envUser = 'ruad8174_db_laundry';
$envPass = 'CBm3ETMPBYWT65';
$envName = 'ruad8174_db_laundry';
$envHost = 'localhost';

$envFile = __DIR__ . '/backend/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0 || strpos($line, '=') === false) continue;
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value, " \t\n\r\0\x0B\"'");
        if ($name === 'DB_HOST' && !empty($value)) $envHost = $value;
        if ($name === 'DB_USER' && !empty($value) && $value !== 'root') $envUser = $value;
        if ($name === 'DB_PASS' && !empty($value)) $envPass = $value;
        if ($name === 'DB_NAME' && !empty($value) && $value !== 'db_laundry') $envName = $value;
    }
}

return [
    'host' => $envHost,
    'user' => $envUser,
    'pass' => $envPass,
    'name' => $envName
];
