import yahooFinancePkg from 'yahoo-finance2';
const YF = yahooFinancePkg.default || yahooFinancePkg;
const yahooFinance = new YF({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });

export async function updateHistory(prisma) {
  console.log('📈 Iniciando atualização de histórico de 5 anos (Yahoo Finance)...');
  
  try {
    const stocks = await prisma.stock.findMany({ select: { ticker: true } });
    
    const allItems = [
      ...stocks.map(s => ({ ticker: s.ticker, model: 'stock' })),
      { ticker: '^BVSP', model: 'index' }
    ];
    
    let historicoInserido = 0;
    
    const CONCURRENCY = 3;
    for (let i = 0; i < allItems.length; i += CONCURRENCY) {
      const chunk = allItems.slice(i, i + CONCURRENCY);
      
      const promises = chunk.map(async (item) => {
        const { ticker, model } = item;
        let symbol = `${ticker}.SA`;
        if (ticker === '^BVSP') symbol = '^BVSP';
        
        try {
          const now = new Date();
          const fiveYearsAgo = new Date();
          fiveYearsAgo.setFullYear(now.getFullYear() - 5);
          
          const chartData = await yahooFinance.chart(symbol, {
            period1: fiveYearsAgo,
            period2: now,
            interval: '1mo'
          });
          
          if (chartData && chartData.quotes && chartData.quotes.length > 0) {
            const historyData = [];
            
            for (const quote of chartData.quotes) {
              if (quote.close !== null && quote.close !== undefined && quote.date) {
                const dateObj = new Date(quote.date);
                const yyyymm = dateObj.toISOString().substring(0, 7);
                historyData.push({
                  ticker,
                  date: yyyymm,
                  price: quote.close
                });
              }
            }
            
            if (historyData.length > 0) {
              await prisma.history.deleteMany({ where: { ticker } });
              await prisma.history.createMany({
                data: historyData,
                skipDuplicates: true
              });
              historicoInserido++;
              
              // Calcular retorno12m
              if (historyData.length >= 12 && model === 'stock') {
                const currentPrice = historyData[historyData.length - 1].price;
                const price12m = historyData[Math.max(0, historyData.length - 13)].price;
                if (price12m > 0) {
                  const retorno12m = ((currentPrice / price12m) - 1) * 100;
                  await prisma.stock.update({ where: { ticker }, data: { retorno12m } });
                }
              }
            }
          }
        } catch (err) {
          console.warn(`[Yahoo History] Falha para ${ticker}: ${err.message}`);
        }
      });
      
      await Promise.all(promises);
      console.log(`⏳ Histórico atualizado: ${Math.min(i + CONCURRENCY, allItems.length)} / ${allItems.length}`);
    }
    
    console.log(`✅ Atualização de histórico concluída! Itens atualizados: ${historicoInserido}`);
    return { success: true, count: historicoInserido };
    
  } catch (error) {
    console.error('❌ Erro na rotina de histórico:', error);
    return { success: false, error: error.message };
  }
}
