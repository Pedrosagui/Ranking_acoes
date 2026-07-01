import https from 'https';

function parsePtBrNumber(str) {
  if (!str || str.trim() === '') return 0;
  const clean = str.replace(/\./g, '').replace(',', '.').replace('%', '').trim();
  return parseFloat(clean) || 0;
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
    
    let processedCount = 0;
    
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
      
      const cotacao = parsePtBrNumber(tds[1]);
      const pl = parsePtBrNumber(tds[2]);
      const pvp = parsePtBrNumber(tds[3]);
      const psr = parsePtBrNumber(tds[4]);
      const divYield = parsePtBrNumber(tds[5]);
      const pEbit = parsePtBrNumber(tds[6]);
      const pAtivo = parsePtBrNumber(tds[7]);
      const evEbit = parsePtBrNumber(tds[8]);
      const evEbitda = parsePtBrNumber(tds[9]);
      const margemEbit = parsePtBrNumber(tds[13]);
      const margemLiquida = parsePtBrNumber(tds[14]);
      const liqCorr = parsePtBrNumber(tds[15]);
      const roic = parsePtBrNumber(tds[16]);
      const roe = parsePtBrNumber(tds[17]);
      const liquidez = parsePtBrNumber(tds[18]);
      const divBrutaPatrim = parsePtBrNumber(tds[20]);
      const crescRec5a = parsePtBrNumber(tds[21]);
      
      if (liquidez < 100000) continue;
      
      let lpa = 0;
      if (pl !== 0 && cotacao !== 0) {
        lpa = cotacao / pl;
      }
      
      let vpa = 0;
      if (pvp !== 0 && cotacao !== 0) {
        vpa = cotacao / pvp;
      }
      
      await prisma.stock.upsert({
        where: { ticker },
        update: {
          cotacaoAtual: cotacao,
          pl,
          pvp,
          psr,
          divYield,
          pEbit,
          pAtivo,
          evEbit,
          evEbitda,
          margemEbit,
          margemLiquida,
          liqCorr,
          roic,
          divBrutaPatrim,
          crescRec5a,
          lpa: parseFloat(lpa.toFixed(2)),
          vpa: parseFloat(vpa.toFixed(2)),
          roe: parseFloat(roe.toFixed(2)),
          updatedAt: new Date()
        },
        create: {
          ticker,
          empresa: `${ticker} S.A.`,
          setor: 'Mercado',
          cotacaoAtual: cotacao,
          pl,
          pvp,
          psr,
          divYield,
          pEbit,
          pAtivo,
          evEbit,
          evEbitda,
          margemEbit,
          margemLiquida,
          liqCorr,
          roic,
          divBrutaPatrim,
          crescRec5a,
          lpa: parseFloat(lpa.toFixed(2)),
          vpa: parseFloat(vpa.toFixed(2)),
          roe: parseFloat(roe.toFixed(2))
        }
      });
      processedCount++;
    }
    
    console.log(`[Cron] Fundamentos atualizados com sucesso: ${processedCount} ações.`);
    return { success: true, processedCount };
  } catch (error) {
    console.error('[Cron] Erro ao atualizar fundamentos:', error);
    return { success: false, error: error.message };
  }
}
