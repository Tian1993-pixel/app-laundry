const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'laundry_app_secret_key_2026';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health Check Routes for cPanel Phusion Passenger Availability Verification
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send('<!DOCTYPE html><html><head><title>Backend Laundry API</title></head><body><h1>🚀 Backend API Running Successfully</h1><p>Status: OK</p></body></html>');
});

app.get('/api', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send('<!DOCTYPE html><html><head><title>Backend Laundry API</title></head><body><h1>🚀 Backend API Running Successfully</h1><p>Status: OK</p></body></html>');
});

// MySQL Pool Connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'db_laundry',
  waitForConnections: true,
  connectionLimit: 10
});

// Auto-Migration & Schema Verification for store_settings & outlets
(async () => {
  try {
    await pool.query(`ALTER TABLE store_settings ADD COLUMN open_time VARCHAR(10) DEFAULT '07:00';`).catch(() => {});
    await pool.query(`ALTER TABLE store_settings ADD COLUMN close_time VARCHAR(10) DEFAULT '21:00';`).catch(() => {});
    await pool.query(`ALTER TABLE store_settings ADD COLUMN operating_days VARCHAR(100) DEFAULT 'Senin - Minggu';`).catch(() => {});
    await pool.query(`ALTER TABLE store_settings ADD COLUMN operating_hours VARCHAR(150) DEFAULT 'Senin - Minggu: 07:00 - 21:00 WIB';`).catch(() => {});
    await pool.query(`ALTER TABLE store_settings ADD COLUMN social_instagram VARCHAR(255) DEFAULT 'https://instagram.com';`).catch(() => {});
    await pool.query(`ALTER TABLE store_settings ADD COLUMN social_facebook VARCHAR(255) DEFAULT 'https://facebook.com';`).catch(() => {});
    await pool.query(`ALTER TABLE store_settings ADD COLUMN social_tiktok VARCHAR(255) DEFAULT 'https://tiktok.com';`).catch(() => {});
    await pool.query(`ALTER TABLE store_settings ADD COLUMN social_whatsapp VARCHAR(50) DEFAULT '081234567890';`).catch(() => {});
    await pool.query(`ALTER TABLE outlets ADD COLUMN operating_hours VARCHAR(150) DEFAULT 'Senin - Minggu: 07:00 - 21:00 WIB';`).catch(() => {});
    await pool.query(`ALTER TABLE store_settings ADD COLUMN maps_embed_url TEXT;`).catch(() => {});
    await pool.query(`ALTER TABLE outlets ADD COLUMN maps_embed_url TEXT;`).catch(() => {});
    await pool.query(`ALTER TABLE orders DROP INDEX invoice_number;`).catch(() => {});
    console.log('✅ Schema migration check completed for store_settings, outlets & multi-tenant orders index.');
  } catch (e) {
    console.log('Migration check info:', e.message);
  }
})();

// AUTH LOGIN API FOR KASIR & ADMIN
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username dan password wajib diisi!' });
  }

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE username = ? OR username = ?', [username, username]);
    let user = users[0];

    // If user not found directly in users table, fallback check saas_tenants
    if (!user) {
      const [tenants] = await pool.query('SELECT * FROM saas_tenants WHERE email = ? OR phone = ?', [username, username]);
      if (tenants.length > 0) {
        const tenant = tenants[0];
        const isMatch = await bcrypt.compare(password, tenant.password).catch(() => false) || (password === tenant.password);
        if (!isMatch) {
          return res.status(400).json({ success: false, message: 'Password yang Anda masukkan salah!' });
        }

        const [existingUsers] = await pool.query('SELECT * FROM users WHERE tenant_id = ? AND role = "admin"', [tenant.id]);
        if (existingUsers.length > 0) {
          user = existingUsers[0];
        } else {
          const [newUser] = await pool.query(
            'INSERT INTO users (tenant_id, name, username, password, role) VALUES (?, ?, ?, ?, "admin")',
            [tenant.id, tenant.name, tenant.email, tenant.password]
          );
          user = { id: newUser.insertId, tenant_id: tenant.id, name: tenant.name, username: tenant.email, role: 'admin' };
        }

        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role, name: user.name, tenant_id: tenant.id },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        return res.json({
          success: true,
          message: `Login berhasil. Selamat datang ${tenant.name} (${tenant.store_name})!`,
          token,
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role,
            tenant_id: tenant.id
          },
          tenant: {
            id: tenant.id,
            name: tenant.name,
            email: tenant.email,
            phone: tenant.phone,
            store_name: tenant.store_name,
            status: tenant.status
          }
        });
      }
      return res.status(400).json({ success: false, message: 'Username atau password tidak ditemukan!' });
    }

    const isMatch = await bcrypt.compare(password, user.password).catch(() => false) || (password === user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Password yang Anda masukkan salah!' });
    }

    // Fetch tenant associated with user if any
    let tenantInfo = null;
    if (user.tenant_id) {
      const [tRows] = await pool.query('SELECT id, name, email, phone, store_name, status FROM saas_tenants WHERE id = ?', [user.tenant_id]);
      if (tRows.length > 0) tenantInfo = tRows[0];
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name, tenant_id: user.tenant_id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: `Login berhasil. Selamat datang ${user.name}!`,
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        tenant_id: user.tenant_id
      },
      tenant: tenantInfo
    });
  } catch (error) {
    console.error('Error login:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server login', error: error.message });
  }
});

app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: system-ui, sans-serif; text-align: center; padding: 50px;">
      <h2>🚀 Backend API App Laundry Berhasil Berjalan!</h2>
      <p>Port 5000 ini khusus layanan REST API data (JSON).</p>
      <p>Untuk membuka tampilan aplikasi/website utama, silakan klik link di bawah:</p>
      <a href="http://app-laundry.test" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 10px;">Buka http://app-laundry.test</a>
      <br/><br/>
      <a href="http://localhost/app-laundry" style="color: #4b5563;">Atau buka http://localhost/app-laundry</a>
    </div>
  `);
});

// =========================================================================
// 1. STORE SETTINGS API (ISOLATED BY TENANT)
// =========================================================================
app.get('/api/settings', async (req, res) => {
  const tenant_id = req.query.tenant_id || 1;
  try {
    const [rows] = await pool.query('SELECT * FROM store_settings WHERE tenant_id = ? LIMIT 1', [tenant_id]);
    if (rows.length === 0) {
      return res.json({ success: true, data: null });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil settings', error: error.message });
  }
});

app.put('/api/settings', async (req, res) => {
  const { 
    store_name, tagline, address, phone, logo_url, banner_url, maps_embed_url,
    header_receipt_note, footer_receipt_note, 
    open_time, close_time, operating_days, operating_hours,
    social_instagram, social_facebook, social_tiktok, social_whatsapp,
    first_member_discount, point_redeem_threshold, point_redeem_discount,
    receipt_font_size, tenant_id: bodyTenantId
  } = req.body;
  const tenant_id = bodyTenantId || req.query.tenant_id || 1;

  const sName = store_name || 'Laundry Fresh & Clean';
  const sTagline = tagline || 'Solusi Pakaian Bersih, Rapi & Harum Premium';
  const sAddress = address || 'Jl. Raya Utama No. 12, Bandung';
  const sPhone = phone || '081234567890';
  const sHeaderNote = header_receipt_note || 'Nota Resmi Pembayaran Laundry';
  const sFooterNote = footer_receipt_note || 'Terima kasih telah mempercayakan pakaian Anda kepada kami!';
  const sOpenTime = open_time || '07:00';
  const sCloseTime = close_time || '21:00';
  const sDays = operating_days || 'Senin - Minggu';
  const sOpHours = operating_hours || `${sDays}: ${sOpenTime} - ${sCloseTime} WIB`;
  const sInsta = social_instagram || 'https://instagram.com';
  const sFb = social_facebook || 'https://facebook.com';
  const sTiktok = social_tiktok || 'https://tiktok.com';
  const sWa = social_whatsapp || sPhone;
  const sPaperSize = receipt_font_size || '80mm';

  try {
    const [result] = await pool.query(
      `UPDATE store_settings SET 
        store_name = ?, tagline = ?, address = ?, phone = ?, 
        logo_url = COALESCE(?, logo_url), banner_url = COALESCE(?, banner_url),
        maps_embed_url = COALESCE(?, maps_embed_url),
        header_receipt_note = ?, footer_receipt_note = ?,
        open_time = ?, close_time = ?, operating_days = ?, operating_hours = ?,
        social_instagram = ?, social_facebook = ?, social_tiktok = ?, social_whatsapp = ?,
        first_member_discount = ?, point_redeem_threshold = ?, point_redeem_discount = ?,
        receipt_font_size = ?
       WHERE tenant_id = ?`,
      [
        sName, sTagline, sAddress, sPhone, 
        logo_url || null, banner_url || null, maps_embed_url || null,
        sHeaderNote, sFooterNote,
        sOpenTime, sCloseTime, sDays, sOpHours,
        sInsta, sFb, sTiktok, sWa,
        first_member_discount || 10000, point_redeem_threshold || 10, point_redeem_discount || 10000,
        sPaperSize,
        tenant_id
      ]
    );

    if (result.affectedRows === 0) {
      await pool.query(
        `INSERT INTO store_settings 
          (tenant_id, store_name, tagline, address, phone, logo_url, banner_url, header_receipt_note, footer_receipt_note, open_time, close_time, operating_days, operating_hours, social_instagram, social_facebook, social_tiktok, social_whatsapp, first_member_discount, point_redeem_threshold, point_redeem_discount, receipt_font_size)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tenant_id, sName, sTagline, sAddress, sPhone,
          logo_url || null, banner_url || null,
          sHeaderNote, sFooterNote, sOpenTime, sCloseTime, sDays, sOpHours,
          sInsta, sFb, sTiktok, sWa,
          first_member_discount || 10000, point_redeem_threshold || 10, point_redeem_discount || 10000,
          sPaperSize
        ]
      );
    }

    res.json({ success: true, message: 'Pengaturan toko berhasil diperbarui di database!' });
  } catch (error) {
    console.error('API /api/settings error:', error);

    // Self-healing migration fallback if columns missing
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      try {
        await pool.query(`ALTER TABLE store_settings ADD COLUMN open_time VARCHAR(10) DEFAULT '07:00';`).catch(() => {});
        await pool.query(`ALTER TABLE store_settings ADD COLUMN close_time VARCHAR(10) DEFAULT '21:00';`).catch(() => {});
        await pool.query(`ALTER TABLE store_settings ADD COLUMN operating_days VARCHAR(100) DEFAULT 'Senin - Minggu';`).catch(() => {});
        await pool.query(`ALTER TABLE store_settings ADD COLUMN operating_hours VARCHAR(150) DEFAULT 'Senin - Minggu: 07:00 - 21:00 WIB';`).catch(() => {});
        await pool.query(`ALTER TABLE store_settings ADD COLUMN social_instagram VARCHAR(255) DEFAULT 'https://instagram.com';`).catch(() => {});
        await pool.query(`ALTER TABLE store_settings ADD COLUMN social_facebook VARCHAR(255) DEFAULT 'https://facebook.com';`).catch(() => {});
        await pool.query(`ALTER TABLE store_settings ADD COLUMN social_tiktok VARCHAR(255) DEFAULT 'https://tiktok.com';`).catch(() => {});
        await pool.query(`ALTER TABLE store_settings ADD COLUMN social_whatsapp VARCHAR(50) DEFAULT '081234567890';`).catch(() => {});
        await pool.query(`ALTER TABLE store_settings ADD COLUMN maps_embed_url TEXT;`).catch(() => {});

        // Retry update after adding columns
        await pool.query(
          `UPDATE store_settings SET 
            store_name = ?, tagline = ?, address = ?, phone = ?, 
            logo_url = COALESCE(?, logo_url), banner_url = COALESCE(?, banner_url),
            maps_embed_url = COALESCE(?, maps_embed_url),
            header_receipt_note = ?, footer_receipt_note = ?,
            open_time = ?, close_time = ?, operating_days = ?, operating_hours = ?,
            social_instagram = ?, social_facebook = ?, social_tiktok = ?, social_whatsapp = ?,
            first_member_discount = ?, point_redeem_threshold = ?, point_redeem_discount = ?
           WHERE tenant_id = ?`,
          [
            sName, sTagline, sAddress, sPhone, 
            logo_url || null, banner_url || null, maps_embed_url || null,
            sHeaderNote, sFooterNote,
            sOpenTime, sCloseTime, sDays, sOpHours,
            sInsta, sFb, sTiktok, sWa,
            first_member_discount || 10000, point_redeem_threshold || 10, point_redeem_discount || 10000,
            tenant_id
          ]
        );
        return res.json({ success: true, message: 'Pengaturan toko berhasil diperbarui (tabel diperbaiki)!' });
      } catch (retryErr) {
        console.error('API /api/settings retry error:', retryErr);
      }
    }

    res.status(500).json({ success: false, message: 'Gagal memperbarui settings', error: error.message });
  }
});

// =========================================================================
// 2. OUTLETS API (ISOLATED BY TENANT)
// =========================================================================
app.get('/api/outlets', async (req, res) => {
  const tenant_id = req.query.tenant_id || 1;
  try {
    const [rows] = await pool.query('SELECT * FROM outlets WHERE is_active = 1 AND tenant_id = ? ORDER BY id ASC', [tenant_id]);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat outlets', error: error.message });
  }
});

app.post('/api/outlets', async (req, res) => {
  const { store_name, address, phone, maps_embed_url, tenant_id: bodyTenantId } = req.body;
  const tenant_id = bodyTenantId || req.query.tenant_id || 1;
  try {
    const [result] = await pool.query(
      'INSERT INTO outlets (tenant_id, store_name, address, phone, maps_embed_url) VALUES (?, ?, ?, ?, ?)',
      [tenant_id, store_name, address, phone, maps_embed_url || null]
    );
    res.json({ success: true, message: 'Outlet baru berhasil ditambahkan', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menambah outlet', error: error.message });
  }
});

app.put('/api/outlets/:id', async (req, res) => {
  const { id } = req.params;
  const { store_name, address, phone, maps_embed_url, tenant_id: bodyTenantId } = req.body;
  const tenant_id = bodyTenantId || req.query.tenant_id || 1;
  try {
    await pool.query(
      'UPDATE outlets SET store_name = ?, address = ?, phone = ?, maps_embed_url = ? WHERE id = ? AND tenant_id = ?',
      [store_name, address, phone, maps_embed_url || null, id, tenant_id]
    );
    res.json({ success: true, message: 'Outlet berhasil diperbarui!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal update outlet', error: error.message });
  }
});

// =========================================================================
// 3. BANK ACCOUNTS API (ISOLATED BY TENANT)
// =========================================================================
app.get('/api/bank-accounts', async (req, res) => {
  const tenant_id = req.query.tenant_id || 1;
  try {
    const [rows] = await pool.query('SELECT * FROM bank_accounts WHERE tenant_id = ? ORDER BY id ASC', [tenant_id]);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat rekening bank', error: error.message });
  }
});

app.post('/api/bank-accounts', async (req, res) => {
  const { bank_name, account_number, account_holder, qr_code_url, tenant_id: bodyTenantId } = req.body;
  const tenant_id = bodyTenantId || req.query.tenant_id || 1;
  try {
    const [result] = await pool.query(
      'INSERT INTO bank_accounts (tenant_id, bank_name, account_number, account_holder, qr_code_url) VALUES (?, ?, ?, ?, ?)',
      [tenant_id, bank_name, account_number, account_holder || '-', qr_code_url || null]
    );
    res.json({ success: true, message: 'Rekening bank / QRIS berhasil ditambahkan', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menambah rekening bank', error: error.message });
  }
});

app.put('/api/bank-accounts/:id', async (req, res) => {
  const { id } = req.params;
  const { bank_name, account_number, account_holder, qr_code_url, tenant_id: bodyTenantId } = req.body;
  const tenant_id = bodyTenantId || req.query.tenant_id || 1;
  try {
    await pool.query(
      'UPDATE bank_accounts SET bank_name = ?, account_number = ?, account_holder = ?, qr_code_url = COALESCE(?, qr_code_url) WHERE id = ? AND tenant_id = ?',
      [bank_name, account_number, account_holder, qr_code_url || null, id, tenant_id]
    );
    res.json({ success: true, message: 'Rekening / QRIS berhasil diperbarui!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui rekening', error: error.message });
  }
});

app.delete('/api/bank-accounts/:id', async (req, res) => {
  const { id } = req.params;
  const tenant_id = req.query.tenant_id || 1;
  try {
    await pool.query('DELETE FROM bank_accounts WHERE id = ? AND tenant_id = ?', [id, tenant_id]);
    res.json({ success: true, message: 'Rekening / QRIS berhasil dihapus!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menghapus rekening', error: error.message });
  }
});

// =========================================================================
// 4. SERVICES API (ISOLATED BY TENANT)
// =========================================================================
app.get('/api/services', async (req, res) => {
  const tenant_id = req.query.tenant_id || 1;
  try {
    const [services] = await pool.query('SELECT * FROM services WHERE is_active = 1 AND tenant_id = ? ORDER BY category ASC, service_name ASC', [tenant_id]);
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat layanan', error: error.message });
  }
});

app.post('/api/services', async (req, res) => {
  const { service_name, category, price, unit, duration_hours, tenant_id: bodyTenantId } = req.body;
  const tenant_id = bodyTenantId || req.query.tenant_id || 1;
  try {
    const [result] = await pool.query(
      'INSERT INTO services (tenant_id, service_name, category, price, unit, duration_hours, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
      [tenant_id, service_name, category, price, unit || 'kg', duration_hours || 48]
    );
    res.json({ success: true, message: 'Layanan berhasil ditambahkan', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menambah layanan', error: error.message });
  }
});

app.put('/api/services/:id', async (req, res) => {
  const { id } = req.params;
  const { service_name, category, price, unit, duration_hours, tenant_id: bodyTenantId } = req.body;
  const tenant_id = bodyTenantId || req.query.tenant_id || 1;
  try {
    await pool.query(
      'UPDATE services SET service_name = ?, category = ?, price = ?, unit = ?, duration_hours = ? WHERE id = ? AND tenant_id = ?',
      [service_name, category, price, unit || 'kg', duration_hours || 48, id, tenant_id]
    );
    res.json({ success: true, message: 'Layanan berhasil diperbarui!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui layanan', error: error.message });
  }
});

app.delete('/api/services/:id', async (req, res) => {
  const { id } = req.params;
  const tenant_id = req.query.tenant_id || 1;
  try {
    await pool.query('DELETE FROM services WHERE id = ? AND tenant_id = ?', [id, tenant_id]);
    res.json({ success: true, message: 'Layanan berhasil dihapus!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menghapus layanan', error: error.message });
  }
});

// =========================================================================
// 4.5. PERFUMES API (ISOLATED BY TENANT)
// =========================================================================
app.get('/api/perfumes', async (req, res) => {
  const tenant_id = req.query.tenant_id || 1;
  try {
    const [perfumes] = await pool.query('SELECT * FROM perfumes WHERE is_active = 1 AND tenant_id = ? ORDER BY id ASC', [tenant_id]);
    res.json({ success: true, data: perfumes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat aroma parfum', error: error.message });
  }
});

app.post('/api/perfumes', async (req, res) => {
  const { name, tenant_id: bodyTenantId } = req.body;
  const tenant_id = bodyTenantId || req.query.tenant_id || 1;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Nama aroma wajib diisi' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO perfumes (tenant_id, name, is_active) VALUES (?, ?, 1)',
      [tenant_id, name.trim()]
    );
    res.json({ success: true, message: 'Aroma parfum berhasil ditambahkan', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menambah aroma parfum', error: error.message });
  }
});

app.put('/api/perfumes/:id', async (req, res) => {
  const { id } = req.params;
  const { name, tenant_id: bodyTenantId } = req.body;
  const tenant_id = bodyTenantId || req.query.tenant_id || 1;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Nama aroma wajib diisi' });
  }
  try {
    await pool.query(
      'UPDATE perfumes SET name = ? WHERE id = ? AND tenant_id = ?',
      [name.trim(), id, tenant_id]
    );
    res.json({ success: true, message: 'Aroma parfum berhasil diperbarui!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui aroma parfum', error: error.message });
  }
});

app.delete('/api/perfumes/:id', async (req, res) => {
  const { id } = req.params;
  const tenant_id = req.query.tenant_id || 1;
  try {
    await pool.query('DELETE FROM perfumes WHERE id = ? AND tenant_id = ?', [id, tenant_id]);
    res.json({ success: true, message: 'Aroma parfum berhasil dihapus!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menghapus aroma parfum', error: error.message });
  }
});

// =========================================================================
// 5. CUSTOMERS API (ISOLATED BY TENANT)
// =========================================================================
app.get('/api/customers', async (req, res) => {
  const tenant_id = req.query.tenant_id || 1;
  try {
    const [customers] = await pool.query('SELECT * FROM customers WHERE tenant_id = ? ORDER BY id DESC', [tenant_id]);
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat pelanggan', error: error.message });
  }
});

app.post('/api/customers', async (req, res) => {
  const { name, phone, password, address, tenant_id: bodyTenantId } = req.body;
  const tenant_id = bodyTenantId || req.query.tenant_id || 1;
  try {
    const [result] = await pool.query(
      'INSERT INTO customers (tenant_id, name, phone, password, address, points, deposit_balance, is_first_order) VALUES (?, ?, ?, ?, ?, 0, 0.00, 1)',
      [tenant_id, name, phone, password || '123', address || '-']
    );
    res.json({ success: true, message: 'Pelanggan berhasil ditambahkan', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menambah pelanggan', error: error.message });
  }
});

// =========================================================================
// 6. EMPLOYEES & ATTENDANCE API (ISOLATED BY TENANT)
// =========================================================================
app.get('/api/employees', async (req, res) => {
  const tenant_id = req.query.tenant_id || 1;
  try {
    const [employees] = await pool.query('SELECT * FROM employees WHERE tenant_id = ? ORDER BY id ASC', [tenant_id]);
    res.json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat pegawai', error: error.message });
  }
});

app.post('/api/employees', async (req, res) => {
  const { name, role, phone, salary, tenant_id: bodyTenantId } = req.body;
  const tenant_id = bodyTenantId || req.query.tenant_id || 1;
  try {
    const [result] = await pool.query(
      'INSERT INTO employees (tenant_id, name, role, phone, salary, status) VALUES (?, ?, ?, ?, ?, "Aktif")',
      [tenant_id, name, role || 'Kasir', phone, salary || 2500000]
    );
    res.json({ success: true, message: 'Pegawai berhasil ditambahkan', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menambah pegawai', error: error.message });
  }
});

app.get('/api/attendances', async (req, res) => {
  const tenant_id = req.query.tenant_id || 1;
  try {
    const [attendances] = await pool.query('SELECT * FROM attendances WHERE tenant_id = ? ORDER BY id DESC LIMIT 100', [tenant_id]);
    res.json({ success: true, data: attendances });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat presensi', error: error.message });
  }
});

app.post('/api/attendances', async (req, res) => {
  const { employee_name, date, time_in, status, tenant_id: bodyTenantId } = req.body;
  const tenant_id = bodyTenantId || req.query.tenant_id || 1;
  try {
    const [result] = await pool.query(
      'INSERT INTO attendances (tenant_id, employee_name, date, time_in, status) VALUES (?, ?, ?, ?, ?)',
      [tenant_id, employee_name, date || new Date().toISOString().slice(0, 10), time_in || new Date().toLocaleTimeString('id-ID'), status || 'Hadir']
    );
    res.json({ success: true, message: 'Presensi berhasil dicatat', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mencatat presensi', error: error.message });
  }
});

// =========================================================================
// REVIEWS API (ISOLATED BY TENANT)
// =========================================================================
app.get('/api/reviews', async (req, res) => {
  const tenant_id = req.query.tenant_id || 1;
  try {
    const [reviews] = await pool.query('SELECT * FROM reviews WHERE tenant_id = ? ORDER BY id DESC', [tenant_id]);
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat ulasan', error: error.message });
  }
});

app.post('/api/reviews', async (req, res) => {
  const { customer_name, rating, package_used, comment, tenant_id: bodyTenantId } = req.body;
  const tenant_id = bodyTenantId || req.query.tenant_id || 1;
  try {
    const [result] = await pool.query(
      'INSERT INTO reviews (tenant_id, customer_name, rating, package_used, comment) VALUES (?, ?, ?, ?, ?)',
      [tenant_id, customer_name, rating || 5, package_used || 'Paket Kiloan Reguler', comment]
    );
    res.json({ success: true, message: 'Ulasan berhasil ditambahkan!', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menambahkan ulasan', error: error.message });
  }
});

// =========================================================================
// 7. EXPENSES API (ISOLATED BY TENANT)
// =========================================================================
app.get('/api/expenses', async (req, res) => {
  const tenant_id = req.query.tenant_id || 1;
  try {
    const [expenses] = await pool.query('SELECT * FROM expenses WHERE tenant_id = ? ORDER BY id DESC', [tenant_id]);
    res.json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat pengeluaran', error: error.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  const { title, category, amount, notes, date, tenant_id: bodyTenantId } = req.body;
  const tenant_id = bodyTenantId || req.query.tenant_id || 1;
  try {
    const [result] = await pool.query(
      'INSERT INTO expenses (tenant_id, title, category, amount, notes, date) VALUES (?, ?, ?, ?, ?, ?)',
      [tenant_id, title, category || 'Operasional', amount, notes || '-', date || new Date().toLocaleString('id-ID')]
    );
    res.json({ success: true, message: 'Pengeluaran berhasil dicatat', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mencatat pengeluaran', error: error.message });
  }
});

// =========================================================================
// 8. ORDERS & TRANSACTIONS API (ISOLATED BY TENANT)
// =========================================================================
app.get('/api/orders', async (req, res) => {
  const tenant_id = req.query.tenant_id || 1;
  try {
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE tenant_id = ? ORDER BY id DESC',
      [tenant_id]
    );

    if (!orders || orders.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const orderIds = orders.map(o => o.id);
    const [items] = await pool.query(
      'SELECT * FROM order_items WHERE order_id IN (?)',
      [orderIds]
    );

    const itemsMap = {};
    if (Array.isArray(items)) {
      items.forEach(it => {
        if (!itemsMap[it.order_id]) itemsMap[it.order_id] = [];
        itemsMap[it.order_id].push({
          service_name: it.service_name,
          qty: Number(it.qty) || 1,
          unit: it.unit || 'kg',
          price_per_unit: Number(it.price_per_unit) || 0,
          subtotal: Number(it.subtotal) || 0
        });
      });
    }

    const result = orders.map(o => ({
      ...o,
      items: itemsMap[o.id] || []
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('API /api/orders error:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat transaksi', error: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      invoice_number,
      customer_id,
      customer_name,
      customer_phone,
      payment_type,
      payment_status,
      work_status,
      subtotal_amount,
      discount_amount,
      shipping_fee,
      other_fee,
      total_amount,
      paid_amount,
      change_amount,
      rack_location,
      perfume_variant,
      notes,
      items,
      tenant_id: bodyTenantId
    } = req.body;
    const tenant_id = bodyTenantId || req.query.tenant_id || 1;

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `LD-${dateStr}-`;

    let finalInvoiceNo = invoice_number;

    if (finalInvoiceNo) {
      const [existing] = await connection.query(
        'SELECT id FROM orders WHERE invoice_number = ? AND tenant_id = ?',
        [finalInvoiceNo, tenant_id]
      );
      if (existing && existing.length > 0) {
        const [todayOrders] = await connection.query(
          'SELECT invoice_number FROM orders WHERE tenant_id = ? AND invoice_number LIKE ?',
          [tenant_id, `${prefix}%`]
        );
        const seqs = todayOrders
          .map(o => parseInt((o.invoice_number || '').replace(prefix, ''), 10))
          .filter(seq => !isNaN(seq));
        const maxSeq = seqs.length > 0 ? Math.max(...seqs) : 0;
        finalInvoiceNo = `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;
      }
    } else {
      const [todayOrders] = await connection.query(
        'SELECT invoice_number FROM orders WHERE tenant_id = ? AND invoice_number LIKE ?',
        [tenant_id, `${prefix}%`]
      );
      const seqs = todayOrders
        .map(o => parseInt((o.invoice_number || '').replace(prefix, ''), 10))
        .filter(seq => !isNaN(seq));
      const maxSeq = seqs.length > 0 ? Math.max(...seqs) : 0;
      finalInvoiceNo = `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;
    }

    const [orderResult] = await connection.query(
      `INSERT INTO orders (
        tenant_id, invoice_number, customer_id, customer_name, customer_phone, 
        payment_type, payment_status, work_status, subtotal_amount, discount_amount,
        shipping_fee, other_fee, total_amount, paid_amount, change_amount, 
        rack_location, perfume_variant, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenant_id,
        finalInvoiceNo,
        customer_id || null,
        customer_name,
        customer_phone || '-',
        payment_type || 'cash',
        payment_status || 'unpaid',
        work_status || 'diterima',
        subtotal_amount || total_amount,
        discount_amount || 0,
        shipping_fee || 0,
        other_fee || 0,
        total_amount,
        paid_amount || 0,
        change_amount || 0,
        rack_location || 'RAK A-01',
        perfume_variant || 'Original Fresh',
        notes || '-'
      ]
    );

    const orderId = orderResult.insertId;

    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        await connection.query(
          `INSERT INTO order_items (order_id, service_name, qty, unit, price_per_unit, subtotal) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.service_name,
            item.qty || 1,
            item.unit || 'kg',
            item.price_per_unit || item.price || 0,
            item.subtotal || (item.qty * (item.price_per_unit || item.price || 0))
          ]
        );
      }
    }

    // Direct deduction for deposit payment
    if (payment_type === 'deposit' && customer_id) {
      await connection.query('UPDATE customers SET deposit_balance = deposit_balance - ? WHERE id = ?', [total_amount, customer_id]);
    }

    await connection.commit();
    connection.release();

    res.json({
      success: true,
      message: 'Transaksi berhasil disimpan ke MySQL db_laundry',
      invoice_number: finalInvoiceNo,
      order_id: orderId
    });

  } catch (error) {
    await connection.rollback();
    connection.release();
    res.status(500).json({ success: false, message: 'Gagal menyimpan pesanan ke MySQL', error: error.message });
  }
});

app.patch('/api/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { work_status, rack_location } = req.body;
  try {
    await pool.query(
      'UPDATE orders SET work_status = ?, rack_location = COALESCE(?, rack_location) WHERE id = ?',
      [work_status, rack_location, id]
    );
    res.json({ success: true, message: `Status cucian diperbarui menjadi: ${work_status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal update status cucian', error: error.message });
  }
});

app.patch('/api/orders/:id/payment', async (req, res) => {
  const { id } = req.params;
  const { paid_amount, payment_status } = req.body;
  try {
    await pool.query(
      `UPDATE orders SET 
        payment_status = ?, 
        paid_amount = COALESCE(?, total_amount) 
       WHERE id = ? OR invoice_number = ?`,
      [payment_status || 'paid', paid_amount || null, id, id]
    );
    res.json({ success: true, message: 'Pembayaran berhasil diperbarui' });
  } catch (error) {
    console.error('API /api/orders/:id/payment error:', error);
    res.status(500).json({ success: false, message: 'Gagal update pembayaran', error: error.message });
  }
});

// PUBLIC TRACKING
app.get('/api/track/:keyword', async (req, res) => {
  const { keyword } = req.params;
  try {
    const [orders] = await pool.query(
      `SELECT o.invoice_number, o.customer_name, o.payment_status, o.total_amount, 
              o.work_status, o.rack_location, o.perfume_variant, o.created_at
       FROM orders o 
       WHERE o.invoice_number = ? OR o.customer_phone = ? 
       ORDER BY o.created_at DESC LIMIT 5`,
      [keyword, keyword]
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Status cucian tidak ditemukan. Periksa kembali Nomor Nota atau No. HP Anda.' });
    }

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error server tracking', error: error.message });
  }
});

// =========================================================================
// SAAS MULTI-TENANT & SUPERADMIN API ENDPOINTS
// =========================================================================
// 0. Resolve Tenant by Subdomain / Slug (Dynamic Wildcard Domain Support)
app.get('/api/saas/resolve-tenant', async (req, res) => {
  const { subdomain, slug } = req.query;
  const searchSlug = (subdomain || slug || '').trim().toLowerCase();

  if (!searchSlug || searchSlug === 'www' || searchSlug === 'localhost' || searchSlug === 'app-laundry' || searchSlug === 'laundryaja') {
    return res.json({ success: true, isDefaultPlatform: true, tenant: null });
  }

  try {
    const [rows] = await pool.query('SELECT id, name, email, phone, store_name, domain_slug, status, trial_ends_at FROM saas_tenants WHERE domain_slug = ? OR store_name LIKE ? LIMIT 1', [searchSlug, `%${searchSlug}%`]);
    if (rows.length === 0) {
      return res.json({ success: true, isDefaultPlatform: true, tenant: null });
    }

    res.json({ success: true, isDefaultPlatform: false, tenant: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal resolve tenant', error: error.message });
  }
});

// 1. Pendaftaran Trial 7 Hari Pemilik Toko Baru
app.post('/api/saas/register', async (req, res) => {
  const { name, email, phone, store_name, password } = req.body;
  if (!name || !email || !phone || !store_name || !password) {
    return res.status(400).json({ success: false, message: 'Lengkapi Nama, Email, No. WA, Nama Laundry, dan Password!' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM saas_tenants WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar! Silakan login.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const domain_slug = store_name.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Insert Tenant with 7-Day Trial
    const [result] = await pool.query(`
      INSERT INTO saas_tenants (name, email, phone, store_name, domain_slug, password, trial_start, trial_ends_at, status)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 'trial')
    `, [name, email, phone, store_name, domain_slug, hashedPassword]);

    const tenantId = result.insertId;

    // Initialize Default Settings for this new Tenant
    await pool.query(`
      INSERT INTO store_settings (tenant_id, store_name, tagline, address, phone, logo_url, banner_url)
      VALUES (?, ?, 'Solusi Pakaian Bersih, Rapi & Harum Premium', 'Alamat Usaha', ?, '/images/laundry_logo.png', '/images/laundry_hero_banner.png')
    `, [tenantId, store_name, phone]);

    // Initialize Default Outlet for this new Tenant
    await pool.query(`
      INSERT INTO outlets (tenant_id, store_name, address, phone)
      VALUES (?, ?, 'Alamat Pusat', ?)
    `, [tenantId, `${store_name} (Pusat)`, phone]);

    // Initialize Default Services for this new Tenant
    await pool.query(`
      INSERT INTO services (tenant_id, service_name, category, price, unit, duration_hours, is_active) VALUES 
      (?, 'Cuci Komplit Reguler', 'kiloan', 7000, 'kg', 48, 1),
      (?, 'Cuci Komplit Express 24 Jam', 'express', 12000, 'kg', 24, 1),
      (?, 'Bed Cover Jumbo', 'satuan', 35000, 'pcs', 48, 1);
    `, [tenantId, tenantId, tenantId]);

    // Initialize Default Perfumes for this new Tenant
    await pool.query(`
      INSERT INTO perfumes (tenant_id, name, is_active) VALUES 
      (?, 'Original Fresh', 1),
      (?, 'Lavender Sweet', 1);
    `, [tenantId, tenantId]);

    // Initialize Owner Admin User in users table for direct POS access
    const [userRes] = await pool.query(`
      INSERT INTO users (tenant_id, name, username, password, role)
      VALUES (?, ?, ?, ?, 'admin')
    `, [tenantId, name, email, hashedPassword]);

    const token = jwt.sign({ tenant_id: tenantId, email, role: 'owner' }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Pendaftaran Coba Gratis 7 Hari berhasil! Selamat datang di aplikasi.',
      token,
      tenant: {
        id: tenantId,
        name,
        email,
        phone,
        store_name,
        domain_slug,
        status: 'trial',
        remainingDays: 7
      },
      user: {
        id: userRes.insertId,
        name,
        username: email,
        role: 'admin',
        tenant_id: tenantId
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal pendaftaran SaaS', error: error.message });
  }
});

// 2. Login Pemilik Toko (Tenant) / SuperAdmin Master
app.post('/api/saas/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Masukkan Email / Username dan Password!' });
  }

  try {
    // Check if SuperAdmin
    const [superadmins] = await pool.query('SELECT * FROM saas_superadmins WHERE username = ?', [email]);
    if (superadmins.length > 0) {
      const sa = superadmins[0];
      const isMatch = await bcrypt.compare(password, sa.password).catch(() => false) || (password === sa.password);
      if (isMatch) {
        const token = jwt.sign({ id: sa.id, role: 'superadmin' }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({
          success: true,
          isSuperAdmin: true,
          token,
          message: 'Login SuperAdmin Penyedia Layanan berhasil!'
        });
      }
    }

    // Check if Tenant
    const [tenants] = await pool.query('SELECT * FROM saas_tenants WHERE email = ? OR phone = ?', [email, email]);
    if (tenants.length === 0) {
      return res.status(400).json({ success: false, message: 'Akun Pemilik Toko tidak ditemukan. Silakan daftar lebih dulu.' });
    }

    const tenant = tenants[0];
    const isMatch = await bcrypt.compare(password, tenant.password).catch(() => false) || (password === tenant.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Password salah!' });
    }

    // Ensure owner user exists in users table
    let ownerUser = null;
    const [uRows] = await pool.query('SELECT * FROM users WHERE tenant_id = ? AND role = "admin"', [tenant.id]);
    if (uRows.length > 0) {
      ownerUser = uRows[0];
    } else {
      const [nUser] = await pool.query(
        'INSERT INTO users (tenant_id, name, username, password, role) VALUES (?, ?, ?, ?, "admin")',
        [tenant.id, tenant.name, tenant.email, tenant.password]
      );
      ownerUser = { id: nUser.insertId, tenant_id: tenant.id, name: tenant.name, username: tenant.email, role: 'admin' };
    }

    // Calculate trial countdown
    const now = new Date();
    const endsAt = new Date(tenant.trial_ends_at);
    const diffMs = endsAt - now;
    const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    let status = tenant.status;

    if (remainingDays <= 0 && status === 'trial') {
      status = 'expired';
      await pool.query('UPDATE saas_tenants SET status = "expired" WHERE id = ?', [tenant.id]);
    }

    const token = jwt.sign({ tenant_id: tenant.id, email: tenant.email, role: 'owner' }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      isSuperAdmin: false,
      token,
      message: `Selamat datang kembali, ${tenant.name}!`,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        store_name: tenant.store_name,
        trial_ends_at: tenant.trial_ends_at,
        remainingDays: Math.max(0, remainingDays),
        status
      },
      user: {
        id: ownerUser.id,
        name: tenant.name,
        username: ownerUser.username || tenant.email,
        role: 'admin',
        tenant_id: tenant.id
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal login SaaS', error: error.message });
  }
});

// 3. SuperAdmin: Get List of All Tenants
app.get('/api/saas/tenants', async (req, res) => {
  try {
    const [tenants] = await pool.query(`
      SELECT id, name, email, phone, store_name, trial_start, trial_ends_at, status, plan, created_at,
             GREATEST(0, TIMESTAMPDIFF(DAY, NOW(), trial_ends_at)) as remaining_days
      FROM saas_tenants 
      ORDER BY created_at DESC
    `);
    res.json({ success: true, data: tenants });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil daftar tenant', error: error.message });
  }
});

// 4. SuperAdmin: Update Tenant Status & Extend Trial
app.patch('/api/saas/tenants/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, extend_days } = req.body;
  try {
    if (extend_days) {
      await pool.query(`
        UPDATE saas_tenants 
        SET trial_ends_at = DATE_ADD(GREATEST(NOW(), trial_ends_at), INTERVAL ? DAY),
            status = 'active'
        WHERE id = ?
      `, [Number(extend_days), id]);
    } else if (status) {
      await pool.query('UPDATE saas_tenants SET status = ? WHERE id = ?', [status, id]);
    }
    res.json({ success: true, message: 'Status tenant & masa trial berhasil diperbarui!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal update status tenant', error: error.message });
  }
});

// 5. SuperAdmin: Delete Tenant
app.delete('/api/saas/tenants/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM saas_tenants WHERE id = ?', [id]);
    res.json({ success: true, message: 'Tenant berhasil dihapus dari sistem.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal hapus tenant', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Backend App Laundry running on http://localhost:${PORT}`);
  console.log(`📊 Connected to MySQL Database: db_laundry`);
});

module.exports = app;