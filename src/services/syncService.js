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
      // O banco já tem lpa, vpa, roe. Mas o enrichStock original 
      // esperava que passássemos cotacao (ou logPrice)
      const mockResultBrapi = {
      const precoAtual = s.cotacaoAtual || 10;
      const lpa = s.financialData?.lpa || 0;
      const vpa = s.financialData?.vpa || 0;
      const roe = s.financialData?.roe || 0;

      // Chama a função central do valuation que calcula Score 0-100, Bazin e Graham reais
      return enrichStock({
        ticker: s.ticker,
        empresa: s.empresa,
        setor: s.setor,
        cotacaoAtual: precoAtual,
        lpa,
        vpa,
        roe,
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
