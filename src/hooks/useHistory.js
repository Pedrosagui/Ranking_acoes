import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export function useHistory(ticker) {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ticker) {
      setHistory([]);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    fetch(`${API_URL}/history/${ticker}`)
      .then(res => {
        if (!res.ok) throw new Error('Falha ao buscar histórico');
        return res.json();
      })
      .then(data => {
        if (isMounted) {
          setHistory(data);
          setIsLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error(err);
          setError(err.message);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [ticker]);

  return { history, isLoading, error };
}
