import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { confirmEmailLink } from '../../services/authService';

export default function EmailConfirmPage() {
  const [status, setStatus] = useState('loading'); // loading | success | error
  const navigate = useNavigate();

  useEffect(() => {
    async function confirm() {
      try {
        await confirmEmailLink(window.location.href);
        setStatus('success');
        setTimeout(() => navigate('/'), 2000);
      } catch (e) {
        setStatus('error');
      }
    }
    confirm();
  }, [navigate]);

  if (status === 'loading') return <div className="loading-screen" style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Confirmando acesso...</div>;
  if (status === 'success') return <div className="loading-screen" style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>✅ Logado com sucesso! Redirecionando...</div>;
  return <div className="loading-screen" style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>❌ Link inválido ou expirado. Tente novamente.</div>;
}
