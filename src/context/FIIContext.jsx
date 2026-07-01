import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { rankFIIs } from '../utils/fiiValuation';

const initialState = {
  fiis: [],
  isLoading: false,
  error: null,
  filters: {
    busca: '',
    segmento: 'Todos',
  },
};

function fiiReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, isLoading: action.payload };
    case 'SET_FIIS': return { ...state, fiis: action.payload };
    case 'SET_ERROR': return { ...state, error: action.payload };
    case 'SET_FILTER': return { ...state, filters: { ...state.filters, [action.key]: action.value } };
    default: return state;
  }
}

const FIIContext = createContext(null);

export function FIIProvider({ children }) {
  const [state, dispatch] = useReducer(fiiReducer, initialState);

  useEffect(() => {
    async function init() {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const res = await fetch(`${API_URL}/fiis`);
        if (!res.ok) throw new Error('Falha ao buscar FIIs da API');
        
        const data = await res.json();
        
        const enriched = data.map(fii => {
          return {
            ...fii,
            divYield: fii.divYield || 0,
            pvp: fii.pvp || 0,
            volumeDiario: fii.liquidezMedia || 0,
            dividendosMensais: fii.dividendHistory ? fii.dividendHistory : [],
          }
        });
        const ranked = rankFIIs(enriched);
        dispatch({ type: 'SET_FIIS', payload: ranked });
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

  const filteredFIIs = (() => {
    let result = [...state.fiis];
    if (state.filters.busca) {
      const q = state.filters.busca.toLowerCase();
      result = result.filter(f => f.ticker.toLowerCase().includes(q) || f.nome.toLowerCase().includes(q));
    }
    if (state.filters.segmento !== 'Todos') {
      result = result.filter(f => f.segmento === state.filters.segmento);
    }
    return result;
  })();

  return (
    <FIIContext.Provider value={{ ...state, filteredFIIs, setFilter }}>
      {children}
    </FIIContext.Provider>
  );
}

export function useFIIs() {
  return useContext(FIIContext);
}
