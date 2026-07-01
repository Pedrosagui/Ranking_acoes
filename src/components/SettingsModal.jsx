// src/components/SettingsModal.jsx
import { useState, useEffect } from 'react';
import { useStocks } from '../context/StockContext';

export default function SettingsModal({ onClose }) {
  const { apiToken, saveToken, checkToken, resetData, syncAll } = useStocks();
  const [tokenInput, setTokenInput] = useState(apiToken || '');
  const [validating, setValidating] = useState(false);
  const [tokenStatus, setTokenStatus] = useState(null); // 'valid' | 'invalid' | null
  const [resetting, setResetting] = useState(false);

  // Fecha ao pressionar Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  async function handleValidate() {
    if (!tokenInput.trim()) return;
    setValidating(true);
    setTokenStatus(null);
    const valid = await checkToken(tokenInput.trim());
    setTokenStatus(valid ? 'valid' : 'invalid');
    setValidating(false);
  }

  async function handleSave() {
    await saveToken(tokenInput.trim());
    onClose();
  }

  async function handleReset() {
    if (!window.confirm('Isso apagará todos os dados salvos. Continuar?')) return;
    setResetting(true);
    await resetData();
    setResetting(false);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">⚙️ Configurações</h2>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        {/* Token Brapi */}
        <div className="modal-section">
          <h3 className="modal-section-title">🔑 Token da API Brapi</h3>
          <p className="modal-description">
            A Brapi oferece um token gratuito para consultas a dados da B3.
            Este token é estritamente necessário para buscar os dados reais das ações.
          </p>
          <a
            href="https://brapi.dev/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="modal-link"
          >
            → Obter token gratuito em brapi.dev/dashboard
          </a>

          <div className="token-input-row">
            <input
              type="password"
              className={`modal-input ${tokenStatus === 'valid' ? 'input-valid' : tokenStatus === 'invalid' ? 'input-invalid' : ''}`}
              placeholder="Cole seu token aqui..."
              value={tokenInput}
              onChange={e => { setTokenInput(e.target.value); setTokenStatus(null); }}
            />
            <button
              className="btn btn-ghost"
              onClick={handleValidate}
              disabled={validating || !tokenInput.trim()}
            >
              {validating ? '...' : 'Testar'}
            </button>
          </div>

          {tokenStatus === 'valid' && (
            <p className="status-msg status-ok">✅ Token válido! Pronto para sincronizar dados reais.</p>
          )}
          {tokenStatus === 'invalid' && (
            <p className="status-msg status-err">❌ Token inválido. Verifique e tente novamente.</p>
          )}
        </div>

        {/* Dados */}
        <div className="modal-section">
          <h3 className="modal-section-title">🗃️ Dados Locais</h3>
          <p className="modal-description">
            Todos os dados são armazenados localmente no seu navegador (IndexedDB).
            Nenhum dado é enviado para servidores externos além da API Brapi.
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button
              className="btn btn-primary"
              onClick={() => { syncAll(); onClose(); }}
            >
              🔄 Sincronizar Agora
            </button>
            <button
              className="btn btn-danger"
              onClick={handleReset}
              disabled={resetting}
            >
              {resetting ? 'Limpando...' : '🗑️ Limpar Todos os Dados'}
            </button>
          </div>
        </div>

        {/* Como funciona */}
        <div className="modal-section modal-info">
          <h3 className="modal-section-title">ℹ️ Como funciona</h3>
          <ul className="modal-list">
            <li>📦 O histórico de dividendos (10 anos) está <strong>embutido no app</strong> — nenhuma chamada de API necessária</li>
            <li>🌐 A API Brapi busca apenas dados atuais: <strong>cotação, LPA, VPA e ROE</strong></li>
            <li>💾 Dados são persistidos no <strong>IndexedDB</strong> do seu navegador</li>
            <li>🔄 Sincronize diariamente para ter os dados mais atuais</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave}>
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
}
