// src/db/database.js
// Configuração do Dexie.js para persistência local via IndexedDB

import Dexie from 'dexie';

export const db = new Dexie('RankingValuationB3');

db.version(1).stores({
  // Tabela principal de ações
  // ticker é a chave primária
  stocks: 'ticker, setor, score, atualizadoEm',

  // Configurações do usuário (chave-valor simples)
  settings: 'key',

  // Log de sincronizações
  logs: '++id, tipo, timestamp',
});

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Busca todas as ações do IndexedDB
 * @returns {Promise<Array>}
 */
export async function getAllStocks() {
  return await db.stocks.toArray();
}

/**
 * Salva ou atualiza um conjunto de ações no IndexedDB
 * @param {Array<Object>} stocks
 */
export async function saveStocks(stocks) {
  await db.stocks.bulkPut(stocks);
}

/**
 * Salva uma única ação
 * @param {Object} stock
 */
export async function saveStock(stock) {
  await db.stocks.put({ ...stock, atualizadoEm: new Date().toISOString() });
}

/**
 * Busca uma configuração pelo nome da chave
 * @param {string} key
 * @returns {Promise<any>}
 */
export async function getSetting(key) {
  const record = await db.settings.get(key);
  return record ? record.value : null;
}

/**
 * Salva uma configuração
 * @param {string} key
 * @param {any} value
 */
export async function setSetting(key, value) {
  await db.settings.put({ key, value });
}

/**
 * Adiciona uma entrada no log
 * @param {'INFO'|'SUCCESS'|'ERROR'|'WARN'} tipo
 * @param {string} mensagem
 */
export async function addLog(tipo, mensagem) {
  await db.logs.add({
    tipo,
    mensagem,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Busca os últimos N logs
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getRecentLogs(limit = 50) {
  return await db.logs.orderBy('id').reverse().limit(limit).toArray();
}

/**
 * Limpa todos os dados (reset completo)
 */
export async function clearAll() {
  await db.stocks.clear();
  await db.logs.clear();
  // Mantém settings (não apaga o token da API)
}
