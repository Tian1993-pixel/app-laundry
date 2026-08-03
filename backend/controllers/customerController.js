const pool = require('../config/db');

const getCustomers = async (req, res) => {
  const search = req.query.search || '';
  try {
    const [customers] = await pool.query(
      'SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY id DESC',
      [`%${search}%`, `%${search}%`]
    );
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data pelanggan', error: error.message });
  }
};

const createCustomer = async (req, res) => {
  const { name, phone, address } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)',
      [name, phone, address]
    );
    res.json({ success: true, message: 'Pelanggan berhasil ditambahkan', customer_id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menambah pelanggan (Nomor HP mungkin sudah terdaftar)', error: error.message });
  }
};

const topupDeposit = async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;
  try {
    await pool.query('UPDATE customers SET deposit_balance = deposit_balance + ? WHERE id = ?', [amount, id]);
    res.json({ success: true, message: `Saldo deposit sebesar Rp ${amount} berhasil ditambahkan!` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal top up deposit pelanggan', error: error.message });
  }
};

module.exports = {
  getCustomers,
  createCustomer,
  topupDeposit
};