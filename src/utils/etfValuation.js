// Motor de score para ETFs

function normalize(value, min, max, inverse = false) {
  if (value === null || value === undefined || isNaN(value)) return 0;
  const clamped = Math.min(Math.max(value, min), max);
  const score = ((clamped - min) / (max - min)) * 100;
  return inverse ? 100 - score : score;
}

// Calcula alpha = retorno ETF - retorno benchmark (ambos em %)
export function calcAlpha(retornoEtf, retornoBenchmark) {
  if (retornoEtf == null || retornoBenchmark == null) return 0;
  return retornoEtf - retornoBenchmark;
}

// Calcula Sharpe simplificado = (retorno - cdi) / volatilidade
export function calcSharpe(retorno12m, volatilidade12m, cdi12m = 10.5) {
  if (!volatilidade12m || volatilidade12m === 0) return 0;
  return (retorno12m - cdi12m) / volatilidade12m;
}

export function passaFiltrosETF(etf) {
  if (!etf.retorno12m && etf.retorno12m !== 0) return false;
  return true;
}

export function calcScoreETF(etf) {
  if (!passaFiltrosETF(etf)) return 0;

  // Pilar 1 — Performance vs Benchmark (40%)
  const alpha = calcAlpha(etf.retorno12m, etf.retornoBenchmark12m);
  // alpha -10% = 0, alpha +20% = 100
  const sAlpha = normalize(alpha, -10, 20);

  // Sharpe: 0 = 0, 2+ = 100
  const sharpe = calcSharpe(etf.retorno12m, etf.volatilidade12m);
  const sSharpe = normalize(sharpe, 0, 2);

  const pilarPerformance = 0.60 * sAlpha + 0.40 * sSharpe;

  // Pilar 2 — Custo / Eficiência (30%)
  // Taxa de adm: 1.5% = 0, 0% = 100
  const sTaxa = normalize(etf.taxaAdm, 0, 1.5, true);

  // Tracking error: 5% = 0, 0% = 100
  const trackingError = etf.trackingError ?? 1;
  const sTracking = normalize(trackingError, 0, 5, true);

  const pilarCusto = 0.60 * sTaxa + 0.40 * sTracking;

  // Pilar 3 — Liquidez (30%)
  // Volume < 500k = 0, > 50M = 100
  const sLiquidez = normalize(etf.volumeDiario, 500000, 50000000);

  const scoreTotal = Math.round(
    0.40 * pilarPerformance +
    0.30 * pilarCusto +
    0.30 * sLiquidez
  );

  return {
    scoreTotal,
    detalhes: {
      performance: Math.round(pilarPerformance),
      custo: Math.round(pilarCusto),
      liquidez: Math.round(sLiquidez),
    }
  };
}

export function rankETFs(etfs) {
  return etfs
    .map(etf => {
      const resultado = calcScoreETF(etf);
      return {
        ...etf,
        scoreComposto: typeof resultado === 'object' ? resultado.scoreTotal : resultado,
        detalhePilares: typeof resultado === 'object' ? resultado.detalhes : {},
        eliminado: !passaFiltrosETF(etf),
      };
    })
    .sort((a, b) => b.scoreComposto - a.scoreComposto)
    .map((e, i) => ({ ...e, posicao: i + 1 }));
}
