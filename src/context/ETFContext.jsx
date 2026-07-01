import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { rankETFs } from '../utils/etfValuation';

const initialState = {
  etfs: [],
  isLoading: false,
  error: null,
  filters: {
    busca: '',
    benchmark: 'Todos',
  },
};

function etfReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, isLoading: action.payload };
    case 'SET_ETFS': return { ...state, etfs: action.payload };
    case 'SET_ERROR': return { ...state, error: action.payload };
    case 'SET_FILTER': return { ...state, filters: { ...state.filters, [action.key]: action.value } };
    default: return state;
  }
}

const ETFContext = createContext(null);

export function ETFProvider({ children }) {
  const [state, dispatch] = useReducer(etfReducer, initialState);

  useEffect(() => {
    async function init() {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const res = await fetch(`${API_URL}/etfs`);
        if (!res.ok) throw new Error('Falha ao buscar ETFs da API');
        
        const data = await res.json();
        
        const enriched = data.map(etf => {
          return {
            ...etf,
            retorno12m: etf.rentabilidade12m || 0,
            retornoBenchmark12m: 0,
            volatilidade12m: 0,
            volumeDiario: 0,
          }
        });
        const ranked = rankETFs(enriched);
        dispatch({ type: 'SET_ETFS', payload: ranked });
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: err.message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
    init();
  }, []);

  const setFilter = useCallback((key, value) => {
    dispatch({ type: 'SET_FILTER', key, value });
  }, []);

  const filteredETFs = (() => {
    let result = [...state.etfs];
    if (state.filters.busca) {
      const q = state.filters.busca.toLowerCase();
      result = result.filter(e => e.ticker.toLowerCase().includes(q) || e.nome.toLowerCase().includes(q));
    }
    if (state.filters.benchmark !== 'Todos') {
      result = result.filter(e => e.benchmark === state.filters.benchmark);
    }
    return result;
  })();

  return (
    <ETFContext.Provider value={{ ...state, filteredETFs, setFilter }}>
      {children}
    </ETFContext.Provider>
  );
}

export function useETFs() {
  return useContext(ETFContext);
}
