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
      console.warn(`[Yahoo] Falha ao buscar cotações chunk: ${err.message}`);
    }
  }
  return prices;
}

export async function updateQuotes(prisma) {
  console.log('🔄 Iniciando atualização de cotações (Yahoo Finance)...');
  
  try {
    const stocks = await prisma.stock.findMany({ select: { ticker: true } });
    
    const tickers = stocks.map(s => s.ticker);
    let data = await fetchYahooBatch(tickers);

    if (!data || Object.keys(data).length === 0) {
      console.log('[Cron] Yahoo Finance Quotes API falhou totalmente.');
      return { success: false, error: 'No data returned' };
    }
    
    let updated = 0;
    const promises = stocks.map(async (item) => {
      const priceObj = data[item.ticker];
      
      if (priceObj) {
        try {
          await prisma.stock.update({
            where: { ticker: item.ticker },
            data: {
              cotacaoAtual: priceObj.price,
              retornoDiario: priceObj.changePercent,
              updatedAt: new Date()
            }
          });
          updated++;
        } catch (err) {
          // skip
        }
      }
    });
    
    await Promise.all(promises);
    console.log(`✅ Cotações atualizadas: ${updated}/${stocks.length} via Yahoo Finance!`);
    return { success: true, count: updated };
  } catch (error) {
    console.error('❌ Erro na cron de quotes:', error);
    return { success: false, error: error.message };
  }
}
