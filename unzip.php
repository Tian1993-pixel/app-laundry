<?php
$zipFile = 'dist.zip';
$extractTo = './';

if (file_exists($zipFile)) {
    $zip = new ZipArchive;
    if ($zip->open($zipFile) === TRUE) {
        $zip->extractTo($extractTo);
        $zip->close();
        echo "<div style='font-family: sans-serif; text-align: center; margin-top: 50px;'>";
        echo "<h1 style='color: #059669;'>✅ EKSTRAK BERHASIL 100%!</h1>";
        echo "<p style='font-size: 18px; color: #334155;'>Seluruh folder <b>assets/</b>, <b>images/</b>, dan <b>.htaccess</b> telah diekstrak dengan sempurna ke server InfinityFree!</p>";
        echo "<a href='/' style='display: inline-block; background: #0f766e; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 10px; margin-top: 20px;'>👉 Buka Website Laundry Sekarang</a>";
        echo "</div>";
    } else {
        echo "<h1>❌ Gagal mengekstrak file zip.</h1>";
    }
} else {
    echo "<h1>❌ File dist.zip belum di-upload di folder htdocs.</h1>";
}
?>
