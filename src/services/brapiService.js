// src/services/brapiService.js
// Serviço de integração com a API Brapi (brapi.dev)
// Documentação: https://brapi.dev/docs

const BRAPI_BASE = 'https://brapi.dev/api';

/**
 * Busca dados de múltiplos tickers em lote (carga quente)
 * Retorna: cotação, LPA (eps), VPA (bookValue), ROE
 *
 * @param {string[]} tickers - Array de tickers ex: ['ITUB4', 'VALE3']
 * @param {string} token - Token da API Brapi
 * @returns {Promise<Array<Object>>}
 */
export async function fetchBatch(tickers, token) {
  const tickerList = tickers.join(',');
  const params = new URLSearchParams({});

  const url = `${BRAPI_BASE}/quote/${tickerList}?${params}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token || 'j9AenuWTpLNEGCKi8fbEwn'}`,
    }
  });

  if (!response.ok) {
    throw new Error(`Brapi API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.results) {
    throw new Error('Resposta inválida da Brapi: campo "results" não encontrado');
  }

  return data.results.map(item => ({
    ticker: item.symbol,
    cotacaoAtual: item.regularMarketPrice ?? null,
  }));
}

/**
 * Busca dados de um único ticker (fallback individual)
 * @param {string} ticker
 * @param {string} token
 * @returns {Promise<Object>}
 */
export async function fetchSingle(ticker, token) {
  const results = await fetchBatch([ticker], token);
  return results[0] || null;
}

/**
 * Valida se um token da Brapi é válido fazendo uma chamada de teste
 * @param {string} token
 * @returns {Promise<boolean>}
 */
export async function validateToken(token) {
  try {
    const result = await fetchBatch(['ITUB4'], token);
    return result && result.length > 0 && result[0].cotacaoAtual !== null;
  } catch {
    return false;
  }
}
