<?php
/**
 * Konfigurasi Database MySQL untuk Local & Server Hosting Rumahweb
 * Sesuaikan DB_USER, DB_PASS, DB_NAME dengan cPanel MySQL Anda jika diperlukan.
 */

// 1. Coba baca dari file backend/.env jika ada
$envUser = 'ruad8174_db_laundry';
$envPass = 'CBm3ETMPBYWT65';
$envName = 'ruad8174_db_laundry';
$envHost = 'localhost';

$envFile = __DIR__ . '/backend/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value, " \t\n\r\0\x0B\"'");
        if ($name === 'DB_HOST') $envHost = $value;
        if ($name === 'DB_USER') $envUser = $value;
        if ($name === 'DB_PASS') $envPass = $value;
        if ($name === 'DB_NAME') $envName = $value;
    }
}

// 2. Daftar kombinasi database yang akan dicoba secara otomatis
return [
    'host' => $envHost,
    'user' => $envUser,
    'pass' => $envPass,
    'name' => $envName
];
