import React, { useState } from 'react';
import { useStocks } from '../context/StockContext';
import SyncProgressBar from './SyncProgressBar';
import SettingsModal from './SettingsModal';
import StockDetail from './StockDetail';

function LoadingState() {
  return (
    <div className="center-content">
      <div className="loading-spinner-large"></div>
      <p style={{ marginTop: '16px' }}>Carregando dados locais...</p>
    </div>
  );
}

function EmptyState({ onSync }) {
  return (
    <div className="center-content">
      <h2>Bem-vindo ao ValorB3</h2>
      <p style={{ margin: '16px 0', maxWidth: '400px' }}>
        Clique para carregar e ranquear os principais ativos da B3 
        automaticamente com cotações em tempo real.
      </p>
      <button className="btn btn-primary" onClick={onSync}>
        Sincronizar Dados Reais
      </button>
    </div>
  );
}

function Top10Chart({ stocks }) {
  const top10 = stocks.slice(0, 10);
  
  return (
    <div className="top-10-section">
      <h3 className="top-10-title">Top 10 — Ranking Valuation</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        {top10.map((stock, i) => (
          <div key={stock.ticker} style={{ padding: '12px', border: '1px solid var(--border-light)', borderRadius: '6px', background: 'var(--bg-base)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong>#{i + 1} {stock.ticker}</strong>
              <span className="text-green">{stock.score} pts</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              <div>Cot: R$ {stock.cotacaoAtual?.toFixed(2)}</div>
              <div>Margem G: {stock.margemGraham?.toFixed(1)}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { filteredStocks, stocks, isLoading, isSyncing, error } = useStocks();
  const [showSettings, setShowSettings] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);

  if (isLoading || (isSyncing && stocks.length === 0)) return <LoadingState />;

  return (
    <div className="app-container">
      <header className="header">
        <h1>Aegis</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={() => setShowSettings(true)}>
            Configurações
          </button>
        </div>
      </header>

      {error && (
        <div style={{ background: '#ff444420', color: '#ff4444', padding: '12px', margin: '16px', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {isSyncing && stocks.length > 0 && <SyncProgressBar />}

      {filteredStocks.length > 0 && <Top10Chart stocks={filteredStocks} />}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Ticker</th>
              <th>Cotação</th>
              <th>LPA</th>
              <th>VPA</th>
              <th>ROE</th>
              <th>Margem Graham</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {filteredStocks.map((stock, index) => (
              <tr key={stock.ticker} onClick={() => setSelectedStock(stock)}>
                <td>#{index + 1}</td>
                <td className="ticker-name">{stock.ticker}</td>
                <td>R$ {stock.cotacaoAtual?.toFixed(2) || 'N/A'}</td>
                <td>R$ {stock.lpa?.toFixed(2) || 'N/A'}</td>
                <td>R$ {stock.vpa?.toFixed(2) || 'N/A'}</td>
                <td>{stock.roe?.toFixed(1) || 'N/A'}%</td>
                <td className={stock.margemGraham > 0 ? 'text-green' : 'text-red'}>
                  {stock.margemGraham?.toFixed(1) || 'N/A'}%
                </td>
                <td style={{ fontWeight: 'bold' }}>{stock.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      
      {selectedStock && (
        <StockDetail 
          stock={selectedStock} 
          onClose={() => setSelectedStock(null)} 
        />
      )}
    </div>
  );
}
