// src/utils/valuation.js
// Motor de cálculo de valuation — fórmulas de Graham, Bazin e Score

/**
 * Calcula a média de dividendos dos últimos 10 anos
 * @param {Array<{ano: number, totalPago: number}>} dividendosHistoricos
 * @returns {number}
 */
export function calcMediaDividendos(dividendosHistoricos, lpa = 0) {
  if (!dividendosHistoricos || dividendosHistoricos.length === 0) {
    return lpa > 0 ? lpa * 0.5 : 0; // Fallback: 50% de payout projetado
  }
  const soma = dividendosHistoricos.reduce((acc, d) => acc + (d.totalPago || 0), 0);
  return soma / 10; // sempre divide por 10 conforme spec
}

/**
 * Preço Teto de Décio Bazin
 * Retorno mínimo exigido: 6% ao ano
 * @param {number} mediaDividendos
 * @returns {number}
 */
export function calcBazin(mediaDividendos) {
  if (!mediaDividendos || mediaDividendos <= 0) return 0;
  return mediaDividendos / 0.06;
}

/**
 * Preço Justo de Benjamin Graham
 * √(22.5 × LPA × VPA)
 * Retorna 0 se LPA ou VPA forem negativos ou zero
 * @param {number} lpa - Lucro Por Ação
 * @param {number} vpa - Valor Patrimonial Por Ação
 * @returns {number}
 */
export function calcGraham(lpa, vpa) {
  if (!lpa || !vpa || lpa <= 0 || vpa <= 0) return 0;
  const resultado = Math.sqrt(22.5 * lpa * vpa);
  return isNaN(resultado) ? 0 : resultado;
}

/**
 * Margem de segurança de Bazin em percentual
 * Positivo = ação abaixo do preço teto (oportunidade)
 * Negativo = ação acima do preço teto (cara)
 * @param {number} precoTetoBazin
 * @param {number} cotacaoAtual
 * @returns {number}
 */
export function calcMargemBazin(precoTetoBazin, cotacaoAtual) {
  if (!precoTetoBazin || precoTetoBazin <= 0) return -999;
  return ((precoTetoBazin - cotacaoAtual) / precoTetoBazin) * 100;
}

/**
 * Margem de segurança de Graham em percentual
 * @param {number} precoJustoGraham
 * @param {number} cotacaoAtual
 * @returns {number}
 */
export function calcMargemGraham(precoJustoGraham, cotacaoAtual) {
  if (!precoJustoGraham || precoJustoGraham <= 0) return -999;
  return ((precoJustoGraham - cotacaoAtual) / precoJustoGraham) * 100;
}

/**
 * Verifica se a empresa pagou dividendos em todos os anos (consistência)
 * @param {Array<{ano: number, totalPago: number}>} dividendosHistoricos
 * @returns {boolean} true se nunca deixou de pagar
 */
export function isConsistente(dividendosHistoricos) {
  if (!dividendosHistoricos || dividendosHistoricos.length === 0) return false;
  return !dividendosHistoricos.some(d => !d.totalPago || d.totalPago === 0);
}

/**
 * Clamp: limita um valor entre min e max
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calcula o Score Final (0 a 100) de uma ação
 *
 * Peso Desconto: 70% — média das margens Bazin e Graham
 * Peso Qualidade: 20% — ROE (máximo em ROE >= 15%)
 * Peso Consistência: 10% — pagou dividendos todos os 10 anos
 *
 * @param {Object} stock - Objeto completo da ação com todos os campos calculados
 * @returns {number} Score de 0 a 100
 */
export function calcScore(stock) {
  const { lpa, vpa, roe, dividendosHistoricos, cotacaoAtual } = stock;

  // Filtro de corte: LPA ou VPA negativos/zero → Score 0
  if (!lpa || !vpa || lpa <= 0 || vpa <= 0) return 0;
  if (!cotacaoAtual || cotacaoAtual <= 0) return 0;

  // Calcula métricas intermediárias
  const mediaDividendos = calcMediaDividendos(dividendosHistoricos, lpa);
  const precoTetoBazin = calcBazin(mediaDividendos);
  const precoJustoGraham = calcGraham(lpa, vpa);
  const margemBazin = calcMargemBazin(precoTetoBazin, cotacaoAtual);
  const margemGraham = calcMargemGraham(precoJustoGraham, cotacaoAtual);

  // ── Peso Desconto (70 pts) ───────────────────────────────────
  // Média das duas margens; 50% de margem média = pontuação máxima
  const mediaMargens = (margemBazin + margemGraham) / 2;
  const pontoDesconto = clamp((mediaMargens / 50) * 70, 0, 70);

  // ── Peso Qualidade / ROE (20 a 30 pts) ────────────────────────────
  // ROE >= 15% = pontuação máxima. Se não tiver histórico, peso vai para 30.
  const roeValor = roe || 0;
  const pesoMaxRoe = (!dividendosHistoricos || dividendosHistoricos.length === 0) ? 30 : 20;
  const pontoROE = clamp((roeValor / 15) * pesoMaxRoe, 0, pesoMaxRoe);

  // ── Peso Consistência (10 pts) ───────────────────────────────
  const pontoConsistencia = isConsistente(dividendosHistoricos) ? 10 : 0;

  return Math.round(pontoDesconto + pontoROE + pontoConsistencia);
}

/**
 * Enriquece um objeto de ação com todos os valores calculados
 * @param {Object} rawStock - Dados brutos do IndexedDB/API
 * @returns {Object} Ação com todos os campos de valuation calculados
 */
export function enrichStock(rawStock) {
  const mediaDividendos = calcMediaDividendos(rawStock.dividendosHistoricos, rawStock.lpa);
  const precoTetoBazin = calcBazin(mediaDividendos);
  const precoJustoGraham = calcGraham(rawStock.lpa, rawStock.vpa);
  const margemBazin = calcMargemBazin(precoTetoBazin, rawStock.cotacaoAtual);
  const margemGraham = calcMargemGraham(precoJustoGraham, rawStock.cotacaoAtual);
  const score = calcScore(rawStock);
  const consistente = isConsistente(rawStock.dividendosHistoricos);

  return {
    ...rawStock,
    mediaDividendos,
    precoTetoBazin,
    precoJustoGraham,
    margemBazin,
    margemGraham,
    score,
    consistente,
  };
}

/**
 * Ordena um array de ações pelo Score (maior primeiro)
 * Ações com score 0 vão para o fim
 * @param {Array<Object>} stocks
 * @returns {Array<Object>} Array ordenado com campo `posicao`
 */
export function rankStocks(stocks) {
  return [...stocks]
    .sort((a, b) => b.score - a.score)
    .map((stock, index) => ({ ...stock, posicao: index + 1 }));
}

/**
 * Retorna o label de oportunidade baseado nas margens
 * @param {number} margemBazin
 * @param {number} margemGraham
 * @returns {'COMPRA_FORTE' | 'NEUTRO' | 'CARO'}
 */
export function getOportunidade(margemBazin, margemGraham) {
  const mediaMargens = (margemBazin + margemGraham) / 2;
  if (mediaMargens >= 20) return 'COMPRA_FORTE';
  if (mediaMargens >= 0) return 'NEUTRO';
  return 'CARO';
}
