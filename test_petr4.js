import https from 'https';

function fetchFundamentus() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.fundamentus.com.br',
      port: 443,
      path: '/resultado.php',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      }
    };

    const req = https.request(options, (res) => {
      let data = Buffer.alloc(0);
      res.on('data', (chunk) => {
        data = Buffer.concat([data, chunk]);
      });
      res.on('end', () => {
        resolve(data.toString('latin1'));
      });
    });

    req.on('error', (e) => reject(e));
    req.end();
  });
}

async function test() {
  const html = await fetchFundamentus();
  const rows = html.split(/<tr[^>]*>/i);
  for (const row of rows) {
    if (row.includes('PETR4')) {
      const tdsMatches = [...row.matchAll(/<td[^>]*>(.*?)<\/td>/gis)];
      const tds = tdsMatches.map(m => m[1].replace(/\n/g, '').replace(/\r/g, '').trim());
      console.log("PETR4 TDs:");
      tds.forEach((td, i) => console.log(`${i}: ${td}`));
      break;
    }
  }
}
test();
