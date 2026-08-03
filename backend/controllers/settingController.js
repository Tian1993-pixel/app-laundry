const pool = require('../config/db');

const getSettings = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT store_name, tagline, address, phone, logo_url, header_receipt_note, footer_receipt_note, license_active_until, is_active FROM store_settings LIMIT 1'
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pengaturan toko belum diinisialisasi.' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil pengaturan toko', error: error.message });
  }
};

const updateSettings = async (req, res) => {
  const { store_name, tagline, address, phone, logo_url, header_receipt_note, footer_receipt_note } = req.body;
  try {
    await pool.query(
      `UPDATE store_settings SET 
        store_name = ?, tagline = ?, address = ?, phone = ?, logo_url = ?, 
        header_receipt_note = ?, footer_receipt_note = ? 
       WHERE id = 1`,
      [store_name, tagline, address, phone, logo_url, header_receipt_note, footer_receipt_note]
    );
    res.json({ success: true, message: 'Pengaturan toko berhasil diperbarui!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui pengaturan toko', error: error.message });
  }
};

const updateLicense = async (req, res) => {
  const { license_key, license_active_until } = req.body;
  try {
    await pool.query(
      'UPDATE store_settings SET license_key = ?, license_active_until = ?, is_active = 1 WHERE id = 1',
      [license_key, license_active_until]
    );
    res.json({ success: true, message: 'Lisensi aplikasi berhasil diaktifkan!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengaktifkan lisensi', error: error.message });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  updateLicense
};