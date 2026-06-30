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
      // Busca apenas dados reais da API. Removemos o mock completamente.
      let apiResults;
      try {
        apiResults = await fetchBatch(tickerNames, token || '');
      } catch (apiError) {
        throw apiError;
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

    // Delay entre lotes para evitar Rate Limit (HTTP 429) na API gratuita
    if (token && i < batches.length - 1) {
      await sleep(1500);
    }
  }

  await addLog('SUCCESS', `Sincronização concluída: ${totalSucesso} ativos atualizados, ${totalErro} erros`);

  return { total: TICKERS_B3.length, sucesso: totalSucesso, erro: totalErro };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));

