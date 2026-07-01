// Motor de score para FIIs

function normalize(value, min, max, inverse = false) {
  if (value === null || value === undefined || isNaN(value)) return 0;
  const clamped = Math.min(Math.max(value, min), max);
  const score = ((clamped - min) / (max - min)) * 100;
  return inverse ? 100 - score : score;
}

// Pontuação por segmento (baseada em historico de performance)
const SCORE_SEGMENTO = {
  'Logística': 90,
  'Lajes Corporativas': 75,
  'Shoppings': 70,
  'Residencial/Varejo': 65,
  'Hospitalar': 60,
  'CRI/CRA': 55,
  'Fundo de Fundos': 50,
};

// Filtros eliminatórios para FIIs
export function passaFiltrosFII(fii) {
  if (!fii.divYield || fii.divYield < 4) return false;   // DY mínimo 4%
  if (!fii.pvp || fii.pvp <= 0 || fii.pvp > 3) return false; // P/VP absurdo
  return true;
}

export function calcScoreFII(fii) {
  if (!passaFiltrosFII(fii)) return 0;

  // Pilar 1 — Proventos (40%)
  // DY: 5% = 0, 15% = 100
  const sDY = normalize(fii.divYield, 5, 15);

  // Consistência: meses pagos nos últimos 12 / 12
  const mesesPagos = fii.dividendosMensais
    ? fii.dividendosMensais.filter(d => d.valor > 0).length
    : 0;
  const sConsistencia = (Math.min(mesesPagos, 12) / 12) * 100;

  const pilarProventos = 0.60 * sDY + 0.40 * sConsistencia;

  // Pilar 2 — Desconto P/VP (30%)
  // PVP 0.5 = 100 (grande desconto), PVP 1.5 = 0 (prêmio)
  const sPVP = normalize(fii.pvp, 0.5, 1.5, true);

  // Pilar 3 — Qualidade do Segmento (20%)
  const sSegmento = SCORE_SEGMENTO[fii.segmento] ?? 50;

  // Pilar 4 — Liquidez (10%)
  // Volume < 200k = 0, > 10M = 100
  const sLiquidez = normalize(fii.volumeDiario, 200000, 10000000);

  const scoreTotal = Math.round(
    0.40 * pilarProventos +
    0.30 * sPVP +
    0.20 * sSegmento +
    0.10 * sLiquidez
  );

  return {
    scoreTotal,
    detalhes: {
      proventos: Math.round(pilarProventos),
      descontoPVP: Math.round(sPVP),
      qualidade: Math.round(sSegmento),
      liquidez: Math.round(sLiquidez),
    }
  };
}

export function rankFIIs(fiis) {
  return fiis
    .map(fii => {
      const resultado = calcScoreFII(fii);
      return {
        ...fii,
        scoreComposto: typeof resultado === 'object' ? resultado.scoreTotal : resultado,
        detalhePilares: typeof resultado === 'object' ? resultado.detalhes : {},
        eliminado: !passaFiltrosFII(fii),
      };
    })
    .sort((a, b) => b.scoreComposto - a.scoreComposto)
    .map((f, i) => ({ ...f, posicao: i + 1 }));
}
