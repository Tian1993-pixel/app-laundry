import localtunnel from 'localtunnel';
import https from 'https';
import fs from 'fs';

(async () => {
  try {
    const tunnel = await localtunnel({ port: 5173, subdomain: 'laundry-fresh-2026' });

    https.get('https://api.ipify.org', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const content = `URL:${tunnel.url}\nPASS:${data.trim()}`;
        console.log(content);
        fs.writeFileSync('tunnel.txt', content);
      });
    });

    tunnel.on('close', () => {
      console.log('Tunnel closed');
    });
  } catch (e) {
    console.error('ERROR:', e);
  }
})();
