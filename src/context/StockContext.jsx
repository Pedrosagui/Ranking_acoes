// src/context/StockContext.jsx
// Context API: estado global do app, actions e inicialização

import { createContext, useContext, useReducer, useEffect } from 'react';
import { syncAllStocks } from '../services/syncService';
import { calcCompositeScore, PERFIS_SCORE } from '../utils/valuation';

const ONE_HOUR_MS = 60 * 60 * 1000; // 1 hora em milissegundos

// ── Estado Inicial ────────────────────────────────────────────────
const initialState = {
  stocks: [],           // Ações ranqueadas (enriquecidas + ordenadas)
  isLoading: false,     // Loading geral
  error: null,          // Mensagem de erro
  autoSyncNeeded: false, // Flag para auto-sync
  activeProfile: 'equilibrado', // Perfil de pontuação atual
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

    case 'SET_STOCKS':
      return { ...state, stocks: action.payload };

    case 'MERGE_BATCH': {
      // Atualização progressiva: mescla lote com estado atual
      const existing = state.stocks.filter(
        s => !action.payload.find(n => n.ticker === s.ticker)
      );
      const merged = calcCompositeScore([...existing, ...action.payload], PERFIS_SCORE[state.activeProfile].pesos);
      return { ...state, stocks: merged };
    }

    case 'SET_PROFILE':
      return { 
        ...state, 
        activeProfile: action.payload,
        stocks: calcCompositeScore(state.stocks, PERFIS_SCORE[action.payload].pesos)
      };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_FILTER':
      return {
        ...state,
        filters: { ...state.filters, [action.key]: action.value },
      };

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────
const StockContext = createContext(null);

export function StockProvider({ children }) {
  const [state, dispatch] = useReducer(stockReducer, initialState);
  // Inicialização: busca os dados direto do servidor (Aegis)
  useEffect(() => {
    async function init() {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      try {
        const enriched = await syncAllStocks();
        if (enriched.length > 0) {
          dispatch({ type: 'SET_STOCKS', payload: calcCompositeScore(enriched, PERFIS_SCORE['equilibrado'].pesos) });
        }
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar dados: ' + err.message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
    init();
  }, []);

  // ── Auto-sync: dispara quando autoSyncNeeded fica true ────────
  useEffect(() => {
    if (state.autoSyncNeeded && !state.isLoading && !state.isSyncing) {
      dispatch({ type: 'SET_AUTO_SYNC', payload: false });
      if (syncAllRef.current) syncAllRef.current();
    }
  }, [state.autoSyncNeeded, state.isLoading, state.isSyncing]);

  // ── Auto-refresh a cada 1 hora ────────────────────────────────
  useEffect(() => {
    const intervalId = setInterval(() => {
      dispatch({ type: 'SET_AUTO_SYNC', payload: true });
    }, ONE_HOUR_MS);
    return () => clearInterval(intervalId);
  }, []);

  const saveToken = useCallback(async (token) => {
    await setSetting('apiToken', token);
    dispatch({ type: 'SET_TOKEN', payload: token });
    if (token) {
      // Limpa as ações em memória e no IndexedDB para apagar o mock velho
      await clearStocks();
      dispatch({ type: 'SET_STOCKS', payload: [] });
      dispatch({ type: 'SET_AUTO_SYNC', payload: true });
    }
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

  const setProfile = useCallback((profileKey) => {
    dispatch({ type: 'SET_PROFILE', payload: profileKey });
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

  return (
    <StockContext.Provider value={{
      ...state,
      dispatch,
      setProfile,
      filteredStocks,
    }}>
      {children}
    </StockContext.Provider>
  );
}

export function useStocks() {
  return useContext(StockContext);
}
