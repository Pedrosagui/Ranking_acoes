import { useAuth } from '../../context/AuthContext';
import LoginPage from './LoginPage';

/**
 * Protege rotas que requerem login.
 * A pedido do usuário, agora está ATIVADO.
 */
const REQUIRE_AUTH = true; 

export default function AuthGuard({ children }) {
  const { isLoading, isLoggedIn } = useAuth();

  if (!REQUIRE_AUTH) return <div key="app-unsecured">{children}</div>;
  if (isLoading) return <div key="loading" className="loading-screen" style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Carregando...</div>;
  if (!isLoggedIn) return <div key="login"><LoginPage /></div>;

  return <div key="app-secured">{children}</div>;
}
