import { createContext, useContext, useState, useEffect } from 'react';
import { getCarteirasLocal, saveCarteiraLocal, getCarteirasFirestore, saveCarteiraFirestore } from '../services/portfolioService';
import { useAuth } from './AuthContext';

const PortfolioContext = createContext(null);

export function PortfolioProvider({ children }) {
  const { firebaseUser, isLoggedIn } = useAuth();
  const [carteiras, setCarteiras] = useState([]);
  const [carteiraAtiva, setCarteiraAtiva] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCarteiras() {
      setIsLoading(true);
      let data = [];
      if (isLoggedIn && firebaseUser) {
        try {
          data = await getCarteirasFirestore(firebaseUser.uid);
        } catch (e) {
          console.warn("Firestore inacessível, caindo para local storage:", e);
        }
      }
      
      // Merge with local if needed, or fallback
      if (!data || data.length === 0) {
        data = await getCarteirasLocal();
      }

      if (data.length === 0) {
        // Criar carteira default
        const defaultCart = { id: 'principal', nome: 'Carteira Principal', posicoes: [] };
        data = [defaultCart];
        if (isLoggedIn) saveCarteiraFirestore(firebaseUser.uid, defaultCart);
        else saveCarteiraLocal(defaultCart);
      }

      setCarteiras(data);
      setCarteiraAtiva(data[0]);
      setIsLoading(false);
    }

    loadCarteiras();
  }, [firebaseUser, isLoggedIn]);

  async function syncCarteira(cart) {
    const novas = carteiras.map(c => c.id === cart.id ? cart : c);
    setCarteiras(novas);
    setCarteiraAtiva(cart);
    if (isLoggedIn && firebaseUser) await saveCarteiraFirestore(firebaseUser.uid, cart);
    else await saveCarteiraLocal(cart);
  }

  const addPosicao = async (carteiraId, posicao) => {
    const cart = carteiras.find(c => c.id === carteiraId);
    if (!cart) return;
    
    // Atualiza ou insere
    const idx = cart.posicoes.findIndex(p => p.ticker === posicao.ticker);
    const novasPosicoes = [...cart.posicoes];
    if (idx >= 0) {
      novasPosicoes[idx] = posicao;
    } else {
      novasPosicoes.push(posicao);
    }
    await syncCarteira({ ...cart, posicoes: novasPosicoes });
  };

  const removePosicao = async (carteiraId, ticker) => {
    const cart = carteiras.find(c => c.id === carteiraId);
    if (!cart) return;
    const novasPosicoes = cart.posicoes.filter(p => p.ticker !== ticker);
    await syncCarteira({ ...cart, posicoes: novasPosicoes });
  };

  const addPosicoesLote = async (novasPosicoesList) => {
    if (!carteiraAtiva) return;
    // Pega carteira ativa, substitui as posicoes e mantem as velhas
    const cart = carteiraAtiva;
    const mergeDict = {};
    cart.posicoes.forEach(p => mergeDict[p.ticker] = p);
    novasPosicoesList.forEach(p => mergeDict[p.ticker] = p);
    await syncCarteira({ ...cart, posicoes: Object.values(mergeDict) });
  };

  return (
    <PortfolioContext.Provider value={{
      carteiras,
      carteiraAtiva,
      setCarteiraAtiva,
      addPosicao,
      removePosicao,
      addPosicoesLote,
      isLoading
    }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  return useContext(PortfolioContext);
}
