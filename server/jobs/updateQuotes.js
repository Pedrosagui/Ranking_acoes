// Utiliza fetch nativo (Node 24+)

export async function updateQuotes(prisma) {
  console.log('🔄 Iniciando atualização de cotações (Yahoo Finance)...');
  
  try {
    const stocks = await prisma.stock.findMany({ select: { ticker: true } });
    const tickers = stocks.map(s => s.ticker);
    
    // Yahoo v8 chart não precisa de auth, mas só aceita 1 ticker por vez.
    const CONCURRENCY = 5;
    
    for (let i = 0; i < tickers.length; i += CONCURRENCY) {
      const batch = tickers.slice(i, i + CONCURRENCY);
      
      const promises = batch.map(async (ticker) => {
        const symbol = `${ticker}.SA`;
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1d`;
        
        try {
          const res = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0'
            }
          });
          if (!res.ok) return null;
          const data = await res.json();
          const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
          if (price) {
            await prisma.stock.update({
              where: { ticker },
              data: { cotacaoAtual: price }
            });
          }
        } catch (e) {
          // ignore error for single stock
        }
      });
      
      await Promise.all(promises);
      console.log(`✅ Cotações atualizadas: ${i + batch.length} / ${tickers.length}`);
    }
    
    console.log('🏁 Atualização de cotações concluída!');
    return { success: true, count: tickers.length };
    
  } catch (error) {
    console.error('❌ Erro na rotina de cotações:', error);
    return { success: false, error: error.message };
  }
}
