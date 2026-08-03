const pool = require('../config/db');

const getServices = async (req, res) => {
  try {
    const [services] = await pool.query('SELECT * FROM services WHERE is_active = 1 ORDER BY category ASC, service_name ASC');
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat daftar layanan', error: error.message });
  }
};

const createService = async (req, res) => {
  const { service_name, category, price, unit, duration_hours } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO services (service_name, category, price, unit, duration_hours) VALUES (?, ?, ?, ?, ?)',
      [service_name, category, price, unit || 'kg', duration_hours || 48]
    );
    res.json({ success: true, message: 'Layanan baru berhasil ditambahkan', service_id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menambah layanan', error: error.message });
  }
};

const updateService = async (req, res) => {
  const { id } = req.params;
  const { service_name, category, price, unit, duration_hours, is_active } = req.body;
  try {
    await pool.query(
      'UPDATE services SET service_name = ?, category = ?, price = ?, unit = ?, duration_hours = ?, is_active = ? WHERE id = ?',
      [service_name, category, price, unit, duration_hours, is_active ?? 1, id]
    );
    res.json({ success: true, message: 'Layanan berhasil diperbarui' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui layanan', error: error.message });
  }
};

module.exports = {
  getServices,
  createService,
  updateService
};