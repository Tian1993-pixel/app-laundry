const localtunnel = require('localtunnel');
const fs = require('fs');
const https = require('https');

(async () => {
  try {
    const tunnel = await localtunnel({ port: 5173 });

    https.get('https://api.ipify.org', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const info = `
==================================================
🚀 LOCALTUNNEL BERHASIL AKTIF!
==================================================
🌐 URL Publik Website (Bisa dibuka dari HP manapun):
${tunnel.url}

🔑 Password Satu Kali Buka (IP Publik Laptop Anda):
${data.trim()}
==================================================
        `;
        console.log(info);
        fs.writeFileSync('tunnel_info.txt', info);
      });
    });

    tunnel.on('close', () => {
      console.log('Tunnel closed');
    });
  } catch (err) {
    console.error('Tunnel error:', err);
  }
})();
