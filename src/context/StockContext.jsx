// src/context/StockContext.jsx
// Context API: estado global do app, actions e inicialização

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { getAllStocks, getSetting, setSetting, getRecentLogs, clearAll } from '../db/database';
import { syncAllStocks } from '../services/syncService';
import { validateToken } from '../services/brapiService';
import { rankStocks } from '../utils/valuation';

// ── Estado Inicial ────────────────────────────────────────────────
const initialState = {
  stocks: [],           // Ações ranqueadas (enriquecidas + ordenadas)
  isLoading: false,     // Loading geral
  isSyncing: false,     // Sync em progresso
  syncProgress: null,   // { loteAtual, totalLotes, tickersProcessados, tickersNomesAtual }
  apiToken: '',         // Token da Brapi
  logs: [],             // Logs recentes
  lastSync: null,       // ISO string do último sync
  error: null,          // Mensagem de erro
  filters: {
    busca: '',
    setor: 'Todos',
    apenasDesconto: false,
    apenasConsistentes: false,
    ordenacao: 'score',
  },
};

// ── Reducer ───────────────────────────────────────────────────────
function stockReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_SYNCING':
      return { ...state, isSyncing: action.payload };

    case 'SET_SYNC_PROGRESS':
      return { ...state, syncProgress: action.payload };

    case 'SET_STOCKS':
      return { ...state, stocks: action.payload };

    case 'MERGE_BATCH':
      // Atualização progressiva: mescla lote com estado atual
      const existing = state.stocks.filter(
        s => !action.payload.find(n => n.ticker === s.ticker)
      );
      const merged = rankStocks([...existing, ...action.payload]);
      return { ...state, stocks: merged };

    case 'SET_TOKEN':
      return { ...state, apiToken: action.payload };

    case 'SET_LOGS':
      return { ...state, logs: action.payload };

    case 'ADD_LOG':
      return { ...state, logs: [action.payload, ...state.logs].slice(0, 100) };

    case 'SET_LAST_SYNC':
      return { ...state, lastSync: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_FILTER':
      return {
        ...state,
        filters: { ...state.filters, [action.key]: action.value },
      };

    case 'RESET':
      return { ...initialState, apiToken: state.apiToken };

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────
const StockContext = createContext(null);

export function StockProvider({ children }) {
  const [state, dispatch] = useReducer(stockReducer, initialState);

  // Inicialização: carrega dados do IndexedDB ao montar
  useEffect(() => {
    async function init() {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const [stocks, token, lastSync, logs] = await Promise.all([
          getAllStocks(),
          getSetting('apiToken'),
          getSetting('lastSync'),
          getRecentLogs(50),
        ]);

        if (token) dispatch({ type: 'SET_TOKEN', payload: token });
        if (lastSync) dispatch({ type: 'SET_LAST_SYNC', payload: lastSync });
        if (logs.length) dispatch({ type: 'SET_LOGS', payload: logs });

        if (stocks.length > 0) {
          dispatch({ type: 'SET_STOCKS', payload: rankStocks(stocks) });
        }
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar dados: ' + err.message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
    init();
  }, []);

  // ── Actions ───────────────────────────────────────────────────

  const syncAll = useCallback(async () => {
    if (state.isSyncing) return;

    dispatch({ type: 'SET_SYNCING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      await syncAllStocks(
        state.apiToken,
        // onProgress
        (progress) => {
          dispatch({ type: 'SET_SYNC_PROGRESS', payload: progress });
        },
        // onBatchComplete — atualização progressiva da UI
        (batch) => {
          dispatch({ type: 'MERGE_BATCH', payload: batch });
        }
      );

      // Recarrega tudo do IndexedDB ao final para garantir consistência
      const finalStocks = await getAllStocks();
      dispatch({ type: 'SET_STOCKS', payload: rankStocks(finalStocks) });

      const now = new Date().toISOString();
      await setSetting('lastSync', now);
      dispatch({ type: 'SET_LAST_SYNC', payload: now });

      const logs = await getRecentLogs(50);
      dispatch({ type: 'SET_LOGS', payload: logs });

    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Erro na sincronização: ' + err.message });
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false });
      dispatch({ type: 'SET_SYNC_PROGRESS', payload: null });
    }
  }, [state.isSyncing, state.apiToken]);

  const saveToken = useCallback(async (token) => {
    await setSetting('apiToken', token);
    dispatch({ type: 'SET_TOKEN', payload: token });
  }, []);

  const checkToken = useCallback(async (token) => {
    return await validateToken(token);
  }, []);

  const resetData = useCallback(async () => {
    await clearAll();
    dispatch({ type: 'RESET' });
  }, []);

  const setFilter = useCallback((key, value) => {
    dispatch({ type: 'SET_FILTER', key, value });
  }, []);

  // ── Stocks filtrados e ordenados ──────────────────────────────
  const filteredStocks = (() => {
    let result = [...state.stocks];

    if (state.filters.busca) {
      const q = state.filters.busca.toLowerCase();
      result = result.filter(s =>
        s.ticker.toLowerCase().includes(q) ||
        s.empresa?.toLowerCase().includes(q)
      );
    }

    if (state.filters.setor !== 'Todos') {
      result = result.filter(s => s.setor === state.filters.setor);
    }

    if (state.filters.apenasDesconto) {
      result = result.filter(s =>
        (s.margemBazin > 0 || s.margemGraham > 0)
      );
    }

    if (state.filters.apenasConsistentes) {
      result = result.filter(s => s.consistente);
    }

    // Re-ordena conforme filtro
    if (state.filters.ordenacao === 'margemBazin') {
      result.sort((a, b) => b.margemBazin - a.margemBazin);
    } else if (state.filters.ordenacao === 'margemGraham') {
      result.sort((a, b) => b.margemGraham - a.margemGraham);
    } else if (state.filters.ordenacao === 'roe') {
      result.sort((a, b) => (b.roe || 0) - (a.roe || 0));
    }
    // score já vem ordenado por padrão

    return result.map((s, i) => ({ ...s, posicao: i + 1 }));
  })();

  const value = {
    ...state,
    filteredStocks,
    syncAll,
    saveToken,
    checkToken,
    resetData,
    setFilter,
  };

  return (
    <StockContext.Provider value={value}>
      {children}
    </StockContext.Provider>
  );
}

export function useStocks() {
  const ctx = useContext(StockContext);
  if (!ctx) throw new Error('useStocks deve ser usado dentro de StockProvider');
  return ctx;
}
