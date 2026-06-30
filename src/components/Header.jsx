// src/components/Header.jsx
import { useState } from 'react';
import { useStocks } from '../context/StockContext';
import SettingsModal from './SettingsModal';

function formatDate(iso) {
  if (!iso) return null;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

export default function Header() {
  const { syncAll, isSyncing, lastSync, stocks, apiToken } = useStocks();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <header className="header">
        <div className="header-inner">
          {/* Logo */}
          <div className="header-brand">
            <div className="brand-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
            </div>
            <div>
              <h1 className="brand-title">ValorB3</h1>
              <p className="brand-subtitle">Ranking de Valuation · B3</p>
            </div>
          </div>

          {/* Stats rápidos */}
          <div className="header-stats">
            <div className="stat-pill">
              <span className="stat-label">Ativos</span>
              <span className="stat-value">{stocks.length}</span>
            </div>
            <div className="stat-pill">
              <span className="stat-label">Oportunidades</span>
              <span className="stat-value stat-green">
                {stocks.filter(s => s.margemBazin > 0 && s.margemGraham > 0).length}
              </span>
            </div>
            {lastSync && (
              <div className="stat-pill hidden-mobile">
                <span className="stat-label">Atualizado</span>
                <span className="stat-value stat-muted">{formatDate(lastSync)}</span>
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="header-actions">
            {!apiToken && (
              <span className="badge-demo">MODO DEMO</span>
            )}
            <button
              className="btn btn-secondary"
              onClick={() => setShowSettings(true)}
              title="Configurações"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span className="hidden-mobile">Configurações</span>
            </button>

            <button
              className={`btn btn-primary ${isSyncing ? 'btn-loading' : ''}`}
              onClick={syncAll}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <>
                  <span className="spinner" />
                  <span>Sincronizando...</span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon">
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  <span>Sincronizar {stocks.length === 0 ? 'Todos os Ativos' : 'Dados'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}
