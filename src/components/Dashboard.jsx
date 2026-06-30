// src/components/Dashboard.jsx
import { useState } from 'react';
import { useStocks } from '../context/StockContext';
import StockCard from './StockCard';
import ValuationChart from './ValuationChart';
import FilterBar from './FilterBar';
import SyncProgressBar from './SyncProgressBar';
import SettingsModal from './SettingsModal';

function EmptyState({ onSync }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">📊</div>
      <h2 className="empty-title">Bem-vindo ao ValorB3</h2>
      <p className="empty-description">
        Clique em <strong>Sincronizar Todos os Ativos</strong> para carregar e ranquear
        os principais ativos da B3 automaticamente.
      </p>
      <p className="empty-hint">
        💡 Funciona sem API key no modo demonstração com dados realistas
      </p>
      <button className="btn btn-primary btn-large" onClick={onSync}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon">
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
        Sincronizar Todos os Ativos (~150 da B3)
      </button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="loading-state">
      <div className="loading-spinner-large" />
      <p>Carregando dados...</p>
    </div>
  );
}

function TokenBanner({ onOpenSettings }) {
  return (
    <div className="token-banner">
      <div className="token-banner-content">
        <span className="token-banner-icon">🔑</span>
        <div className="token-banner-text">
          <strong>Dados podem estar imprecisos.</strong> Configure seu token gratuito da{' '}
          <a href="https://brapi.dev/dashboard" target="_blank" rel="noopener noreferrer">Brapi</a>{' '}
          para obter cotações em tempo real.
        </div>
        <button className="btn btn-ghost" onClick={onOpenSettings}>
          Configurar Token
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { filteredStocks, stocks, isLoading, isSyncing, error, syncAll, apiToken } = useStocks();
  const [showSettings, setShowSettings] = useState(false);

  if (isLoading) return <LoadingState />;
  if (stocks.length === 0 && !isSyncing) return <EmptyState onSync={syncAll} />;

  return (
    <main className="dashboard">
      {/* Banner de aviso se não tem token */}
      {!apiToken && stocks.length > 0 && (
        <TokenBanner onOpenSettings={() => setShowSettings(true)} />
      )}

      {/* Barra de progresso do sync */}
      <SyncProgressBar />

      {/* Mensagem de erro */}
      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

      {/* Gráfico Top 5 */}
      {stocks.length > 0 && <ValuationChart />}

      {/* Filtros */}
      <FilterBar />

      {/* Grid de cards */}
      {filteredStocks.length > 0 ? (
        <div className="cards-grid">
          {filteredStocks.map(stock => (
            <StockCard key={stock.ticker} stock={stock} />
          ))}
        </div>
      ) : (
        <div className="no-results">
          <p>Nenhum ativo encontrado com os filtros atuais.</p>
        </div>
      )}

      {/* Loading overlay durante sync progressivo */}
      {isSyncing && stocks.length === 0 && (
        <div className="sync-loading-overlay">
          <div className="loading-spinner-large" />
          <p>Iniciando sincronização...</p>
        </div>
      )}

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </main>
  );
}
