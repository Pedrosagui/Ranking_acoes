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
        prices[item.symbol] = {
          price: item.regularMarketPrice,
          changePercent: item.regularMarketChangePercent || 0
        };
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
    const meta = data.chart?.result?.[0]?.meta;
    if (meta && meta.regularMarketPrice) {
      const prevClose = meta.chartPreviousClose || meta.regularMarketPrice;
      const change = meta.regularMarketPrice - prevClose;
      const changePercent = prevClose ? (change / prevClose) * 100 : 0;
      return { price: meta.regularMarketPrice, changePercent };
    }
    return null;
  } catch (e) {
    return null;
  }
}

export async function updateQuotes(prisma) {
  console.log('🔄 Iniciando atualização de cotações (Brapi primário, Yahoo fallback)...');
  
  try {
    const stocks = await prisma.stock.findMany({ select: { ticker: true } });
    const fiis = await prisma.fii.findMany({ select: { ticker: true } });
    const etfs = await prisma.etf.findMany({ select: { ticker: true } });
    
    const allItems = [
      ...stocks.map(s => ({ ticker: s.ticker, model: 'stock' })),
      ...fiis.map(s => ({ ticker: s.ticker, model: 'fii' })),
      ...etfs.map(s => ({ ticker: s.ticker, model: 'etf' }))
    ];
    
    // Brapi plano gratuito aceita apenas 1 ticker por requisição
    const BATCH_SIZE = 1;
    const CONCURRENCY = 5; // Vamos processar 5 por vez em paralelo
    
    let currentTokenIdx = 0;
    let usingYahooFallback = false;
    
    for (let i = 0; i < allItems.length; i += CONCURRENCY) {
      const chunk = allItems.slice(i, i + CONCURRENCY);
      
      const promises = chunk.map(async (item) => {
        const { ticker, model } = item;
        const batch = [ticker];
        let priceObj = null;
        
        if (!usingYahooFallback) {
          let success = false;
          let localTokenIdx = currentTokenIdx;
          while (localTokenIdx < BRAPI_TOKENS.length && !success) {
            try {
              const token = BRAPI_TOKENS[localTokenIdx];
              const batchPrices = await fetchBrapiBatch(batch, token);
              priceObj = batchPrices[ticker];
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
        
        if (!priceObj && usingYahooFallback) {
           priceObj = await fetchYahooFallback(ticker);
        }
        
        if (priceObj) {
          await prisma[model].update({
            where: { ticker },
            data: { 
              cotacaoAtual: priceObj.price,
              retornoDiario: priceObj.changePercent
            }
          });
        }
      });
      
      await Promise.all(promises);
      console.log(`✅ Cotações atualizadas: ${Math.min(i + CONCURRENCY, allItems.length)} / ${allItems.length}`);
    }
    
    console.log('🏁 Atualização de cotações concluída!');
    return { success: true, count: allItems.length, method: usingYahooFallback ? 'Yahoo' : 'Brapi' };
    
  } catch (error) {
    console.error('❌ Erro na rotina de cotações:', error);
    return { success: false, error: error.message };
  }
}
