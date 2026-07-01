import yahooFinancePkg from 'yahoo-finance2';
const YF = yahooFinancePkg.default || yahooFinancePkg;
const yahooFinance = new YF({ suppressNotices: ['yahooSurvey'] });

async function fetchYahooBatch(tickers) {
  if (!tickers || tickers.length === 0) return {};
  
  const prices = {};
  const CHUNK_SIZE = 20;
  
  for (let i = 0; i < tickers.length; i += CHUNK_SIZE) {
    const chunk = tickers.slice(i, i + CHUNK_SIZE);
    const symbols = chunk.map(t => `${t}.SA`);
    
    try {
      const results = await yahooFinance.quote(symbols);
      for (const item of results) {
        if (item && item.symbol) {
          const rawTicker = item.symbol.replace('.SA', '');
          prices[rawTicker] = {
            price: item.regularMarketPrice || 0,
            changePercent: item.regularMarketChangePercent || 0
          };
        }
      }
    } catch (err) {
      console.warn(`[Yahoo Validação] Falha ao buscar cotações: ${err.message}`);
    }
  }
  return prices;
}

export async function updateQuotes(prisma) {
  console.log('🔄 Iniciando atualização de cotações (Yahoo Finance)...');
  
  try {
    const stocks = await prisma.stock.findMany({ select: { ticker: true } });
    const fiis = await prisma.fii.findMany({ select: { ticker: true } });
    const etfs = await prisma.etf.findMany({ select: { ticker: true } });
    
    const allItems = [
      ...stocks.map(s => ({ ticker: s.ticker, model: 'stock' })),
      ...fiis.map(s => ({ ticker: s.ticker, model: 'fii' })),
      ...etfs.map(s => ({ ticker: s.ticker, model: 'etf' }))
    ];
    
    const tickers = allItems.map(i => i.ticker);
    let data = await fetchYahooBatch(tickers);

    if (!data || Object.keys(data).length === 0) {
      console.log('[Cron] Yahoo Finance Quotes API falhou totalmente.');
      return;
    }
    
    const promises = allItems.map(async (item) => {
      const { ticker, model } = item;
      const priceObj = data[ticker];
      
      if (priceObj) {
        await prisma[model].update({
          where: { ticker },
          data: {
            price: priceObj.price,
            changePercent: priceObj.changePercent,
            updatedAt: new Date()
          }
        });
      }
    });
    
    await Promise.all(promises);
    console.log('✅ Cotações atualizadas com sucesso via Yahoo Finance!');
    return { success: true, count: allItems.length };
  } catch (error) {
    console.error('❌ Erro na cron de quotes:', error);
    return { success: false, error: error.message };
  }
}
