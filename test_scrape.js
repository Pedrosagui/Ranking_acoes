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
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

async function test() {
  try {
    const html = await fetchFundamentus();
    console.log("HTML fetched. Length:", html.length);
    
    // Extract table rows using basic regex
    // Table rows look like <tr><td><span class="tips"><a href="detalhes.php?papel=ABCB4">ABCB4</a></span></td>...
    const rowRegex = /<tr>\s*<td><span class="tips"><a href="detalhes\.php\?papel=([A-Z0-9]+)">.*?<\/a><\/span><\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>/g;
    
    let match;
    let count = 0;
    while ((match = rowRegex.exec(html)) !== null && count < 3) {
      console.log(`Ticker: ${match[1]}`);
      console.log(`Cotacao: ${match[2]}`);
      console.log(`P/L: ${match[3]}`);
      console.log(`P/VP: ${match[4]}`);
      console.log(`Div.Yield: ${match[5]}`);
      console.log(`ROE: ${match[10]}`);
      console.log('---');
      count++;
    }
  } catch(e) {
    console.error(e);
  }
}

test();
