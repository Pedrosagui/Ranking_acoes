import React, { useState } from 'react';
import { useStocks } from '../context/StockContext';
import SyncProgressBar from './SyncProgressBar';
import StockDetail from './StockDetail';
import { rankPiotroskiGraham } from '../utils/valuation';

function LoadingState() {
  return (
    <div className="center-content">
      <div className="loading-spinner-large"></div>
      <p style={{ marginTop: '16px' }}>Carregando dados locais...</p>
    </div>
  );
}

function Top10Chart({ stocks, title, scoreField, scoreSuffix = 'pts' }) {
  const top10 = stocks.slice(0, 10);
  
  return (
    <div className="top-10-section">
      <h3 className="top-10-title">{title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        {top10.map((stock, i) => (
          <div key={stock.ticker} style={{ padding: '12px', border: '1px solid var(--border-light)', borderRadius: '6px', background: 'var(--bg-base)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong>#{i + 1} {stock.ticker}</strong>
              <span className="text-green">{stock[scoreField]} {scoreSuffix}</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              <div>Cot: R$ {stock.cotacaoAtual?.toFixed(2)}</div>
              <div>Setor: {stock.setor?.substring(0, 15)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StockLogo({ ticker }) {
  const letter = ticker.charAt(0).toUpperCase();
  const colors = ['#e53935', '#d81b60', '#8e24aa', '#5e35b1', '#3949ab', '#1e88e5', '#039be5', '#00acc1', '#00897b', '#43a047', '#f4511e'];
  const colorIndex = ticker.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];
  
  return (
    <div style={{ 
      width: '28px', height: '28px', borderRadius: '50%', 
      backgroundColor: bgColor, color: 'white', 
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 'bold', fontSize: '14px', flexShrink: 0
    }}>
      {letter}
    </div>
  );
}

export default function Dashboard() {
  const { filteredStocks, stocks, isLoading, isSyncing, error, activeProfile, setProfile } = useStocks();
  const [activeTab, setActiveTab] = useState('graham_bazin');
  const [selectedStock, setSelectedStock] = useState(null);

  if (isLoading || (isSyncing && stocks.length === 0)) return <LoadingState />;

  const piotroskiStocks = rankPiotroskiGraham(stocks);

  const renderGrahamBazin = () => (
    <>
      {filteredStocks.length > 0 && <Top10Chart stocks={filteredStocks} title={`Top 10 — Ranking ${PERFIS_SCORE[activeProfile]?.label || 'Valuation'}`} scoreField="scoreComposto" scoreSuffix="pts" />}
      <div className="table-container">
        <table className="valuation-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Ticker</th>
              <th>Cotação</th>
              <th>Dividend<br/>Yield</th>
              <th>P/L</th>
              <th>Margem<br/>Líquida</th>
              <th>ROE</th>
              <th>Dív. Bruta /<br/>Patrim.</th>
              <th style={{ backgroundColor: '#fceb8d', color: '#333' }}>Valuation<br/>Bazin</th>
              <th style={{ backgroundColor: '#8bbcf6', color: '#333' }}>Valuation<br/>Graham</th>
              <th style={{ backgroundColor: '#f18a70', color: '#fff' }}>Score<br/>Final</th>
            </tr>
          </thead>
          <tbody>
            {filteredStocks.map((stock, index) => (
              <tr key={stock.ticker} onClick={() => setSelectedStock(stock)}>
                <td style={{ color: index < 3 ? 'var(--text-yellow)' : 'inherit' }}>
                  {index < 3 ? '★' : ''} #{index + 1}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <StockLogo ticker={stock.ticker} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--text-blue, #64a1ff)' }}>{stock.ticker}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{stock.empresa?.substring(0, 15)}</span>
                    </div>
                  </div>
                </td>
                <td>R$ {stock.cotacaoAtual?.toFixed(2) || 'N/A'}</td>
                <td>{stock.divYield?.toFixed(1) || '0.0'}%</td>
                <td>{stock.pl?.toFixed(2) || 'N/A'}</td>
                <td>{stock.margemLiquida?.toFixed(1) || '0.0'}%</td>
                <td>{stock.roe?.toFixed(1) || 'N/A'}%</td>
                <td>{stock.divBrutaPatrim?.toFixed(2) || 'N/A'}</td>
                
                <td style={{ backgroundColor: '#fceb8d20', color: '#fceb8d' }}>
                  R$ {stock.precoTetoBazin?.toFixed(2) || '0.00'}
                </td>
                <td style={{ backgroundColor: '#8bbcf620', color: '#8bbcf6' }}>
                  R$ {stock.precoJustoGraham?.toFixed(2) || '0.00'}
                </td>
                <td style={{ backgroundColor: '#f18a7020', color: '#f18a70', fontWeight: 'bold' }}>
                  {stock.scoreComposto}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderPiotroski = () => (
    <>
      {piotroskiStocks.length > 0 && <Top10Chart stocks={piotroskiStocks} title="Top 10 — Graham + Piotroski" scoreField="fScore" scoreSuffix="F-Score" />}
      <div className="table-container">
        <table className="valuation-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Ticker</th>
              <th>Cotação</th>
              <th>ROE</th>
              <th>Liq. Corr.</th>
              <th>Dív. Bruta /<br/>Patrim.</th>
              <th style={{ backgroundColor: '#8bbcf6', color: '#333' }}>Valuation<br/>Graham</th>
              <th style={{ backgroundColor: '#4caf50', color: '#fff' }}>Piotroski<br/>F-Score</th>
            </tr>
          </thead>
          <tbody>
            {piotroskiStocks.map((stock, index) => (
              <tr key={stock.ticker} onClick={() => setSelectedStock(stock)}>
                <td style={{ color: index < 3 ? 'var(--text-yellow)' : 'inherit' }}>
                  {index < 3 ? '★' : ''} #{index + 1}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <StockLogo ticker={stock.ticker} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--text-blue, #64a1ff)' }}>{stock.ticker}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{stock.empresa?.substring(0, 15)}</span>
                    </div>
                  </div>
                </td>
                <td>R$ {stock.cotacaoAtual?.toFixed(2) || 'N/A'}</td>
                <td>{stock.roe?.toFixed(1) || 'N/A'}%</td>
                <td>{stock.liqCorr?.toFixed(2) || 'N/A'}</td>
                <td>{stock.divBrutaPatrim?.toFixed(2) || 'N/A'}</td>
                
                <td style={{ backgroundColor: '#8bbcf620', color: '#8bbcf6' }}>
                  R$ {stock.precoJustoGraham?.toFixed(2) || '0.00'}
                </td>
                <td style={{ backgroundColor: '#4caf5020', color: '#4caf50', fontWeight: 'bold' }}>
                  {stock.fScore} / 9
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <div className="app-container">
      <header className="header">
        <h1>Aegis</h1>
      </header>

      {error && (
        <div style={{ background: '#ff444420', color: '#ff4444', padding: '12px', margin: '16px', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {isSyncing && stocks.length > 0 && <SyncProgressBar />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 16px 16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`btn ${activeTab === 'graham_bazin' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('graham_bazin')}
          >
            Ranking Compostos
          </button>
          <button 
            className={`btn ${activeTab === 'piotroski' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('piotroski')}
          >
            Graham + Piotroski
          </button>
        </div>

        {activeTab === 'graham_bazin' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Perfil:</span>
            <select 
              value={activeProfile} 
              onChange={(e) => setProfile(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '4px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
            >
              {Object.entries(PERFIS_SCORE).map(([key, perfil]) => (
                <option key={key} value={key}>{perfil.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {activeTab === 'graham_bazin' && renderGrahamBazin()}
      {activeTab === 'piotroski' && renderPiotroski()}

      {selectedStock && (
        <StockDetail 
          stock={selectedStock} 
          onClose={() => setSelectedStock(null)} 
        />
      )}
    </div>
  );
}
