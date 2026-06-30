// src/services/syncService.js
// Orquestrador do processo de sincronização em lotes

import { fetchBatch } from './brapiService';
import { saveStocks, addLog } from '../db/database';
import { TICKERS_B3 } from '../data/tickers';
import { getDividendosHistoricos } from '../data/dividendosHistoricos';
import { enrichStock } from '../utils/valuation';

const BATCH_SIZE = 20; // Tickers por requisição Brapi

/**
 * Divide um array em lotes de tamanho fixo
 * @param {Array} array
 * @param {number} size
 * @returns {Array<Array>}
 */
function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Sincroniza todos os ativos da B3 em lotes
 *
 * @param {string} token - Token da API Brapi (pode ser vazio)
 * @param {Function} onProgress - Callback chamado a cada lote: ({ loteAtual, totalLotes, tickersProcessados })
 * @param {Function} onBatchComplete - Callback com as ações enriquecidas do lote para atualização progressiva da UI
 * @returns {Promise<{ total: number, sucesso: number, erro: number }>}
 */
export async function syncAllStocks(token, onProgress, onBatchComplete) {
  const batches = chunk(TICKERS_B3, BATCH_SIZE);
  const totalLotes = batches.length;
  let tickersProcessados = 0;
  let totalSucesso = 0;
  let totalErro = 0;

  await addLog('INFO', `Iniciando sincronização de ${TICKERS_B3.length} ativos em ${totalLotes} lotes`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const tickerNames = batch.map(t => t.ticker);

    // Notifica progresso
    if (onProgress) {
      onProgress({
        loteAtual: i + 1,
        totalLotes,
        tickersProcessados,
        tickersNomesAtual: tickerNames.slice(0, 5).join(', ') + (tickerNames.length > 5 ? '...' : ''),
      });
    }

    try {
      // Sempre tenta a API real primeiro; mock só como último recurso
      let apiResults;
      try {
        apiResults = await fetchBatch(tickerNames, token || '');
      } catch (apiError) {
        if (!token) {
          await addLog('WARN', `API sem token falhou (${apiError.message}), usando dados mock`);
          apiResults = generateMockData(tickerNames);
        } else {
          throw apiError;
        }
      }

      // Mescla dados da API com histórico de dividendos bundled
      const enrichedStocks = apiResults
        .filter(r => r && r.cotacaoAtual)
        .map(apiData => {
          const tickerInfo = TICKERS_B3.find(t => t.ticker === apiData.ticker) || {};
          const dividendosHistoricos = getDividendosHistoricos(apiData.ticker);

          const rawStock = {
            ticker: apiData.ticker,
            empresa: tickerInfo.empresa || apiData.ticker,
            setor: tickerInfo.setor || 'Outros',
            cotacaoAtual: apiData.cotacaoAtual,
            lpa: apiData.lpa,
            vpa: apiData.vpa,
            roe: apiData.roe,
            dividendosHistoricos,
            atualizadoEm: new Date().toISOString(),
          };

          return enrichStock(rawStock);
        });

      // Persiste no IndexedDB
      if (enrichedStocks.length > 0) {
        await saveStocks(enrichedStocks);
        totalSucesso += enrichedStocks.length;

        // Notifica UI para atualização progressiva
        if (onBatchComplete) {
          onBatchComplete(enrichedStocks);
        }
      }

      tickersProcessados += tickerNames.length;
      await addLog('SUCCESS', `Lote ${i + 1}/${totalLotes} concluído: ${enrichedStocks.length} ativos`);

    } catch (error) {
      totalErro += tickerNames.length;
      await addLog('ERROR', `Erro no lote ${i + 1}: ${error.message}`);
      console.error(`Erro no lote ${i + 1}:`, error);
    }

    // Delay entre lotes para não sobrecarregar a API (apenas com token real)
    if (token && i < batches.length - 1) {
      await sleep(300);
    }
  }

  await addLog('SUCCESS', `Sincronização concluída: ${totalSucesso} ativos atualizados, ${totalErro} erros`);

  return { total: TICKERS_B3.length, sucesso: totalSucesso, erro: totalErro };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Gera dados mock realistas para demonstração sem API key
 * Baseado em ranges típicos do mercado brasileiro
 */
function generateMockData(tickers) {
  // Dados mock pré-definidos para ações conhecidas
  const mockValues = {
    ITUB4: { cotacaoAtual: 40.98, lpa: 4.85, vpa: 26.61, roe: 18.2 },
    BBDC4: { cotacaoAtual: 14.52, lpa: 1.82, vpa: 16.40, roe: 11.1 },
    BBAS3: { cotacaoAtual: 28.90, lpa: 5.20, vpa: 34.50, roe: 15.1 },
    SANB11: { cotacaoAtual: 30.15, lpa: 3.10, vpa: 20.80, roe: 14.9 },
    BPAC11: { cotacaoAtual: 22.80, lpa: 2.40, vpa: 15.60, roe: 15.4 },
    BBSE3: { cotacaoAtual: 38.50, lpa: 3.20, vpa: 12.10, roe: 26.4 },
    PETR4: { cotacaoAtual: 38.20, lpa: 6.85, vpa: 35.80, roe: 19.1 },
    PETR3: { cotacaoAtual: 40.10, lpa: 6.85, vpa: 35.80, roe: 19.1 },
    VALE3: { cotacaoAtual: 58.90, lpa: 8.20, vpa: 45.30, roe: 18.1 },
    WEGE3: { cotacaoAtual: 52.40, lpa: 1.95, vpa: 8.90, roe: 21.9 },
    ABEV3: { cotacaoAtual: 13.80, lpa: 0.82, vpa: 6.20, roe: 13.2 },
    TAEE11: { cotacaoAtual: 36.50, lpa: 4.10, vpa: 18.60, roe: 22.0 },
    VIVT3: { cotacaoAtual: 51.20, lpa: 3.50, vpa: 14.80, roe: 23.6 },
    SUZB3: { cotacaoAtual: 58.30, lpa: 5.80, vpa: 28.40, roe: 20.4 },
    KLBN11: { cotacaoAtual: 22.40, lpa: 1.60, vpa: 9.80, roe: 16.3 },
    B3SA3: { cotacaoAtual: 12.80, lpa: 0.95, vpa: 5.40, roe: 17.6 },
    CPFE3: { cotacaoAtual: 38.90, lpa: 3.20, vpa: 16.50, roe: 19.4 },
    ENGI11: { cotacaoAtual: 44.20, lpa: 3.80, vpa: 19.80, roe: 19.2 },
    EQTL3: { cotacaoAtual: 36.50, lpa: 2.90, vpa: 14.20, roe: 20.4 },
    CMIG4: { cotacaoAtual: 12.50, lpa: 1.90, vpa: 8.60, roe: 22.1 },
    SBSP3: { cotacaoAtual: 82.40, lpa: 6.50, vpa: 38.20, roe: 17.0 },
    SAPR11: { cotacaoAtual: 25.60, lpa: 2.80, vpa: 12.40, roe: 22.6 },
    CSMG3: { cotacaoAtual: 19.80, lpa: 2.20, vpa: 10.80, roe: 20.4 },
    RADL3: { cotacaoAtual: 26.40, lpa: 1.10, vpa: 5.80, roe: 19.0 },
    TOTS3: { cotacaoAtual: 31.20, lpa: 1.80, vpa: 8.40, roe: 21.4 },
    FLRY3: { cotacaoAtual: 16.80, lpa: 1.20, vpa: 6.40, roe: 18.8 },
    CCRO3: { cotacaoAtual: 15.40, lpa: 0.90, vpa: 5.20, roe: 17.3 },
    MULT3: { cotacaoAtual: 28.50, lpa: 2.40, vpa: 11.20, roe: 21.4 },
    VALE3: { cotacaoAtual: 58.90, lpa: 8.20, vpa: 45.30, roe: 18.1 },
    JBSS3: { cotacaoAtual: 32.60, lpa: 3.80, vpa: 18.40, roe: 20.7 },
    GGBR4: { cotacaoAtual: 20.40, lpa: 3.20, vpa: 14.60, roe: 21.9 },
    HGLG11: { cotacaoAtual: 165.80, lpa: 12.40, vpa: 158.20, roe: 7.8 },
    KNRI11: { cotacaoAtual: 185.40, lpa: 14.80, vpa: 178.60, roe: 8.3 },
    MXRF11: { cotacaoAtual: 10.85, lpa: 1.20, vpa: 10.40, roe: 11.5 },
    XPML11: { cotacaoAtual: 108.40, lpa: 9.60, vpa: 102.80, roe: 9.3 },
    VISC11: { cotacaoAtual: 112.60, lpa: 10.20, vpa: 106.80, roe: 9.6 },
    BCFF11: { cotacaoAtual: 88.40, lpa: 8.40, vpa: 84.20, roe: 10.0 },
    LREN3: { cotacaoAtual: 18.40, lpa: 1.60, vpa: 8.80, roe: 18.2 },
    CYRE3: { cotacaoAtual: 24.80, lpa: 3.20, vpa: 14.40, roe: 22.2 },
    PSSA3: { cotacaoAtual: 98.40, lpa: 8.20, vpa: 42.60, roe: 19.2 },
    TIMS3: { cotacaoAtual: 18.60, lpa: 1.40, vpa: 6.80, roe: 20.6 },
    AGRO3: { cotacaoAtual: 32.80, lpa: 3.60, vpa: 16.80, roe: 21.4 },
    SLCE3: { cotacaoAtual: 28.40, lpa: 3.20, vpa: 14.60, roe: 21.9 },
    ODPV3: { cotacaoAtual: 14.60, lpa: 1.20, vpa: 5.80, roe: 20.7 },
  };

  return tickers.map(ticker => {
    const mock = mockValues[ticker];
    if (mock) return { ticker, ...mock };

    // Gera dados aleatórios plausíveis para tickers não mapeados
    const cotacao = parseFloat((Math.random() * 80 + 10).toFixed(2));
    const lpa = parseFloat((Math.random() * 5 + 0.5).toFixed(2));
    const vpa = parseFloat((cotacao * (0.3 + Math.random() * 0.7)).toFixed(2));
    const roe = parseFloat((Math.random() * 20 + 5).toFixed(1));

    return { ticker, cotacaoAtual: cotacao, lpa, vpa, roe };
  });
}
