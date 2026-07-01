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
        symbol: s.ticker,
        shortName: s.empresa,
        regularMarketPrice: s.cotacaoAtual || 10,
      };
      // enrichStock em valuation.js busca os fundamentos do arquivo local
      // mas como agora vem do banco, precisamos ter certeza que ele usa os dados do backend
      // Vou adaptar o enrichStock direto aqui, pois os dados já estão no banco!
      
      const lpa = s.lpa || 0;
      const vpa = s.vpa || 0;
      const roe = s.roe || 0;
      const precoAtual = s.cotacaoAtual || 10;
      
      // Graham
      let precoJustoGraham = 0;
      let margemGraham = -100;
      if (lpa > 0 && vpa > 0) {
        precoJustoGraham = Math.sqrt(22.5 * lpa * vpa);
        margemGraham = ((precoJustoGraham - precoAtual) / precoAtual) * 100;
      }

      // Bazin
      let precoTetoBazin = 0;
      let margemBazin = -100;
      const dividendoProjetado = lpa * 0.5; // Aproximação (50% payout) caso não tenha div histórico
      if (dividendoProjetado > 0) {
        precoTetoBazin = dividendoProjetado / 0.06;
        margemBazin = ((precoTetoBazin - precoAtual) / precoAtual) * 100;
      }
      
      // Score simples
      let score = 0;
      if (roe > 10) score += 3;
      if (margemGraham > 20) score += 3;
      if (margemBazin > 10) score += 4;
      
      return {
        ticker: s.ticker,
        empresa: s.empresa,
        setor: s.setor,
        cotacaoAtual: precoAtual,
        lpa,
        vpa,
        roe,
        precoJustoGraham: parseFloat(precoJustoGraham.toFixed(2)),
        margemGraham: parseFloat(margemGraham.toFixed(2)),
        precoTetoBazin: parseFloat(precoTetoBazin.toFixed(2)),
        margemBazin: parseFloat(margemBazin.toFixed(2)),
        score,
        consistente: score >= 7
      };
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
