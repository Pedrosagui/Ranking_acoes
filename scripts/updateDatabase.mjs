import https from 'https';
import fs from 'fs';
import path from 'path';

function parsePtBrNumber(str) {
  if (!str || str.trim() === '') return 0;
  // Remove dots (thousands separator), replace comma with dot
  const clean = str.replace(/\./g, '').replace(',', '.').replace('%', '').trim();
  return parseFloat(clean) || 0;
}

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

async function run() {
  console.log('Baixando dados do Fundamentus...');
  const html = await fetchFundamentus();
  
  const tbodyIdx = html.indexOf('<tbody>');
  const tbodyEndIdx = html.indexOf('</tbody>');
  if (tbodyIdx === -1 || tbodyEndIdx === -1) {
    console.error('Tabela não encontrada no HTML.');
    return;
  }
  
  const tbody = html.substring(tbodyIdx, tbodyEndIdx);
  const rows = tbody.split(/<tr[^>]*>/i);
  
  const validStocks = [];
  
  for (const row of rows) {
    if (!row.includes('<td')) continue;
    
    // Extract tds (use 's' flag so . matches newlines)
    const tdsMatches = [...row.matchAll(/<td[^>]*>(.*?)<\/td>/gis)];
    if (tdsMatches.length < 21) continue;
    
    const tds = tdsMatches.map(m => m[1].replace(/\n/g, '').replace(/\r/g, '').trim());
    
    // Extracted fields
    const tickerMatch = tds[0].match(/papel=([A-Z0-9]+)/);
    if (!tickerMatch) continue;
    const ticker = tickerMatch[1];
    
    // Ticker Validation: Must end with 3, 4, 5, 6 or 11 (Units)
    if (!/^[A-Z]{4}(3|4|5|6|11)$/.test(ticker)) continue;
    
    // Block list for BDRs that somehow match (just in case)
    if (ticker.startsWith('BDR')) continue;
    
    const cotacao = parsePtBrNumber(tds[1]);
    const pl = parsePtBrNumber(tds[2]);
    const pvp = parsePtBrNumber(tds[3]);
    const roe = parsePtBrNumber(tds[17]); // 17 is ROE
    const liquidez = parsePtBrNumber(tds[18]); // 18 is Liquidez
    
    // Filter out very illiquid stocks (< R$ 100.000/dia)
    if (liquidez < 100000) continue;
    
    // Calculate LPA and VPA
    let lpa = 0;
    if (pl !== 0 && cotacao !== 0) {
      lpa = cotacao / pl;
    }
    
    let vpa = 0;
    if (pvp !== 0 && cotacao !== 0) {
      vpa = cotacao / pvp;
    }
    
    validStocks.push({
      ticker,
      cotacao,
      pl,
      pvp,
      lpa: parseFloat(lpa.toFixed(2)),
      vpa: parseFloat(vpa.toFixed(2)),
      roe: parseFloat(roe.toFixed(2))
    });
  }
  
  console.log(`Foram processadas ${validStocks.length} ações válidas com liquidez > R$ 100.000/dia.`);
  
  // Sort alphabetically
  validStocks.sort((a, b) => a.ticker.localeCompare(b.ticker));
  
  // Generate tickers.js
  const tickersContent = `// src/data/tickers.js
// Gerado automaticamente pelo script updateDatabase.mjs (Fundamentus)
export const TICKERS_B3 = [
${validStocks.map(s => `  { ticker: '${s.ticker}', empresa: '${s.ticker} S.A.', setor: 'Mercado' },`).join('\n')}
];
`;
  fs.writeFileSync(path.resolve('./src/data/tickers.js'), tickersContent, 'utf-8');
  console.log('✅ tickers.js atualizado com sucesso.');
  
  // Generate fundamentos.js
  const fundamentosContent = `// src/data/fundamentos.js
// Gerado automaticamente pelo script updateDatabase.mjs (Fundamentus)
// Baseado em P/L e P/VP extraídos, revertidos para LPA e VPA.

export const fundamentos = {
${validStocks.map(s => `  ${s.ticker}: { lpa: ${s.lpa}, vpa: ${s.vpa}, roe: ${s.roe} },`).join('\n')}
};

export function getFundamentos(ticker) {
  if (fundamentos[ticker]) {
    return fundamentos[ticker];
  }
  // Fallback se não existir
  return { lpa: 0.5, vpa: 5.0, roe: 10.0 };
}
`;
  fs.writeFileSync(path.resolve('./src/data/fundamentos.js'), fundamentosContent, 'utf-8');
  console.log('✅ fundamentos.js atualizado com sucesso.');
}

run().catch(console.error);
