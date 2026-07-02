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



// Busca P/L do Yahoo Finance para corrigir anomalias
async function fetchYahooPLBatch(tickers) {
  if (tickers.length === 0) return {};
  
  const plMap = {};
  
  for (const ticker of tickers) {
    try {
      const symbol = `${ticker}.SA`;
      const results = await yahooFinance.quote(symbol);
      if (results && results.trailingPE) {
        plMap[ticker] = results.trailingPE;
      }
    } catch (err) {
      // silently skip
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
      
      // tds[18] = Liq.2meses no Fundamentus
      const liq2Meses = parsePtBrNumber(tds[18]);
      if (liq2Meses < 100000) continue;
      
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
        liq2Meses: liq2Meses,
        divBrutaPatrim: parsePtBrNumber(tds[17]),
        crescRec5a: clampExtreme(parsePtBrNumber(tds[20])),
        evEbit: parsePtBrNumber(tds[7])
      });
    }

    // Detect P/L anomalies and correct with Yahoo
    const anomalousTickers = [];
    for (const s of parsedStocks) {
      if (s.pl === 0 && s.cotacao > 0 && s.pvp > 0) {
        anomalousTickers.push(s.ticker);
      }
    }
    
    let yahooCorrections = {};
    if (anomalousTickers.length > 0) {
      console.log(`[Cron] ${anomalousTickers.length} anomalias P/L detectadas. Validando no Yahoo...`);
      yahooCorrections = await fetchYahooPLBatch(anomalousTickers);
    }
    
    // Save to DB
    let processedCount = 0;
    for (const s of parsedStocks) {
      if (yahooCorrections[s.ticker] !== undefined) {
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
          cotacaoAtual: s.cotacao,
          pl: s.pl,
          pvp: s.pvp,
          divYield: s.divYield,
          margemEbit: s.margemEbit,
          margemLiquida: s.margemLiquida,
          roic: s.roic,
          roe: s.roe,
          liq2Meses: s.liq2Meses,
          divBrutaPatrim: s.divBrutaPatrim,
          crescRec5a: s.crescRec5a,
          evEbit: s.evEbit,
          lpa: lpa,
          vpa: vpa,
          updatedAt: new Date(),
        },
        create: {
          ticker: s.ticker,
          empresa: s.ticker,
          setor: 'Desconhecido',
          cotacaoAtual: s.cotacao,
          pl: s.pl,
          pvp: s.pvp,
          divYield: s.divYield,
          margemEbit: s.margemEbit,
          margemLiquida: s.margemLiquida,
          roic: s.roic,
          roe: s.roe,
          liq2Meses: s.liq2Meses,
          divBrutaPatrim: s.divBrutaPatrim,
          crescRec5a: s.crescRec5a,
          evEbit: s.evEbit,
          lpa: lpa,
          vpa: vpa,
        }
      });
      processedCount++;
    }

    console.log(`✅ Concluído! Ações: ${processedCount}.`);
    return { success: true, stocks: processedCount };
  } catch (err) {
    console.error('❌ Erro na cron de fundamentos:', err);
    return { success: false, error: err.message };
  }
}
