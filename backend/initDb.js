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

    try { await pool.query(`ALTER TABLE store_settings ADD COLUMN logo_url LONGTEXT;`); } catch (e) {}
    try { await pool.query(`ALTER TABLE store_settings ADD COLUMN banner_url LONGTEXT;`); } catch (e) {}
    try { await pool.query(`ALTER TABLE store_settings MODIFY COLUMN logo_url LONGTEXT;`); } catch (e) {}
    try { await pool.query(`ALTER TABLE store_settings MODIFY COLUMN banner_url LONGTEXT;`); } catch (e) {}
    try { await pool.query(`ALTER TABLE store_settings ADD COLUMN first_member_discount INT DEFAULT 10000;`); } catch (e) {}
    try { await pool.query(`ALTER TABLE store_settings ADD COLUMN point_redeem_threshold INT DEFAULT 10;`); } catch (e) {}
    try { await pool.query(`ALTER TABLE store_settings ADD COLUMN point_redeem_discount INT DEFAULT 10000;`); } catch (e) {}
    try { await pool.query(`ALTER TABLE store_settings ADD COLUMN maps_embed_url TEXT;`); } catch (e) {}
    try { await pool.query(`ALTER TABLE store_settings ADD COLUMN open_time VARCHAR(10) DEFAULT '07:00';`); } catch (e) {}
    try { await pool.query(`ALTER TABLE store_settings ADD COLUMN close_time VARCHAR(10) DEFAULT '21:00';`); } catch (e) {}
    try { await pool.query(`ALTER TABLE store_settings ADD COLUMN operating_days VARCHAR(100) DEFAULT 'Senin - Minggu';`); } catch (e) {}
    try { await pool.query(`ALTER TABLE store_settings ADD COLUMN operating_hours VARCHAR(150) DEFAULT 'Senin - Minggu: 07:00 - 21:00 WIB';`); } catch (e) {}
    try { await pool.query(`ALTER TABLE store_settings ADD COLUMN social_instagram VARCHAR(255) DEFAULT 'https://instagram.com';`); } catch (e) {}
    try { await pool.query(`ALTER TABLE store_settings ADD COLUMN social_facebook VARCHAR(255) DEFAULT 'https://facebook.com';`); } catch (e) {}
    try { await pool.query(`ALTER TABLE store_settings ADD COLUMN social_tiktok VARCHAR(255) DEFAULT 'https://tiktok.com';`); } catch (e) {}
    try { await pool.query(`ALTER TABLE store_settings ADD COLUMN social_whatsapp VARCHAR(50) DEFAULT '081234567890';`); } catch (e) {}
    try { await pool.query(`ALTER TABLE outlets ADD COLUMN maps_embed_url TEXT;`); } catch (e) {}
    try { await pool.query(`ALTER TABLE outlets ADD COLUMN operating_hours VARCHAR(150) DEFAULT 'Senin - Minggu: 07:00 - 21:00 WIB';`); } catch (e) {}

    const [settingsRows] = await pool.query('SELECT COUNT(*) as count FROM store_settings');
    if (settingsRows[0].count === 0) {
      await pool.query(`
        INSERT INTO store_settings (id, store_name, tagline, address, phone, logo_url, banner_url, maps_embed_url) 
        VALUES (1, 'Laundry Fresh & Clean', 'Solusi Pakaian Bersih, Rapi & Harum Premium', 'Jl. Raya Utama No. 12, Bandung', '081234567890', '/images/laundry_logo.png', '/images/laundry_hero_banner.png', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.898863678077!2d107.608316!3d-6.902677!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwNTQnMDkuNiJTIDEwN8KwMzYnMjkuOSJF!5e0!3m2!1sid!2sid!4v1620000000000!5m2!1sid!2sid');
      `);
    }

    // 2. Tabel outlets
    await pool.query(`
      CREATE TABLE IF NOT EXISTS outlets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        store_name VARCHAR(150) NOT NULL,
        address TEXT,
        phone VARCHAR(30),
        maps_embed_url TEXT,
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

    // 4. Tabel bank_accounts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bank_accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bank_name VARCHAR(100) NOT NULL,
        account_number VARCHAR(100) NOT NULL,
        account_holder VARCHAR(150),
        qr_code_url LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    try { await pool.query(`ALTER TABLE bank_accounts ADD COLUMN qr_code_url LONGTEXT;`); } catch (e) {}

    const [bankCount] = await pool.query('SELECT COUNT(*) as count FROM bank_accounts');
    if (bankCount[0].count === 0) {
      await pool.query(`
        INSERT INTO bank_accounts (id, bank_name, account_number, account_holder) VALUES 
        (1, 'BCA', '7788990011', 'Outlet Utama'),
        (2, 'QRIS ShopeePay', '081234567890', 'Outlet Utama');
      `);
    }

    // 5. Tabel users (Staff & Admin)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'kasir') DEFAULT 'kasir',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');
    if (userCount[0].count === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPass123 = await bcrypt.hash('123', 10);
      await pool.query(`
        INSERT INTO users (id, name, username, password, role) VALUES 
        (1, 'Owner Admin', 'admin', ?, 'admin'),
        (2, 'Ahmad Kasir', 'kasir', ?, 'kasir');
      `, [hashedPass123, hashedPass123]);
    }

    // 6. Tabel services (Katalog Layanan Laundry Kiloan, Satuan, Express)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        service_name VARCHAR(150) NOT NULL,
        category VARCHAR(50) DEFAULT 'kiloan',
        price DECIMAL(12,2) NOT NULL DEFAULT 0,
        unit VARCHAR(30) DEFAULT 'kg',
        duration_hours INT DEFAULT 48,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    try { await pool.query(`ALTER TABLE services ADD COLUMN is_active TINYINT(1) DEFAULT 1;`); } catch (e) {}

    const [srvCount] = await pool.query('SELECT COUNT(*) as count FROM services');
    if (srvCount[0].count === 0) {
      await pool.query(`
        INSERT INTO services (id, service_name, category, price, unit, duration_hours, is_active) VALUES 
        (1, 'Cuci Komplit Reguler', 'kiloan', 7000, 'kg', 48, 1),
        (2, 'Cuci Komplit Express 24 jam', 'express', 12000, 'kg', 24, 1),
        (3, 'Setrika Saja (Kiloan)', 'kiloan', 4500, 'kg', 24, 1),
        (4, 'Bed Cover Besar (Jumbo)', 'satuan', 35000, 'pcs', 48, 1),
        (5, 'Cuci Sepatu Sneaker', 'satuan', 30000, 'pasang', 48, 1),
        (6, 'Jas / Gaun Pesta Premium', 'satuan', 40000, 'pcs', 72, 1),
        (7, 'Cuci Karpet Tebal', 'satuan', 15000, 'm2', 72, 1),
        (8, 'Gorden & Tirai', 'satuan', 12000, 'meter', 48, 1);
      `);
    }

    // 7. Tabel perfumes (Aroma Parfum Cucian)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS perfumes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    const [perfCount] = await pool.query('SELECT COUNT(*) as count FROM perfumes');
    if (perfCount[0].count === 0) {
      await pool.query(`
        INSERT INTO perfumes (id, name, is_active) VALUES 
        (1, 'Original Fresh', 1),
        (2, 'Lavender Sweet', 1),
        (3, 'Ocean Blue', 1),
        (4, 'Snappy Fresh', 1);
      `);
    }

    // 8. Tabel saas_tenants (Pendaftar SaaS / Pemilik Toko)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS saas_tenants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        phone VARCHAR(30) NOT NULL,
        store_name VARCHAR(150) NOT NULL,
        domain_slug VARCHAR(100) UNIQUE NULL,
        password VARCHAR(255) NOT NULL,
        trial_start DATETIME DEFAULT CURRENT_TIMESTAMP,
        trial_ends_at DATETIME NOT NULL,
        status ENUM('trial', 'active', 'expired', 'suspended') DEFAULT 'trial',
        plan VARCHAR(50) DEFAULT 'starter',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    try { await pool.query('ALTER TABLE saas_tenants ADD COLUMN domain_slug VARCHAR(100) UNIQUE NULL;'); } catch (e) {}

    const [tenantCount] = await pool.query('SELECT COUNT(*) as count FROM saas_tenants');
    if (tenantCount[0].count === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPass = await bcrypt.hash('123456', 10);
      await pool.query(`
        INSERT INTO saas_tenants (id, name, email, phone, store_name, domain_slug, password, trial_start, trial_ends_at, status)
        VALUES (1, 'Kalam Owner', 'kalam@gmail.com', '08980200111', 'Kalam Laundry', 'kalam', ?, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 'trial');
      `, [hashedPass]);
    } else {
      try { await pool.query("UPDATE saas_tenants SET domain_slug = 'kalam' WHERE id = 1 AND (domain_slug IS NULL OR domain_slug = '');"); } catch (e) {}
    }

    // 9. Tabel saas_superadmins (Penyedia Layanan SaaS Master)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS saas_superadmins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'superadmin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    const [saCount] = await pool.query('SELECT COUNT(*) as count FROM saas_superadmins');
    if (saCount[0].count === 0) {
      const bcrypt = require('bcryptjs');
      const hashedSaPass = await bcrypt.hash('admin123', 10);
      await pool.query(`
        INSERT INTO saas_superadmins (id, username, password) VALUES (1, 'admin', ?);
      `, [hashedSaPass]);
    }

    // Add tenant_id columns to ALL tables for Multi-Tenancy Data Isolation
    const tablesWithTenant = ['store_settings', 'outlets', 'reviews', 'services', 'perfumes', 'bank_accounts', 'orders', 'customers', 'employees', 'attendances', 'expenses', 'users'];
    for (const tbl of tablesWithTenant) {
      try {
        await pool.query(`ALTER TABLE ${tbl} ADD COLUMN tenant_id INT DEFAULT 1;`);
      } catch (e) {}
    }

    console.log(`✅ Seluruh tabel MySQL \`${DB_NAME}\` berhasil di-update & diinisialisasi untuk Arsitektur SaaS Multi-Tenant!`);
    await pool.end();
  } catch (error) {
    console.error('❌ Gagal inisialisasi MySQL Database:', error);
  }
}

initDatabase();
