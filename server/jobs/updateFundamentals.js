import https from 'https';
import yahooFinancePkg from 'yahoo-finance2';

const YF = yahooFinancePkg.default || yahooFinancePkg;
const yahooFinance = new YF({ suppressNotices: ['yahooSurvey'] });

function parsePtBrNumber(str) {
  if (!str || str.trim() === '') return 0;
  const clean = str.replace(/\./g, '').replace(',', '.').replace('%', '').trim();
  return parseFloat(clean) || 0;
}

function clampExtreme(value) {
  if (value > 10000 || value < -10000) return 0;
  return value;
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

function fetchFundamentusFIIs() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.fundamentus.com.br',
      port: 443,
      path: '/fii_resultado.php',
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

// Busca P/L do Yahoo Finance em lote
async function fetchYahooPLBatch(tickers) {
  if (tickers.length === 0) return {};
  
  const plMap = {};
  
  for (const ticker of tickers) {
    try {
      const symbol = `${ticker}.SA`;
      const quote = await yahooFinance.quoteSummary(symbol, { modules: ['defaultKeyStatistics', 'summaryDetail'] });
      
      const pe = quote.summaryDetail?.trailingPE || quote.defaultKeyStatistics?.trailingPE;
      if (pe !== undefined && pe !== null) {
        plMap[ticker] = pe;
      }
    } catch (err) {
      console.warn(`[Yahoo Validação] Falha para ${ticker}: ${err.message}`);
    }
  }
  
  return plMap;
}

export async function updateFundamentals(prisma) {
  console.log('[Cron] Iniciando atualização de fundamentos (Fundamentus/Yahoo)...');
  
  try {
    const html = await fetchFundamentus();
    const tbodyIdx = html.indexOf('<tbody>');
    const tbodyEndIdx = html.indexOf('</tbody>');
    
    if (tbodyIdx === -1 || tbodyEndIdx === -1) {
      console.error('[Cron] Tabela não encontrada no HTML do Fundamentus.');
      return { success: false, error: 'Table not found' };
    }
    
    const tbody = html.substring(tbodyIdx, tbodyEndIdx);
    const rows = tbody.split(/<tr[^>]*>/i);
    
    const parsedStocks = [];
    
    // Passo 1: Extrair e organizar
    for (const row of rows) {
      if (!row.includes('<td')) continue;
      
      const tdsMatches = [...row.matchAll(/<td[^>]*>(.*?)<\/td>/gis)];
      if (tdsMatches.length < 21) continue;
      
      const tds = tdsMatches.map(m => m[1].replace(/\n/g, '').replace(/\r/g, '').trim());
      
      const tickerMatch = tds[0].match(/papel=([A-Z0-9]+)/);
      if (!tickerMatch) continue;
      
      const ticker = tickerMatch[1];
      if (!/^[A-Z]{4}(3|4|5|6|11)$/.test(ticker)) continue;
      if (ticker.startsWith('BDR')) continue;
      
      const liquidez = parsePtBrNumber(tds[18]);
      if (liquidez < 100000) continue;
      
      const cotacao = parsePtBrNumber(tds[1]);
      
      parsedStocks.push({
        ticker,
        cotacao,
        pl: parsePtBrNumber(tds[2]),
        pvp: parsePtBrNumber(tds[3]),
        divYield: parsePtBrNumber(tds[5]),
        margemEbit: parsePtBrNumber(tds[10]),
        margemLiquida: parsePtBrNumber(tds[11]),
        roic: parsePtBrNumber(tds[15]),
        roe: parsePtBrNumber(tds[16]),
        liquidezMedia: liquidez,
        dividaBrutaPatrim: parsePtBrNumber(tds[17]),
        crescReceita5a: clampExtreme(parsePtBrNumber(tds[20])),
        evEbit: parsePtBrNumber(tds[7])
      });
    }

    // Passo 3: Avaliar anomalias no P/L
    const anomalousTickers = [];
    for (const s of parsedStocks) {
      if (s.pl === 0 && s.cotacao > 0 && s.pvp > 0) {
        anomalousTickers.push(s.ticker);
      }
    }
    
    let yahooCorrections = {};
    if (anomalousTickers.length > 0) {
      console.log(`[Cron] ${anomalousTickers.length} anomalias detectadas no P/L. Validando no Yahoo...`);
      yahooCorrections = await fetchYahooPLBatch(anomalousTickers);
    }
    
    // Passo 5: Salvar no Banco
    let processedCount = 0;
    for (const s of parsedStocks) {
      if (yahooCorrections[s.ticker] !== undefined) {
        console.log(`[Correção] ${s.ticker}: P/L corrigido de ${s.pl} para ${yahooCorrections[s.ticker]}`);
        s.pl = yahooCorrections[s.ticker];
      }
      
      let lpa = 0;
      if (s.pl !== 0 && s.cotacao !== 0) {
        lpa = s.cotacao / s.pl;
      }
      
      let vpa = 0;
      if (s.pvp !== 0 && s.cotacao !== 0) {
        vpa = s.cotacao / s.pvp;
      }
      
      await prisma.stock.upsert({
        where: { ticker: s.ticker },
        update: {
          price: s.cotacao,
          pl: s.pl,
          pvp: s.pvp,
          divYield: s.divYield,
          margemEbit: s.margemEbit,
          margemLiquida: s.margemLiquida,
          roic: s.roic,
          roe: s.roe,
          liquidezMedia: s.liquidezMedia,
          dividaBrutaPatrim: s.dividaBrutaPatrim,
          crescReceita5a: s.crescReceita5a,
          evEbit: s.evEbit,
          lpa: lpa,
          vpa: vpa,
          updatedAt: new Date(),
        },
        create: {
          ticker: s.ticker,
          empresa: s.ticker,
          setor: 'Desconhecido',
          price: s.cotacao,
          pl: s.pl,
          pvp: s.pvp,
          divYield: s.divYield,
          margemEbit: s.margemEbit,
          margemLiquida: s.margemLiquida,
          roic: s.roic,
          roe: s.roe,
          liquidezMedia: s.liquidezMedia,
          dividaBrutaPatrim: s.dividaBrutaPatrim,
          crescReceita5a: s.crescReceita5a,
          evEbit: s.evEbit,
          lpa: lpa,
          vpa: vpa,
        }
      });
      processedCount++;
    }

    // Parte de FIIs
    console.log('[Cron] Iniciando atualização de FIIs (Fundamentus)...');
    const htmlFii = await fetchFundamentusFIIs();
    const tbodyFiiIdx = htmlFii.indexOf('<tbody>');
    const tbodyFiiEndIdx = htmlFii.indexOf('</tbody>');
    
    if (tbodyFiiIdx !== -1 && tbodyFiiEndIdx !== -1) {
      const tbodyFii = htmlFii.substring(tbodyFiiIdx, tbodyFiiEndIdx);
      const rowsFii = tbodyFii.split(/<tr[^>]*>/i);
      
      for (const row of rowsFii) {
        if (!row.includes('<td')) continue;
        const tdsMatches = [...row.matchAll(/<td[^>]*>(.*?)<\/td>/gis)];
        if (tdsMatches.length < 14) continue;
        const tds = tdsMatches.map(m => m[1].replace(/\n/g, '').replace(/\r/g, '').trim());
        
        const tickerMatch = tds[0].match(/papel=([A-Z0-9]+)/);
        if (!tickerMatch) continue;
        const ticker = tickerMatch[1];
        
        const liquidez = parsePtBrNumber(tds[4]);
        if (liquidez < 100000) continue;

        await prisma.fii.upsert({
          where: { ticker },
          update: {
            price: parsePtBrNumber(tds[2]),
            segmento: tds[1].replace(/<[^>]+>/g, '').trim(),
            divYield: parsePtBrNumber(tds[5]),
            pvp: parsePtBrNumber(tds[6]),
            liquidezMedia: liquidez,
            vacanciaFisica: parsePtBrNumber(tds[12]),
            quantidadeImoveis: parsePtBrNumber(tds[14]) || 0,
            updatedAt: new Date()
          },
          create: {
            ticker,
            nome: ticker,
            segmento: tds[1].replace(/<[^>]+>/g, '').trim(),
            price: parsePtBrNumber(tds[2]),
            divYield: parsePtBrNumber(tds[5]),
            pvp: parsePtBrNumber(tds[6]),
            liquidezMedia: liquidez,
            vacanciaFisica: parsePtBrNumber(tds[12]),
            quantidadeImoveis: parsePtBrNumber(tds[14]) || 0,
          }
        });
      }
    }
    
    console.log(`✅ Concluído! Ações: ${processedCount}. FIIs concluídos.`);
    return { success: true, count: processedCount };
  } catch (err) {
    console.error('❌ Erro na cron de fundamentos:', err);
    return { success: false, error: err.message };
  }
}
