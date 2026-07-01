// src/services/syncService.js
// Agora busca do backend em node (Aegis Server)

import { saveStocks, addLog } from '../db/database';
import { enrichStock } from '../utils/valuation';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Sincroniza todos os ativos chamando nosso backend
 */
export async function syncAllStocks(token, onProgress, onBatchComplete) {
  try {
    onProgress({
      loteAtual: 1,
      totalLotes: 1,
      tickersProcessados: 0,
      tickersNomesAtual: "Buscando servidor..."
    });

    const res = await fetch(`${API_URL}/stocks`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(`[Status: ${res.status}] ${errorData.details || errorData.error || res.statusText}`);
    }
    
    const dbStocks = await res.json();
    
    onProgress({
      loteAtual: 1,
      totalLotes: 1,
      tickersProcessados: Math.floor(dbStocks.length / 2),
      tickersNomesAtual: "Calculando Indicadores..."
    });

    // Enriquecer (calcular margens Bazin, Graham, etc)
    const enriched = dbStocks.map(s => {
      const precoAtual = s.cotacaoAtual || 10;

      // Chama a função central do valuation que calcula Score 0-100, Bazin e Graham reais
      return enrichStock({
        ticker: s.ticker,
        empresa: s.empresa,
        setor: s.setor,
        cotacaoAtual: precoAtual,
        lpa: s.lpa || 0,
        vpa: s.vpa || 0,
        roe: s.roe || 0,
        dividendosHistoricos: s.dividendHistory,
        pl: s.pl || 0,
        crescRec5a: s.crescRec5a || 0,
        liqCorr: s.liqCorr || 0,
        margemLiquida: s.margemLiquida || 0,
        divBrutaPatrim: s.divBrutaPatrim || 0,
        margemEbit: s.margemEbit || 0,
        divYield: s.divYield || 0,
        pvp: s.pvp || null,
        roic: s.roic || null,
        evEbit: s.evEbit || null,
        evEbitda: s.evEbitda || null
      });
    });

    onBatchComplete(enriched);
    await saveStocks(enriched);
    await addLog(`Sincronização via Backend concluída (${enriched.length} ativos)`);

    onProgress({
      loteAtual: 1,
      totalLotes: 1,
      tickersProcessados: dbStocks.length,
      tickersNomesAtual: "Concluído!"
    });

  } catch (error) {
    await addLog(`Erro crasso na sincronização: ${error.message}`);
    throw error;
  }
}
