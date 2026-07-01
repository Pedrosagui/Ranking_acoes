// src/utils/valuation.js
// Motor de cálculo de valuation — fórmulas de Graham, Bazin e Score Composto

export const PERFIS_SCORE = {
  equilibrado: {
    label: '⚖️ Equilibrado',
    pesos: { valuation: 0.30, qualidade: 0.25, proventos: 0.25, saude: 0.15, crescimento: 0.05 }
  },
  dividendista: {
    label: '💰 Dividendista',
    pesos: { valuation: 0.20, qualidade: 0.20, proventos: 0.45, saude: 0.10, crescimento: 0.05 }
  },
  crescimento: {
    label: '🚀 Crescimento (Growth)',
    pesos: { valuation: 0.35, qualidade: 0.35, proventos: 0.05, saude: 0.20, crescimento: 0.05 }
  },
  greenblatt: {
    label: '🧙 Magic Formula',
    pesos: { valuation: 0.25, qualidade: 0.50, proventos: 0.05, saude: 0.15, crescimento: 0.05 }
  },
  conservador: {
    label: '🛡️ Conservador',
    pesos: { valuation: 0.20, qualidade: 0.15, proventos: 0.30, saude: 0.35, crescimento: 0.00 }
  },
  piotroski: {
    label: '📈 Graham + Piotroski',
    isPiotroski: true,
    pesos: { valuation: 0, qualidade: 0, proventos: 0, saude: 0, crescimento: 0 }
  },
};

/**
 * Calcula a média de dividendos dos últimos 10 anos
 */
export function calcMediaDividendos(dividendosHistoricos, lpa = 0) {
  if (!dividendosHistoricos || dividendosHistoricos.length === 0) {
    return lpa > 0 ? lpa * 0.5 : 0;
  }
  const soma = dividendosHistoricos.reduce((acc, d) => acc + (d.totalPago || 0), 0);
  return soma / 10;
}

export function calcBazin(mediaDividendos) {
  if (!mediaDividendos || mediaDividendos <= 0) return 0;
  return mediaDividendos / 0.06;
}

export function calcGraham(lpa, vpa) {
  if (!lpa || !vpa || lpa <= 0 || vpa <= 0) return 0;
  const resultado = Math.sqrt(22.5 * lpa * vpa);
  return isNaN(resultado) ? 0 : resultado;
}

export function calcMargemBazin(precoTetoBazin, cotacaoAtual) {
  if (!precoTetoBazin || precoTetoBazin <= 0 || !cotacaoAtual || cotacaoAtual <= 0) return -999;
  return ((precoTetoBazin - cotacaoAtual) / cotacaoAtual) * 100;
}

export function calcMargemGraham(precoJustoGraham, cotacaoAtual) {
  if (!precoJustoGraham || precoJustoGraham <= 0 || !cotacaoAtual || cotacaoAtual <= 0) return -999;
  return ((precoJustoGraham - cotacaoAtual) / cotacaoAtual) * 100;
}

/**
 * Normaliza um valor para 0-100 com base em min/max e direção
 */
function normalize(value, min, max, inverse = false) {
  if (value === null || value === undefined || isNaN(value)) return 0;
  const clamped = Math.min(Math.max(value, min), max);
  const score = ((clamped - min) / (max - min)) * 100;
  return inverse ? 100 - score : score;
}

/**
 * Normaliza um array de valores por percentil (0-100)
 */
export function normalizeByPercentile(items, higherIsBetter = true) {
  const valid = items.filter(i => i.value !== null && !isNaN(i.value));
  const sorted = [...valid].sort((a, b) =>
    higherIsBetter ? a.value - b.value : b.value - a.value
  );
  const result = new Map();
  sorted.forEach((item, index) => {
    result.set(item.ticker, (index / (sorted.length - 1 || 1)) * 100);
  });
  return result;
}

/**
 * FILTROS ELIMINATÓRIOS
 */
export function passaFiltrosEliminatorios(stock) {
  if (!stock.lpa || stock.lpa <= 0) return false;          // LPA negativo
  if (!stock.vpa || stock.vpa <= 0) return false;          // VPA negativo
  const pl = stock.cotacaoAtual / stock.lpa;
  if (pl <= 0 || pl > 80) return false;                    // P/L absurdo
  if (stock.dlEbitda && stock.dlEbitda > 5) return false;  // Dívida perigosa (se tivermos o dado exato)
  return true;
}

// ======================== PILARES ========================

function calcPilar1(stock, percentilPL, percentilPVP) {
  const sBazin = normalize(stock.margemBazin, -30, 50);
  const sGraham = normalize(stock.margemGraham, -30, 50);
  const spl = percentilPL.get(stock.ticker) ?? 0;
  const spvp = percentilPVP.get(stock.ticker) ?? 0;
  return 0.35 * sBazin + 0.35 * sGraham + 0.15 * spl + 0.15 * spvp;
}

function calcPilar2(stock, percentilROE, percentilROIC, percentilMargem) {
  const sROE = percentilROE.get(stock.ticker) ?? 0;
  const sROIC = percentilROIC.get(stock.ticker) ?? 0;
  const sMargem = percentilMargem.get(stock.ticker) ?? 0;
  const hasROIC = stock.roic !== null && stock.roic !== undefined;
  if (!hasROIC) {
    return 0.60 * sROE + 0.40 * sMargem;
  }
  return 0.40 * sROE + 0.35 * sROIC + 0.25 * sMargem;
}

function calcPilar3(stock) {
  const dy = stock.divYield || 0;
  const sDY = normalize(dy, 0, 10);
  
  const anosPagos = stock.dividendosHistoricos
    ? stock.dividendosHistoricos.filter(d => (d.totalPago || 0) > 0).length
    : 0;
  const sConsistencia = (anosPagos / 10) * 100;
  
  const divs = stock.dividendosHistoricos || [];
  let sMediaDiv = 50;
  if (divs.length >= 6) {
    const ultimos3 = divs.slice(-3).map(d => d.totalPago || 0);
    const primeiros3 = divs.slice(0, 3).map(d => d.totalPago || 0);
    const mediaUlt = ultimos3.reduce((a, b) => a + b, 0) / 3;
    const mediaPri = primeiros3.reduce((a, b) => a + b, 0) / 3;
    const crescimento = mediaPri > 0 ? ((mediaUlt - mediaPri) / mediaPri) : 0;
    sMediaDiv = normalize(crescimento * 100, -50, 100);
  }
  
  return 0.40 * sDY + 0.35 * sConsistencia + 0.25 * sMediaDiv;
}

function calcPilar4(stock) {
  // Proxy de alavancagem: Dívida Bruta / Patrimônio (se não tiver dlEbitda explícito)
  const dl = stock.divBrutaPatrim ?? 2; 
  const sDL = normalize(dl, -1, 5, true); 
  const liq = stock.liqCorr ?? 1.5;
  const sLiq = normalize(liq, 0.5, 3);
  return 0.60 * sDL + 0.40 * sLiq;
}

function calcPilar5(stock, percentilEarningYield) {
  const pl = stock.cotacaoAtual / stock.lpa;
  const crescLPA = stock.crescLPA || stock.crescRec5a || 0; 
  const peg = crescLPA > 0 ? pl / crescLPA : null;
  const sPEG = peg !== null ? normalize(peg, 0, 2, true) : 50;
  const sEY = percentilEarningYield.get(stock.ticker) ?? 50;
  return 0.50 * sPEG + 0.50 * sEY;
}

// ======================== MOTOR PRINCIPAL ========================

export function calcCompositeScore(stocks, pesos = PERFIS_SCORE.equilibrado.pesos) {
  const validos = stocks.filter(passaFiltrosEliminatorios);
  const eliminados = stocks
    .filter(s => !passaFiltrosEliminatorios(s))
    .map(s => ({ ...s, scoreComposto: 0, eliminado: true, detalhePilares: { valuation: 0, qualidade: 0, proventos: 0, saude: 0, crescimento: 0 } }));
    
  const percentilPL = normalizeByPercentile(
    validos.map(s => ({ ticker: s.ticker, value: s.cotacaoAtual / s.lpa })),
    false 
  );
  const percentilPVP = normalizeByPercentile(
    validos.map(s => ({ ticker: s.ticker, value: s.pvp })),
    false
  );
  const percentilROE = normalizeByPercentile(
    validos.map(s => ({ ticker: s.ticker, value: s.roe })),
    true 
  );
  const percentilROIC = normalizeByPercentile(
    validos.filter(s => s.roic).map(s => ({ ticker: s.ticker, value: s.roic })),
    true
  );
  const percentilMargem = normalizeByPercentile(
    validos.filter(s => s.margemLiquida).map(s => ({ ticker: s.ticker, value: s.margemLiquida })),
    true
  );
  const percentilEY = normalizeByPercentile(
    // Earning Yield = 1 / EV/EBIT
    validos.filter(s => s.evEbit && s.evEbit > 0).map(s => ({ ticker: s.ticker, value: 1 / s.evEbit })),
    true
  );

  const scored = validos.map(stock => {
    const s1 = calcPilar1(stock, percentilPL, percentilPVP);
    const s2 = calcPilar2(stock, percentilROE, percentilROIC, percentilMargem);
    const s3 = calcPilar3(stock);
    const s4 = calcPilar4(stock);
    const s5 = calcPilar5(stock, percentilEY);
    
    let scoreComposto = 0;
    if (pesos.isPiotroski) {
      scoreComposto = Math.round((stock.fScore / 9) * 100);
    } else {
      scoreComposto = Math.round(
        pesos.valuation   * s1 +
        pesos.qualidade   * s2 +
        pesos.proventos   * s3 +
        pesos.saude       * s4 +
        pesos.crescimento * s5
      );
    }
    
    return {
      ...stock,
      score: scoreComposto, // Override para manter compatibilidade no UI de "score"
      scoreComposto,
      detalhePilares: {
        valuation:   Math.round(s1),
        qualidade:   Math.round(s2),
        proventos:   Math.round(s3),
        saude:       Math.round(s4),
        crescimento: Math.round(s5),
      },
      eliminado: false,
    };
  });
  
  return [...scored, ...eliminados]
    .sort((a, b) => b.score - a.score)
    .map((s, i) => ({ ...s, posicao: i + 1 }));
}

/**
 * F-Score simplificado (Piotroski)
 */
export function calcSimplifiedFScore(stock) {
  let score = 0;
  if (stock.roe && stock.roe > 0) score++;
  if (stock.lpa && stock.lpa > 0) score++;
  if (stock.crescRec5a && stock.crescRec5a > 0) score++;
  if (stock.divBrutaPatrim !== undefined && stock.divBrutaPatrim < 1) score++;
  if (stock.liqCorr && stock.liqCorr > 1) score++;
  if (stock.margemEbit && stock.margemEbit > 10) score++;
  if (stock.divYield && stock.divYield > 0) score++;
  if (stock.pl && stock.pl > 0 && stock.pl < 15) score++;
  if (stock.margemLiquida && stock.margemLiquida > 10) score++;
  return score;
}

export function rankPiotroskiGraham(stocks) {
  return [...stocks]
    .filter(s => s.margemGraham > 0)
    .sort((a, b) => {
      if (b.fScore !== a.fScore) return b.fScore - a.fScore;
      return b.margemGraham - a.margemGraham;
    })
    .map((stock, index) => ({ ...stock, posicao: index + 1 }));
}

/**
 * Prepara o objeto básico. Apenas Bazin, Graham e fScore aqui.
 * O score final será calculado pelo StockContext.jsx (calcCompositeScore).
 */
export function enrichStock(rawStock) {
  const mediaDividendos = calcMediaDividendos(rawStock.dividendosHistoricos, rawStock.lpa);
  const precoTetoBazin = calcBazin(mediaDividendos);
  const precoJustoGraham = calcGraham(rawStock.lpa, rawStock.vpa);
  const margemBazin = calcMargemBazin(precoTetoBazin, rawStock.cotacaoAtual);
  const margemGraham = calcMargemGraham(precoJustoGraham, rawStock.cotacaoAtual);
  const fScore = calcSimplifiedFScore(rawStock);

  return {
    ...rawStock,
    mediaDividendos,
    precoTetoBazin,
    precoJustoGraham,
    margemBazin,
    margemGraham,
    fScore
  };
}
