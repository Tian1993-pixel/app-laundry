const pool = require('../config/db');

const createOrder = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      customer_id,
      customer_name,
      customer_phone,
      payment_type,
      payment_status,
      total_amount,
      paid_amount,
      perfume_variant,
      rack_location,
      notes,
      items
    } = req.body;

    // Generasi Nomor Invoice Otomatis (Format: LD-YYYYMMDD-XXX)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const [countRow] = await connection.query('SELECT COUNT(*) as total FROM orders WHERE DATE(created_at) = CURDATE()');
    const orderSeq = String(countRow[0].total + 1).padStart(3, '0');
    const invoice_number = `LD-${dateStr}-${orderSeq}`;

    const change_amount = paid_amount > total_amount ? paid_amount - total_amount : 0;

    // Simpan Header Order
    const [orderResult] = await connection.query(
      `INSERT INTO orders 
      (invoice_number, customer_id, customer_name, customer_phone, payment_type, payment_status, total_amount, paid_amount, change_amount, rack_location, perfume_variant, notes, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoice_number, customer_id || null, customer_name, customer_phone,
        payment_type || 'cash', payment_status || 'unpaid', total_amount, paid_amount || 0,
        change_amount, rack_location || '-', perfume_variant || 'Original', notes || '', req.user.id
      ]
    );

    const orderId = orderResult.insertId;

    // Simpan Detail Item Order
    for (let item of items) {
      await connection.query(
        `INSERT INTO order_items (order_id, service_id, service_name, qty, price_per_unit, subtotal, item_notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, item.service_id || null, item.service_name, item.qty, item.price_per_unit, item.subtotal, item.item_notes || '']
      );
    }

    // Jika Bayar Pakai Saldo Deposit Member
    if (payment_type === 'deposit' && customer_id) {
      await connection.query('UPDATE customers SET deposit_balance = deposit_balance - ? WHERE id = ?', [total_amount, customer_id]);
    }

    // Tambahkan Poin Pelanggan (1 Poin tiap kelipatan Rp 10.000)
    if (customer_id) {
      const earnedPoints = Math.floor(total_amount / 10000);
      if (earnedPoints > 0) {
        await connection.query('UPDATE customers SET points = points + ? WHERE id = ?', [earnedPoints, customer_id]);
      }
    }

    await connection.commit();
    connection.release();

    res.json({
      success: true,
      message: 'Transaksi berhasil disimpan',
      invoice_number,
      order_id: orderId
    });

  } catch (error) {
    await connection.rollback();
    connection.release();
    res.status(500).json({ success: false, message: 'Gagal membuat transaksi POS', error: error.message });
  }
};

const getOrders = async (req, res) => {
  const { status, payment_status, search } = req.query;
  let sql = 'SELECT * FROM orders WHERE 1=1';
  const params = [];

  if (status) {
    sql += ' AND work_status = ?';
    params.push(status);
  }
  if (payment_status) {
    sql += ' AND payment_status = ?';
    params.push(payment_status);
  }
  if (search) {
    sql += ' AND (invoice_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY created_at DESC';

  try {
    const [orders] = await pool.query(sql, params);
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat daftar pesanan', error: error.message });
  }
};

const getOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ? OR invoice_number = ?', [id, id]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    const order = orders[0];
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);

    res.json({
      success: true,
      data: { ...order, items }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat detail pesanan', error: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { work_status, rack_location } = req.body;
  try {
    await pool.query(
      'UPDATE orders SET work_status = ?, rack_location = COALESCE(?, rack_location) WHERE id = ?',
      [work_status, rack_location, id]
    );
    res.json({ success: true, message: `Status cucian diperbarui menjadi: ${work_status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui status cucian', error: error.message });
  }
};

const updateOrderPayment = async (req, res) => {
  const { id } = req.params;
  const { paid_amount, payment_type, payment_status } = req.body;
  try {
    const [orders] = await pool.query('SELECT total_amount FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) return res.status(404).json({ message: 'Order tidak ditemukan' });

    const total = Number(orders[0].total_amount);
    const change = paid_amount > total ? paid_amount - total : 0;

    await pool.query(
      'UPDATE orders SET paid_amount = ?, change_amount = ?, payment_type = ?, payment_status = ? WHERE id = ?',
      [paid_amount, change, payment_type, payment_status || 'paid', id]
    );

    res.json({ success: true, message: 'Pembayaran berhasil diperbarui' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui pembayaran', error: error.message });
  }
};

const trackOrder = async (req, res) => {
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
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderPayment,
  trackOrder
};