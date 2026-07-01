export async function updateHistory(prisma) {
  console.log('🔄 Iniciando atualização de histórico de 5 anos (Yahoo Finance)...');
  
  try {
    const stocks = await prisma.stock.findMany({ select: { ticker: true } });
    const fiis = await prisma.fii.findMany({ select: { ticker: true } });
    const etfs = await prisma.etf.findMany({ select: { ticker: true } });
    
    const allItems = [
      ...stocks.map(s => ({ ticker: s.ticker, model: 'stock' })),
      ...fiis.map(s => ({ ticker: s.ticker, model: 'fii' })),
      ...etfs.map(s => ({ ticker: s.ticker, model: 'etf' })),
      { ticker: '^BVSP', model: 'index' },
      { ticker: 'IFIX.SA', model: 'index' }
    ];
    
    let historicoInserido = 0;
    
    // Processar em chunks para evitar rate limit do Yahoo
    const CONCURRENCY = 3;
    for (let i = 0; i < allItems.length; i += CONCURRENCY) {
      const chunk = allItems.slice(i, i + CONCURRENCY);
      
      const promises = chunk.map(async (item) => {
        const { ticker, model } = item;
        let symbol = `${ticker}.SA`;
        if (ticker === '^BVSP') symbol = '^BVSP';
        if (ticker === 'IFIX.SA') symbol = 'XFIX11.SA'; // Proxy for IFIX
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=5y&interval=1mo`;
        
        try {
          const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
          if (!res.ok) return;
          const data = await res.json();
          const result = data.chart?.result?.[0];
          
          if (result && result.timestamp && result.indicators?.quote?.[0]?.close) {
            const timestamps = result.timestamp;
            const closes = result.indicators.quote[0].close;
            
            const historyData = [];
            for (let j = 0; j < timestamps.length; j++) {
              if (closes[j] !== null && closes[j] !== undefined) {
                const dateObj = new Date(timestamps[j] * 1000);
                // "YYYY-MM"
                const yyyymm = dateObj.toISOString().substring(0, 7);
                historyData.push({
                  ticker,
                  date: yyyymm,
                  price: closes[j]
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
              
              // Calcular retorno12m para todas as classes de ativos
              if (historyData.length >= 12 && (model === 'etf' || model === 'stock' || model === 'fii')) {
                const currentPrice = historyData[historyData.length - 1].price;
                const price12m = historyData[Math.max(0, historyData.length - 13)].price;
                if (price12m > 0) {
                  const retorno12m = ((currentPrice / price12m) - 1) * 100;
                  
                  if (model === 'etf') {
                    await prisma.etf.update({
                      where: { ticker },
                      data: { retorno12m }
                    });
                  } else if (model === 'stock') {
                    await prisma.stock.update({
                      where: { ticker },
                      data: { retorno12m }
                    });
                  } else if (model === 'fii') {
                    await prisma.fii.update({
                      where: { ticker },
                      data: { retorno12m }
                    });
                  }
                }
              }
            }
          }
        } catch (err) {
          console.warn(`[Yahoo History] Falha para ${ticker}: ${err.message}`);
        }
      });
      
      await Promise.all(promises);
      console.log(`✅ Histórico atualizado: ${Math.min(i + CONCURRENCY, allItems.length)} / ${allItems.length}`);
    }
    
    console.log(`🏁 Atualização de histórico concluída! Itens atualizados: ${historicoInserido}`);
    return { success: true, count: historicoInserido };
    
  } catch (error) {
    console.error('❌ Erro na rotina de histórico:', error);
    return { success: false, error: error.message };
  }
}
