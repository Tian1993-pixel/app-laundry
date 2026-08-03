const db = require('../config/db');

const checkLicense = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT license_key, license_active_until, is_active FROM store_settings LIMIT 1');
    
    if (rows.length === 0 || !rows[0].is_active) {
      return res.status(403).json({ message: 'Aplikasi belum aktif atau dinonaktifkan.' });
    }

    const settings = rows[0];
    const today = new Date();
    const expiryDate = new Date(settings.license_active_until);

    if (settings.license_active_until && today > expiryDate) {
      return res.status(402).json({ 
        message: 'Masa berlaku lisensi aplikasi telah habis. Silakan hubungi pengembang.' 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Pemeriksaan lisensi gagal', error: error.message });
  }
};

module.exports = checkLicense;