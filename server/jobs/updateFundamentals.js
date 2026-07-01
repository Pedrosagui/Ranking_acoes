import https from 'https';

const BRAPI_TOKENS = ['j9AenuWTpLNEGCKi8fbEwn', 'f12Ls945F82qawyN1YmvNA'];

function parsePtBrNumber(str) {
  if (!str || str.trim() === '') return 0;
  const clean = str.replace(/\./g, '').replace(',', '.').replace('%', '').trim();
  return parseFloat(clean) || 0;
}

function clampExtreme(value) {
  // Se o valor for absurdamente alto ou baixo (ex: -31023100.0% da OBTC3), forçamos para zero para não quebrar a UI
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

// Busca P/L da Brapi em lote com fallback de token
async function fetchBrapiPLBatch(tickers) {
  if (tickers.length === 0) return {};
  
  const symbols = tickers.join(',');
  let currentTokenIdx = 0;
  let success = false;
  let data = null;

  while (currentTokenIdx < BRAPI_TOKENS.length && !success) {
    try {
      const token = BRAPI_TOKENS[currentTokenIdx];
      const url = `https://brapi.dev/api/quote/${symbols}?token=${token}&fundamental=true`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Brapi HTTP ${res.status}`);
      data = await res.json();
      if (data.error) throw new Error(data.message || 'Brapi Error');
      success = true;
    } catch (err) {
      console.warn(`[Brapi Validação] Falha com token ${currentTokenIdx}: ${err.message}. Tentando próximo...`);
      currentTokenIdx++;
    }
  }
  
  if (!success) {
    console.warn('[Brapi Validação] Todos os tokens falharam para validação.');
    return {};
  }
  
  const plMap = {};
  if (data && data.results) {
    data.results.forEach(item => {
      if (item.priceEarnings !== undefined && item.priceEarnings !== null) {
        plMap[item.symbol] = item.priceEarnings;
      }
    });
  }
  return plMap;
}

export async function updateFundamentals(prisma) {
  console.log('[Cron] Iniciando atualização de fundamentos (Fundamentus)...');
  
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
      const pl = parsePtBrNumber(tds[2]);
      const pvp = parsePtBrNumber(tds[3]);
      const psr = parsePtBrNumber(tds[4]);
      let divYield = parsePtBrNumber(tds[5]);
      const pEbit = parsePtBrNumber(tds[6]);
      const pAtivo = parsePtBrNumber(tds[7]);
      const evEbit = parsePtBrNumber(tds[8]);
      const evEbitda = parsePtBrNumber(tds[9]);
      let margemEbit = parsePtBrNumber(tds[13]);
      let margemLiquida = parsePtBrNumber(tds[14]);
      const liqCorr = parsePtBrNumber(tds[15]);
      let roic = parsePtBrNumber(tds[16]);
      let roe = parsePtBrNumber(tds[17]);
      const divBrutaPatrim = parsePtBrNumber(tds[20]);
      let crescRec5a = parsePtBrNumber(tds[21]);

      // Aplica a limitação de extremos para campos que não temos validação da Brapi e vêm sujos do Fundamentus
      divYield = clampExtreme(divYield);
      margemEbit = clampExtreme(margemEbit);
      margemLiquida = clampExtreme(margemLiquida);
      roic = clampExtreme(roic);
      roe = clampExtreme(roe);
      crescRec5a = clampExtreme(crescRec5a);
      
      parsedStocks.push({
        ticker, cotacao, pl, pvp, psr, divYield, pEbit, pAtivo, evEbit, evEbitda, 
        margemEbit, margemLiquida, liqCorr, roic, roe, divBrutaPatrim, crescRec5a, liquidez
      });
    }
    
    // Passo 2: Calcular Média e Desvio Padrão do P/L (ignorando extremos gigantescos do cálculo para não sujar a média)
    const validPLs = parsedStocks.map(s => s.pl).filter(pl => pl > -500 && pl < 500); // Filta absurdos da amostra de estatística
    const meanPL = validPLs.reduce((a, b) => a + b, 0) / (validPLs.length || 1);
    const variancePL = validPLs.reduce((a, b) => a + Math.pow(b - meanPL, 2), 0) / (validPLs.length || 1);
    const stdDevPL = Math.sqrt(variancePL);
    
    // Passo 3: Identificar Anomalias no P/L
    const anomalousTickers = [];
    parsedStocks.forEach(s => {
      // É anomalia se for > 3 desvios padrões OU for hard limit
      const zScore = stdDevPL > 0 ? Math.abs((s.pl - meanPL) / stdDevPL) : 0;
      if (zScore > 3 || Math.abs(s.pl) > 1000) {
        anomalousTickers.push(s.ticker);
      }
    });
    
    // Passo 4: Validar na Brapi
    let brapiCorrections = {};
    if (anomalousTickers.length > 0) {
      console.log(`[Cron] ${anomalousTickers.length} anomalias detectadas no P/L. Validando na Brapi...`);
      // Faz chunks de 1 para Brapi (Plano gratuito só aceita 1 por vez)
      for (let i = 0; i < anomalousTickers.length; i += 1) {
        const batch = anomalousTickers.slice(i, i + 1);
        const results = await fetchBrapiPLBatch(batch);
        brapiCorrections = { ...brapiCorrections, ...results };
      }
    }
    
    // Passo 5: Salvar no Banco
    let processedCount = 0;
    for (const s of parsedStocks) {
      
      // Aplicar correção se houver
      if (brapiCorrections[s.ticker] !== undefined) {
        console.log(`[Correção] ${s.ticker}: P/L corrigido de ${s.pl} para ${brapiCorrections[s.ticker]}`);
        s.pl = brapiCorrections[s.ticker];
      }
      
      // Calcular LPA e VPA com o P/L e P/VP limpos
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
          psr: s.psr,
          divYield: s.divYield,
          pEbit: s.pEbit,
          pAtivo: s.pAtivo,
          evEbit: s.evEbit,
          evEbitda: s.evEbitda,
          margemEbit: s.margemEbit,
          margemLiquida: s.margemLiquida,
          liqCorr: s.liqCorr,
          roic: s.roic,
          divBrutaPatrim: s.divBrutaPatrim,
          crescRec5a: s.crescRec5a,
          lpa: parseFloat(lpa.toFixed(2)),
          vpa: parseFloat(vpa.toFixed(2)),
          roe: parseFloat(s.roe.toFixed(2)),
          updatedAt: new Date()
        },
        create: {
          ticker: s.ticker,
          empresa: `${s.ticker} S.A.`,
          setor: 'Mercado',
          cotacaoAtual: s.cotacao,
          pl: s.pl,
          pvp: s.pvp,
          psr: s.psr,
          divYield: s.divYield,
          pEbit: s.pEbit,
          pAtivo: s.pAtivo,
          evEbit: s.evEbit,
          evEbitda: s.evEbitda,
          margemEbit: s.margemEbit,
          margemLiquida: s.margemLiquida,
          liqCorr: s.liqCorr,
          roic: s.roic,
          divBrutaPatrim: s.divBrutaPatrim,
          crescRec5a: s.crescRec5a,
          lpa: parseFloat(lpa.toFixed(2)),
          vpa: parseFloat(vpa.toFixed(2)),
          roe: parseFloat(s.roe.toFixed(2))
        }
      });
      processedCount++;
    }
    console.log(`[Cron] ${processedCount} ações atualizadas com fundamentos.`);
    
    // --- START FII PROCESSING ---
    console.log('[Cron] Iniciando atualização de fundamentos (Fundamentus FIIs)...');
    const htmlFii = await fetchFundamentusFIIs();
    const tbodyIdxFii = htmlFii.indexOf('<tbody>');
    const tbodyEndIdxFii = htmlFii.indexOf('</tbody>');
    
    if (tbodyIdxFii !== -1 && tbodyEndIdxFii !== -1) {
      const tbodyFii = htmlFii.substring(tbodyIdxFii, tbodyEndIdxFii);
      const rowsFii = tbodyFii.split(/<tr[^>]*>/i);
      
      const parsedFiis = [];
      for (const row of rowsFii) {
        if (!row.includes('</td>')) continue;
        const tds = row.split(/<td[^>]*>/i).map(td => td.replace(/<[^>]*>/g, '').trim()).filter(td => td !== '');
        
        if (tds.length < 10) continue;
        
        const ticker = tds[0];
        const liquidez = parsePtBrNumber(tds[7]);
        if (liquidez < 100000) continue;
        
        const cotacao = parsePtBrNumber(tds[2]);
        const divYield = parsePtBrNumber(tds[4]);
        const pvp = parsePtBrNumber(tds[5]);
        const valorPatrimonialCota = parsePtBrNumber(tds[6]);
        
        parsedFiis.push({
          ticker, cotacao, divYield, pvp, valorPatrimonialCota, liquidez
        });
      }
      
      let processedFiis = 0;
      for (const f of parsedFiis) {
        // Find if Fii exists
        const exists = await prisma.fii.findUnique({ where: { ticker: f.ticker } });
        if (exists) {
          await prisma.fii.update({
            where: { ticker: f.ticker },
            data: {
              divYield: f.divYield,
              pvp: f.pvp,
              liquidezMedia: f.liquidez,
              valorPatrimonialCota: f.valorPatrimonialCota
            }
          });
          processedFiis++;
        }
      }
      console.log(`[Cron] ${processedFiis} FIIs atualizados com fundamentos.`);
    }
    // --- END FII PROCESSING ---

    console.log('🏁 Atualização de fundamentos concluída!');
    return { success: true, count: processedCount };
    
  } catch (error) {
    console.error('[Cron] Erro ao atualizar fundamentos:', error);
    return { success: false, error: error.message };
  }
}
