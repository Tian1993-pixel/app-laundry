const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MySQL Pool Connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'db_laundry',
  waitForConnections: true,
  connectionLimit: 10
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
// 1. STORE SETTINGS API
// =========================================================================
app.get('/api/settings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM store_settings LIMIT 1');
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
    first_member_discount, point_redeem_threshold, point_redeem_discount 
  } = req.body;

  const sName = store_name || 'Laundry Fresh & Clean';
  const sTagline = tagline || 'Solusi Pakaian Bersih, Rapi & Harum Premium';
  const sAddress = address || 'Jl. Raya Utama No. 12, Bandung';
  const sPhone = phone || '081234567890';
  const sHeaderNote = header_receipt_note || 'Nota Resmi Pembayaran Laundry';
  const sFooterNote = footer_receipt_note || 'Terima kasih telah mempercayakan pakaian Anda kepada kami!';

  try {
    const [result] = await pool.query(
      `UPDATE store_settings SET 
        store_name = ?, tagline = ?, address = ?, phone = ?, 
        logo_url = COALESCE(?, logo_url), banner_url = COALESCE(?, banner_url),
        maps_embed_url = COALESCE(?, maps_embed_url),
        header_receipt_note = ?, footer_receipt_note = ?,
        first_member_discount = ?, point_redeem_threshold = ?, point_redeem_discount = ?
       WHERE id = 1`,
      [
        sName, sTagline, sAddress, sPhone, 
        logo_url || null, banner_url || null, maps_embed_url || null,
        sHeaderNote, sFooterNote,
        first_member_discount || 10000, point_redeem_threshold || 10, point_redeem_discount || 10000
      ]
    );

    if (result.affectedRows === 0) {
      await pool.query(
        `INSERT INTO store_settings 
          (id, store_name, tagline, address, phone, logo_url, banner_url, header_receipt_note, footer_receipt_note, first_member_discount, point_redeem_threshold, point_redeem_discount)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sName, sTagline, sAddress, sPhone,
          logo_url || null, banner_url || null,
          sHeaderNote, sFooterNote,
          first_member_discount || 10000, point_redeem_threshold || 10, point_redeem_discount || 10000
        ]
      );
    }

    res.json({ success: true, message: 'Pengaturan toko berhasil diperbarui di database!' });
  } catch (error) {
    console.error('API /api/settings error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui settings', error: error.message });
  }
});

// =========================================================================
// 2. OUTLETS API
// =========================================================================
app.get('/api/outlets', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM outlets WHERE is_active = 1 ORDER BY id ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat outlets', error: error.message });
  }
});

app.post('/api/outlets', async (req, res) => {
  const { store_name, address, phone, maps_embed_url } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO outlets (store_name, address, phone, maps_embed_url) VALUES (?, ?, ?, ?)',
      [store_name, address, phone, maps_embed_url || null]
    );
    res.json({ success: true, message: 'Outlet baru berhasil ditambahkan', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menambah outlet', error: error.message });
  }
});

app.put('/api/outlets/:id', async (req, res) => {
  const { id } = req.params;
  const { store_name, address, phone, maps_embed_url } = req.body;
  try {
    await pool.query(
      'UPDATE outlets SET store_name = ?, address = ?, phone = ?, maps_embed_url = ? WHERE id = ?',
      [store_name, address, phone, maps_embed_url || null, id]
    );
    res.json({ success: true, message: 'Outlet berhasil diperbarui!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal update outlet', error: error.message });
  }
});

// =========================================================================
// 3. BANK ACCOUNTS API
// =========================================================================
app.get('/api/bank-accounts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM bank_accounts ORDER BY id ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat rekening bank', error: error.message });
  }
});

app.post('/api/bank-accounts', async (req, res) => {
  const { bank_name, account_number, account_holder, qr_code_url } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO bank_accounts (bank_name, account_number, account_holder, qr_code_url) VALUES (?, ?, ?, ?)',
      [bank_name, account_number, account_holder || '-', qr_code_url || null]
    );
    res.json({ success: true, message: 'Rekening bank / QRIS berhasil ditambahkan', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menambah rekening bank', error: error.message });
  }
});

app.put('/api/bank-accounts/:id', async (req, res) => {
  const { id } = req.params;
  const { bank_name, account_number, account_holder, qr_code_url } = req.body;
  try {
    await pool.query(
      'UPDATE bank_accounts SET bank_name = ?, account_number = ?, account_holder = ?, qr_code_url = COALESCE(?, qr_code_url) WHERE id = ?',
      [bank_name, account_number, account_holder, qr_code_url || null, id]
    );
    res.json({ success: true, message: 'Rekening / QRIS berhasil diperbarui!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui rekening', error: error.message });
  }
});

app.delete('/api/bank-accounts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM bank_accounts WHERE id = ?', [id]);
    res.json({ success: true, message: 'Rekening / QRIS berhasil dihapus!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menghapus rekening', error: error.message });
  }
});

// =========================================================================
// 4. SERVICES API
// =========================================================================
app.get('/api/services', async (req, res) => {
  try {
    const [services] = await pool.query('SELECT * FROM services WHERE is_active = 1 ORDER BY category ASC, service_name ASC');
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat layanan', error: error.message });
  }
});

app.post('/api/services', async (req, res) => {
  const { service_name, category, price, unit, duration_hours } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO services (service_name, category, price, unit, duration_hours) VALUES (?, ?, ?, ?, ?)',
      [service_name, category, price, unit || 'kg', duration_hours || 48]
    );
    res.json({ success: true, message: 'Layanan berhasil ditambahkan', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menambah layanan', error: error.message });
  }
});

// =========================================================================
// 5. CUSTOMERS / MEMBERS API
// =========================================================================
app.get('/api/customers', async (req, res) => {
  try {
    const [customers] = await pool.query('SELECT * FROM customers ORDER BY id DESC');
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat pelanggan', error: error.message });
  }
});

app.post('/api/customers', async (req, res) => {
  const { name, phone, password, address } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO customers (name, phone, password, address, points, deposit_balance, is_first_order) VALUES (?, ?, ?, ?, 0, 0.00, 1)',
      [name, phone, password || '123', address || '-']
    );
    res.json({ success: true, message: 'Pelanggan berhasil ditambahkan', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menambah pelanggan (No. HP mungkin sudah terdaftar)', error: error.message });
  }
});

app.post('/api/customers/login', async (req, res) => {
  const { phone, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM customers WHERE phone = ?', [phone]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Nomor HP belum terdaftar sebagai member.' });
    }
    const user = rows[0];
    if (user.password && user.password !== password) {
      return res.status(401).json({ success: false, message: 'Password salah.' });
    }
    res.json({ success: true, message: 'Login berhasil', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal proses login', error: error.message });
  }
});

app.post('/api/customers/:id/deposit', async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;
  try {
    await pool.query('UPDATE customers SET deposit_balance = deposit_balance + ? WHERE id = ?', [amount, id]);
    res.json({ success: true, message: `Deposit sebesar Rp ${amount} berhasil ditambahkan` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal top up deposit', error: error.message });
  }
});

// =========================================================================
// 6. EMPLOYEES & ATTENDANCE API
// =========================================================================
app.get('/api/employees', async (req, res) => {
  try {
    const [employees] = await pool.query('SELECT * FROM employees ORDER BY id ASC');
    res.json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat pegawai', error: error.message });
  }
});

app.post('/api/employees', async (req, res) => {
  const { name, role, phone, salary } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO employees (name, role, phone, salary, status) VALUES (?, ?, ?, ?, "Aktif")',
      [name, role || 'Kasir', phone, salary || 2500000]
    );
    res.json({ success: true, message: 'Pegawai berhasil ditambahkan', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menambah pegawai', error: error.message });
  }
});

app.get('/api/attendances', async (req, res) => {
  try {
    const [attendances] = await pool.query('SELECT * FROM attendances ORDER BY id DESC LIMIT 100');
    res.json({ success: true, data: attendances });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat presensi', error: error.message });
  }
});

app.post('/api/attendances/clock-in', async (req, res) => {
  const { employee_id, employee_name, role, date, time } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO attendances (employee_id, employee_name, role, date, clock_in, clock_out, status) VALUES (?, ?, ?, ?, ?, "-", "Hadir")',
      [employee_id, employee_name, role, date, time]
    );
    res.json({ success: true, message: 'Clock-in berhasil dicatat', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal simpan presensi clock-in', error: error.message });
  }
});

app.post('/api/attendances/clock-out', async (req, res) => {
  const { employee_id, date, time } = req.body;
  try {
    await pool.query(
      'UPDATE attendances SET clock_out = ? WHERE employee_id = ? AND date = ?',
      [time, employee_id, date]
    );
    res.json({ success: true, message: 'Clock-out berhasil dicatat' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal simpan presensi clock-out', error: error.message });
  }
});

// =========================================================================
// 7. EXPENSES API
// =========================================================================
app.get('/api/expenses', async (req, res) => {
  try {
    const [expenses] = await pool.query('SELECT * FROM expenses ORDER BY id DESC');
    res.json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat pengeluaran', error: error.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  const { title, category, amount, notes, date } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO expenses (title, category, amount, notes, date) VALUES (?, ?, ?, ?, ?)',
      [title, category || 'Operasional', amount, notes || '-', date || new Date().toLocaleString('id-ID')]
    );
    res.json({ success: true, message: 'Pengeluaran berhasil dicatat', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mencatat pengeluaran', error: error.message });
  }
});

// =========================================================================
// 8. CUSTOMER REVIEWS API
// =========================================================================
app.get('/api/reviews', async (req, res) => {
  try {
    const [reviews] = await pool.query('SELECT * FROM reviews ORDER BY id DESC');
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat ulasan', error: error.message });
  }
});

app.post('/api/reviews', async (req, res) => {
  const { customer_name, rating, package_used, comment } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO reviews (customer_name, rating, package_used, comment) VALUES (?, ?, ?, ?)',
      [customer_name, rating || 5, package_used || 'Paket Kiloan Reguler', comment]
    );
    res.json({ success: true, message: 'Ulasan Anda berhasil dikirim! Terima kasih.', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengirim ulasan', error: error.message });
  }
});

// =========================================================================
// 9. ORDERS & TRANSACTIONS API
// =========================================================================
app.get('/api/orders', async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT o.*, 
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'service_name', oi.service_name,
            'qty', oi.qty,
            'unit', oi.unit,
            'price_per_unit', oi.price_per_unit,
            'subtotal', oi.subtotal
          )
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
    res.json({ success: true, data: orders });
  } catch (error) {
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
      items
    } = req.body;

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const finalInvoiceNo = invoice_number || `LD-${dateStr}-${Math.floor(100 + Math.random() * 900)}`;

    const [orderResult] = await connection.query(
      `INSERT INTO orders (
        invoice_number, customer_id, customer_name, customer_phone, 
        payment_type, payment_status, work_status, subtotal_amount, discount_amount,
        shipping_fee, other_fee, total_amount, paid_amount, change_amount, 
        rack_location, perfume_variant, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
      'UPDATE orders SET paid_amount = ?, payment_status = ? WHERE id = ?',
      [paid_amount, payment_status || 'paid', id]
    );
    res.json({ success: true, message: 'Pembayaran berhasil diperbarui' });
  } catch (error) {
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

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Backend App Laundry running on http://localhost:${PORT}`);
  console.log(`📊 Connected to MySQL Database: db_laundry`);
});