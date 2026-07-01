// Utiliza fetch nativo (Node 24+)

const BRAPI_TOKENS = ['j9AenuWTpLNEGCKi8fbEwn', 'f12Ls945F82qawyN1YmvNA'];

async function fetchBrapiBatch(tickers, token) {
  const symbols = tickers.join(',');
  const url = `https://brapi.dev/api/quote/${symbols}?token=${token}`;
  
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Brapi HTTP ${res.status}`);
  }
  
  const data = await res.json();
  if (data.error) throw new Error(data.message || 'Brapi Error');
  
  const prices = {};
  if (data.results) {
    data.results.forEach(item => {
      if (item.regularMarketPrice) {
        prices[item.symbol] = item.regularMarketPrice;
      }
    });
  }
  return prices;
}

async function fetchYahooFallback(ticker) {
  const symbol = `${ticker}.SA`;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1d`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.chart?.result?.[0]?.meta?.regularMarketPrice;
  } catch (e) {
    return null;
  }
}

export async function updateQuotes(prisma) {
  console.log('🔄 Iniciando atualização de cotações (Brapi primário, Yahoo fallback)...');
  
  try {
    const stocks = await prisma.stock.findMany({ select: { ticker: true } });
    const tickers = stocks.map(s => s.ticker);
    
    // Brapi plano gratuito aceita apenas 1 ticker por requisição
    const BATCH_SIZE = 1;
    const CONCURRENCY = 5; // Vamos processar 5 por vez em paralelo
    
    let currentTokenIdx = 0;
    let usingYahooFallback = false;
    
    for (let i = 0; i < tickers.length; i += CONCURRENCY) {
      const chunk = tickers.slice(i, i + CONCURRENCY);
      
      const promises = chunk.map(async (ticker) => {
        const batch = [ticker];
        let price = null;
        
        if (!usingYahooFallback) {
          let success = false;
          let localTokenIdx = currentTokenIdx;
          while (localTokenIdx < BRAPI_TOKENS.length && !success) {
            try {
              const token = BRAPI_TOKENS[localTokenIdx];
              const batchPrices = await fetchBrapiBatch(batch, token);
              price = batchPrices[ticker];
              success = true;
            } catch (err) {
              console.warn(`[Brapi] Falha para ${ticker} com token ${localTokenIdx}: ${err.message}.`);
              localTokenIdx++;
              if (localTokenIdx >= BRAPI_TOKENS.length) {
                 usingYahooFallback = true;
              }
            }
          }
        }
        
        if (!price && usingYahooFallback) {
           price = await fetchYahooFallback(ticker);
        }
        
        if (price) {
          await prisma.stock.update({
            where: { ticker },
            data: { cotacaoAtual: price }
          });
        }
      });
      
      await Promise.all(promises);
      console.log(`✅ Cotações atualizadas: ${Math.min(i + CONCURRENCY, tickers.length)} / ${tickers.length}`);
    }
    
    console.log('🏁 Atualização de cotações concluída!');
    return { success: true, count: tickers.length, method: usingYahooFallback ? 'Yahoo' : 'Brapi' };
    
  } catch (error) {
    console.error('❌ Erro na rotina de cotações:', error);
    return { success: false, error: error.message };
  }
}
