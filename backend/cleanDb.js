const mysql = require('mysql2/promise');
require('dotenv').config();

async function cleanDatabase() {
  const DB_HOST = process.env.DB_HOST || 'localhost';
  const DB_USER = process.env.DB_USER || 'root';
  const DB_PASS = process.env.DB_PASS || '';
  const DB_NAME = process.env.DB_NAME || 'db_laundry';

  try {
    console.log(`🧹 Menghubungkan ke MySQL Server di ${DB_HOST} untuk pembersihan data...`);
    const pool = mysql.createPool({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10
    });

    // 1. Delete all transactional test data
    console.log('🗑️ Menghapus data transaksi, order_items, pelanggan, pengeluaran, & presensi...');
    await pool.query('DELETE FROM order_items');
    await pool.query('DELETE FROM orders');
    await pool.query('DELETE FROM customers');
    await pool.query('DELETE FROM expenses');
    await pool.query('DELETE FROM attendances');
    await pool.query('DELETE FROM reviews');

    // Reset Auto Increment for clean IDs
    try { await pool.query('ALTER TABLE order_items AUTO_INCREMENT = 1'); } catch (e) {}
    try { await pool.query('ALTER TABLE orders AUTO_INCREMENT = 1'); } catch (e) {}
    try { await pool.query('ALTER TABLE customers AUTO_INCREMENT = 1'); } catch (e) {}
    try { await pool.query('ALTER TABLE expenses AUTO_INCREMENT = 1'); } catch (e) {}
    try { await pool.query('ALTER TABLE attendances AUTO_INCREMENT = 1'); } catch (e) {}
    try { await pool.query('ALTER TABLE reviews AUTO_INCREMENT = 1'); } catch (e) {}

    // 2. Clear extra tenants (Keep only Tenant 1 = laundryAja)
    console.log('🧹 Membersihkan tenant ekstra & menyisakan Tenant 1 (laundryAja)...');
    await pool.query('DELETE FROM saas_tenants WHERE id > 1');

    const bcrypt = require('bcryptjs');
    const hashedPass = await bcrypt.hash('123456', 10);

    const [t1] = await pool.query('SELECT id FROM saas_tenants WHERE id = 1');
    if (t1.length === 0) {
      await pool.query(`
        INSERT INTO saas_tenants (id, name, email, phone, store_name, domain_slug, password, status, plan)
        VALUES (1, 'Owner LaundryAja', 'owner@laundryaja.my.id', '081234567890', 'laundryAja', 'laundryaja', ?, 'active', 'enterprise');
      `, [hashedPass]);
    } else {
      await pool.query(`
        UPDATE saas_tenants 
        SET name = 'Owner LaundryAja', email = 'owner@laundryaja.my.id', phone = '081234567890', 
            store_name = 'laundryAja', domain_slug = 'laundryaja', status = 'active', plan = 'enterprise'
        WHERE id = 1;
      `);
    }

    // 3. Reset Store Settings for Tenant 1
    console.log('⚙️ Mengatur ulang store_settings default untuk laundryAja...');
    await pool.query('DELETE FROM store_settings WHERE tenant_id > 1 OR (tenant_id IS NULL AND id > 1)');
    const [s1] = await pool.query('SELECT id FROM store_settings WHERE tenant_id = 1 OR id = 1 LIMIT 1');
    if (s1.length === 0) {
      await pool.query(`
        INSERT INTO store_settings (id, tenant_id, store_name, tagline, address, phone, logo_url, banner_url)
        VALUES (1, 1, 'laundryAja', 'Solusi Pakaian Bersih, Rapi & Harum Premium', 'Jl. Raya Utama No. 12, Bandung', '081234567890', '/images/laundry_logo.png', '/images/laundry_hero_banner.png');
      `);
    } else {
      await pool.query(`
        UPDATE store_settings 
        SET tenant_id = 1, store_name = 'laundryAja', tagline = 'Solusi Pakaian Bersih, Rapi & Harum Premium',
            address = 'Jl. Raya Utama No. 12, Bandung', phone = '081234567890'
        WHERE id = ${s1[0].id};
      `);
    }

    // 4. Reset Outlets for Tenant 1
    console.log('📍 Mengatur ulang outlets default untuk laundryAja...');
    await pool.query('DELETE FROM outlets');
    await pool.query(`
      INSERT INTO outlets (id, tenant_id, store_name, address, phone) VALUES 
      (1, 1, 'laundryAja (Pusat)', 'Jl. Raya Utama No. 12, Bandung', '081234567890'),
      (2, 1, 'laundryAja (Cabang Dago)', 'Jl. Ir. H. Juanda No. 88, Bandung', '081299881122');
    `);

    // 5. Reset Services for Tenant 1
    console.log('🧺 Mengatur ulang layanan default untuk laundryAja...');
    await pool.query('DELETE FROM services WHERE tenant_id > 1');
    await pool.query('UPDATE services SET tenant_id = 1 WHERE tenant_id IS NULL OR tenant_id = 0');

    // 6. Reset Perfumes for Tenant 1
    console.log('🌸 Mengatur ulang aroma parfum default untuk laundryAja...');
    await pool.query('DELETE FROM perfumes WHERE tenant_id > 1');
    await pool.query('UPDATE perfumes SET tenant_id = 1 WHERE tenant_id IS NULL OR tenant_id = 0');

    // 7. Reset Bank Accounts for Tenant 1
    console.log('💳 Mengatur ulang rekening bank default untuk laundryAja...');
    await pool.query('DELETE FROM bank_accounts WHERE tenant_id > 1');
    await pool.query('UPDATE bank_accounts SET tenant_id = 1 WHERE tenant_id IS NULL OR tenant_id = 0');

    // 8. Reset Employees & Attendances for Tenant 1
    console.log('👤 Mengatur ulang data pegawai, presensi, & ulasan default untuk laundryAja...');
    await pool.query('DELETE FROM employees WHERE tenant_id > 1');
    await pool.query('UPDATE employees SET tenant_id = 1 WHERE tenant_id IS NULL OR tenant_id = 0');
    await pool.query('DELETE FROM attendances WHERE tenant_id > 1');
    await pool.query('UPDATE attendances SET tenant_id = 1 WHERE tenant_id IS NULL OR tenant_id = 0');
    await pool.query('DELETE FROM reviews WHERE tenant_id > 1');
    await pool.query('UPDATE reviews SET tenant_id = 1 WHERE tenant_id IS NULL OR tenant_id = 0');

    console.log('====================================================');
    console.log('🎉 PEMBERSIHAN DATABASE BERHASIL!');
    console.log('📌 Tenant Default: laundryAja (ID: 1)');
    console.log('📌 Domain Slug Default: laundryaja');
    console.log('📌 Data transaksi, pelanggan, & pengeluaran telah di-reset bersih (0 data).');
    console.log('====================================================');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    process.exit(1);
  }
}

cleanDatabase();
