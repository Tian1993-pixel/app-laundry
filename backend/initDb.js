const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDatabase() {
  const DB_HOST = process.env.DB_HOST || 'localhost';
  const DB_USER = process.env.DB_USER || 'root';
  const DB_PASS = process.env.DB_PASS || '';
  const DB_NAME = process.env.DB_NAME || 'db_laundry';

  try {
    console.log(`📡 Menghubungkan ke MySQL Server di ${DB_HOST}...`);
    const rootConnection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS
    });

    await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`✅ Database \`${DB_NAME}\` siap atau telah dibuat.`);
    await rootConnection.end();

    const pool = mysql.createPool({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10
    });

    console.log(`📋 Memeriksa & membuat struktur tabel untuk ${DB_NAME}...`);

    // 1. Tabel store_settings with LONGTEXT for Base64 image files
    await pool.query(`
      CREATE TABLE IF NOT EXISTS store_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        store_name VARCHAR(150) NOT NULL DEFAULT 'Laundry Fresh & Clean',
        tagline VARCHAR(255) DEFAULT 'Solusi Pakaian Bersih, Rapi & Harum Premium',
        address TEXT,
        phone VARCHAR(30) DEFAULT '081234567890',
        logo_url LONGTEXT,
        banner_url LONGTEXT,
        header_receipt_note VARCHAR(255) DEFAULT 'Nota Resmi Pembayaran Laundry',
        footer_receipt_note VARCHAR(255) DEFAULT 'Terima kasih telah mempercayakan pakaian Anda kepada kami!',
        license_key VARCHAR(100) DEFAULT 'LND-2026-PREMIUM-OK',
        license_active_until DATE DEFAULT '2026-12-31',
        is_active TINYINT(1) DEFAULT 1,
        first_member_discount INT DEFAULT 10000,
        point_redeem_threshold INT DEFAULT 10,
        point_redeem_discount INT DEFAULT 10000,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    try { await pool.query(`ALTER TABLE store_settings MODIFY COLUMN logo_url LONGTEXT;`); } catch (e) {}
    try { await pool.query(`ALTER TABLE store_settings MODIFY COLUMN banner_url LONGTEXT;`); } catch (e) {}
    try { await pool.query(`ALTER TABLE store_settings ADD COLUMN first_member_discount INT DEFAULT 10000;`); } catch (e) {}
    try { await pool.query(`ALTER TABLE store_settings ADD COLUMN point_redeem_threshold INT DEFAULT 10;`); } catch (e) {}
    try { await pool.query(`ALTER TABLE store_settings ADD COLUMN point_redeem_discount INT DEFAULT 10000;`); } catch (e) {}

    const [settingsRows] = await pool.query('SELECT COUNT(*) as count FROM store_settings');
    if (settingsRows[0].count === 0) {
      await pool.query(`
        INSERT INTO store_settings (id, store_name, tagline, address, phone, logo_url, banner_url) 
        VALUES (1, 'Laundry Fresh & Clean', 'Solusi Pakaian Bersih, Rapi & Harum Premium', 'Jl. Raya Utama No. 12, Bandung', '081234567890', '/images/laundry_logo.png', '/images/laundry_hero_banner.png');
      `);
    }

    // 2. Tabel outlets
    await pool.query(`
      CREATE TABLE IF NOT EXISTS outlets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        store_name VARCHAR(150) NOT NULL,
        address TEXT,
        phone VARCHAR(30),
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    const [outletsCount] = await pool.query('SELECT COUNT(*) as count FROM outlets');
    if (outletsCount[0].count === 0) {
      await pool.query(`
        INSERT INTO outlets (id, store_name, address, phone) VALUES 
        (1, 'Laundry Fresh & Clean (Pusat)', 'Jl. Raya Utama No. 12, Bandung', '081234567890'),
        (2, 'Laundry Fresh & Clean (Cabang Dago)', 'Jl. Ir. H. Juanda No. 88, Bandung', '081299881122');
      `);
    }

    // 3. Tabel reviews
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_name VARCHAR(100) NOT NULL,
        rating INT DEFAULT 5,
        package_used VARCHAR(100) DEFAULT 'Paket Kiloan Reguler',
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    const [revCount] = await pool.query('SELECT COUNT(*) as count FROM reviews');
    if (revCount[0].count === 0) {
      await pool.query(`
        INSERT INTO reviews (id, customer_name, rating, package_used, comment) VALUES 
        (1, 'Hendra Wijaya', 5, 'Paket Express Kilat', 'Cucian sangat wangi dan bersih. Penjemputannya tepat waktu dan harga terjangkau! Sangat direkomendasikan.'),
        (2, 'Anisa Rahmawati', 5, 'Paket Satuan Bed Cover', 'Bedcover jumbo saya kembali seperti baru, sangat lembut dan packing plastiknya rapi banget.'),
        (3, 'Bambang Kusuma', 5, 'Paket Kiloan Reguler', 'Sudah langganan 6 bulan di sini. Poin reward-nya lumayan banget bisa ditukar diskon!');
      `);
    }

    console.log(`✅ Seluruh tabel MySQL \`${DB_NAME}\` berhasil di-update & diinisialisasi!`);
    await pool.end();
  } catch (error) {
    console.error('❌ Gagal inisialisasi MySQL Database:', error);
  }
}

initDatabase();
