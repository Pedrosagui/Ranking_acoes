// src/services/syncService.js
// Agora busca do backend em node (Aegis Server)

import { enrichStock } from '../utils/valuation';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Busca os dados do servidor e os enriquece com cálculos locais.
 */
export async function syncAllStocks() {
  try {
    const res = await fetch(`${API_URL}/stocks`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(`[Status: ${res.status}] ${errorData.details || errorData.error || res.statusText}`);
    }
    
    const dbStocks = await res.json();
    
    // Normalizar logos e nomes (ex: AZTE3 e AZEV3 são a mesma empresa)
    const logoMap = {};
    dbStocks.forEach(s => {
      if (s.ticker.startsWith('AZTE')) s.empresa = 'AZEVEDO E TRAVASSOS S.A.';
      
      const prefix = s.ticker.substring(0, 4);
      const key = prefix === 'AZTE' ? 'AZEV' : prefix;
      if (s.logoUrl && !logoMap[key]) logoMap[key] = s.logoUrl;
    });

    dbStocks.forEach(s => {
      const prefix = s.ticker.substring(0, 4);
      const key = prefix === 'AZTE' ? 'AZEV' : prefix;
      if (!s.logoUrl && logoMap[key]) {
        s.logoUrl = logoMap[key];
      }
    });
    
    // Enriquecer (calcular margens Bazin, Graham, etc)
    const enriched = dbStocks.map(s => {
      const precoAtual = s.cotacaoAtual || 10;

      // Chama a função central do valuation que calcula Score 0-100, Bazin e Graham reais
      return enrichStock({
        ticker: s.ticker,
        empresa: s.empresa,
        setor: s.setor,
        logoUrl: s.logoUrl,
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

    return enriched;
  } catch (error) {
    console.error(`Erro ao buscar ativos do servidor: ${error.message}`);
    throw error;
  }
}
