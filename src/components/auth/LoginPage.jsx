import { useState } from 'react';
import { loginWithGoogle, sendEmailOTP } from '../../services/authService';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGoogle() {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      // AuthContext detecta o login automaticamente via onAuthChange
    } catch (e) {
      setError('Erro ao entrar com Google. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleEmail(e) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      await sendEmailOTP(email);
      setSent(true);
    } catch (e) {
      setError('Erro ao enviar o link. Verifique o email e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-split-container">
      {/* Lado Esquerdo - Formulário */}
      <div className="login-left">
        <div className="login-header">
          <div className="login-logo-group">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span className="login-brand-name">Aegis Platform</span>
          </div>
        </div>

        <div className="login-form-wrapper">
          <h1 className="login-title">Bem-vindo de volta</h1>
          <p className="login-subtitle">Entre na sua conta para acessar o terminal</p>

          {!sent ? (
            <div className="login-methods">
              {/* Google Button */}
              <button
                className="btn-social"
                onClick={handleGoogle}
                disabled={loading}
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar com Google
              </button>

              <div className="login-divider">
                <span>Ou continue com</span>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmail} className="login-form-inner">
                <div className="input-group">
                  <label htmlFor="email">Endereço de email</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className="btn-login-submit"
                  disabled={loading || !email}
                >
                  {loading ? 'Enviando...' : 'Entrar com Email'}
                </button>
              </form>
              
              {error && <p className="login-error-msg">{error}</p>}
            </div>
          ) : (
            <div className="login-sent-state">
              <div className="sent-icon">📬</div>
              <h3>Verifique sua caixa de entrada</h3>
              <p>Enviamos um link mágico de acesso para <br/><strong>{email}</strong>.</p>
              <button
                className="btn-login-back"
                onClick={() => setSent(false)}
              >
                Voltar e usar outro email
              </button>
            </div>
          )}
        </div>

        <div className="login-footer">
          Ao fazer login, você concorda com nossos <a href="#">Termos de Serviço</a> e <a href="#">Política de Privacidade</a>.
        </div>
      </div>

      {/* Lado Direito - Imagem/Hero */}
      <div className="login-right">
        <div className="login-hero-container">
          <img src="/login-hero.png" alt="Aegis Platform - Valuation B3" className="login-hero-image" />
        </div>
      </div>
    </div>
  );
}
