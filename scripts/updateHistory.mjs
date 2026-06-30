import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Carregar tickers ignorando o module loader do Node que pode dar problema com sintaxe JSX ou dependências web
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tickersPath = path.join(__dirname, '../src/data/tickers.js');
let tickersContent = fs.readFileSync(tickersPath, 'utf-8');

// Regex para extrair apenas a string do ticker
const tickersMatches = [...tickersContent.matchAll(/ticker:\s*['"]([A-Z0-9]+)['"]/g)];
const tickers = tickersMatches.map(m => m[1]);

console.log(`Encontrados ${tickers.length} tickers.`);

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function run() {
  const historico = {};
  
  for (let i = 0; i < tickers.length; i++) {
    const ticker = tickers[i];
    console.log(`[${i+1}/${tickers.length}] Buscando histórico de 5 anos para ${ticker}...`);
    
    // Sufixo .SA é necessário no Yahoo Finance para ações brasileiras
    const symbol = `${ticker}.SA`;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=5y&interval=1mo`;
    
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`Falha em ${ticker}: HTTP ${res.status}`);
        continue;
      }
      
      const data = await res.json();
      const result = data.chart?.result?.[0];
      
      if (result && result.timestamp && result.indicators?.quote?.[0]?.close) {
        const timestamps = result.timestamp;
        const closes = result.indicators.quote[0].close;
        
        const series = [];
        for (let j = 0; j < timestamps.length; j++) {
          if (closes[j] !== null) {
            series.push({
              date: new Date(timestamps[j] * 1000).toISOString(),
              price: parseFloat(closes[j].toFixed(2))
            });
          }
        }
        
        historico[ticker] = series;
      }
    } catch (e) {
      console.error(`Erro ao buscar ${ticker}: ${e.message}`);
    }
    
    // Pequeno delay para não sobrecarregar o Yahoo Finance (rate limit)
    await delay(300);
  }
  
  const destPath = path.join(__dirname, '../src/data/historico5anos.js');
  const code = `// Gerado automaticamente por scripts/updateHistory.mjs
// Atualizado em: ${new Date().toISOString()}
// Histórico de 5 anos (mensal) do Yahoo Finance

export const historico5anos = ${JSON.stringify(historico, null, 2)};

export function getHistorico(ticker) {
  return historico5anos[ticker] || [];
}
`;
  
  fs.writeFileSync(destPath, code);
  console.log(`✅ Histórico salvo com sucesso em ${destPath}`);
}

run();
