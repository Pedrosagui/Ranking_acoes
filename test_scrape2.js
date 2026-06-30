import https from 'https';

function fetchFundamentus() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.fundamentus.com.br',
      port: 443,
      path: '/resultado.php',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    };

    const req = https.request(options, (res) => {
      let data = Buffer.alloc(0);
      res.on('data', (chunk) => {
        data = Buffer.concat([data, chunk]);
      });
      res.on('end', () => {
        // Assume iso-8859-1 and convert to string
        resolve(data.toString('latin1'));
      });
    });

    req.on('error', (e) => reject(e));
    req.end();
  });
}

async function test() {
  try {
    const html = await fetchFundamentus();
    // find where the table starts
    const tbodyIdx = html.indexOf('<tbody>');
    if (tbodyIdx !== -1) {
      console.log(html.substring(tbodyIdx, tbodyIdx + 1000));
    }
  } catch(e) {
    console.error(e);
  }
}
test();
