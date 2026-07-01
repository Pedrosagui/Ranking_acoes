import React, { useState } from 'react';
import { useStocks } from '../context/StockContext';
import SyncProgressBar from './SyncProgressBar';
import StockDetail from './StockDetail';
import { rankPiotroskiGraham, rankTechPegRatio } from '../utils/valuation';

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

export default function Dashboard() {
  const { filteredStocks, stocks, isLoading, isSyncing, error } = useStocks();
  const [activeTab, setActiveTab] = useState('graham_bazin');
  const [selectedStock, setSelectedStock] = useState(null);

  if (isLoading || (isSyncing && stocks.length === 0)) return <LoadingState />;

  const piotroskiStocks = rankPiotroskiGraham(stocks);
  const techPegStocks = rankTechPegRatio(stocks);

  const renderGrahamBazin = () => (
    <>
      {filteredStocks.length > 0 && <Top10Chart stocks={filteredStocks} title="Top 10 — Ranking Valuation" scoreField="score" />}
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
                  {stock.margemGraham?.toFixed(1)}%
                </td>
                <td style={{ fontWeight: 'bold' }}>{stock.score}</td>
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
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Ticker</th>
              <th>Cotação</th>
              <th>Margem Graham</th>
              <th>F-Score (0-9)</th>
            </tr>
          </thead>
          <tbody>
            {piotroskiStocks.map((stock, index) => (
              <tr key={stock.ticker} onClick={() => setSelectedStock(stock)}>
                <td>#{index + 1}</td>
                <td className="ticker-name">{stock.ticker}</td>
                <td>R$ {stock.cotacaoAtual?.toFixed(2) || 'N/A'}</td>
                <td className={stock.margemGraham > 0 ? 'text-green' : 'text-red'}>
                  {stock.margemGraham?.toFixed(1)}%
                </td>
                <td style={{ fontWeight: 'bold', color: stock.fScore >= 7 ? 'var(--text-green)' : 'inherit' }}>
                  {stock.fScore}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderPegRatio = () => (
    <>
      {techPegStocks.length > 0 && <Top10Chart stocks={techPegStocks} title="Top 10 — PEG Ratio Tech" scoreField="pegRatio" scoreSuffix="PEG" />}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Ticker</th>
              <th>Setor</th>
              <th>P/L</th>
              <th>Cresc. Rec 5a</th>
              <th>PEG Ratio</th>
            </tr>
          </thead>
          <tbody>
            {techPegStocks.map((stock, index) => (
              <tr key={stock.ticker} onClick={() => setSelectedStock(stock)}>
                <td>#{index + 1}</td>
                <td className="ticker-name">{stock.ticker}</td>
                <td>{stock.setor}</td>
                <td>{stock.pl?.toFixed(2)}</td>
                <td>{stock.crescRec5a?.toFixed(1)}%</td>
                <td style={{ fontWeight: 'bold' }}>{stock.pegRatio?.toFixed(2)}</td>
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

      <div style={{ display: 'flex', gap: '8px', margin: '0 16px 16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
        <button 
          className={`btn ${activeTab === 'graham_bazin' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('graham_bazin')}
        >
          Ranking Graham & Bazin
        </button>
        <button 
          className={`btn ${activeTab === 'piotroski' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('piotroski')}
        >
          Graham + Piotroski
        </button>
        <button 
          className={`btn ${activeTab === 'peg_tech' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('peg_tech')}
        >
          PEG Ratio (Tech)
        </button>
      </div>

      {activeTab === 'graham_bazin' && renderGrahamBazin()}
      {activeTab === 'piotroski' && renderPiotroski()}
      {activeTab === 'peg_tech' && renderPegRatio()}

      {selectedStock && (
        <StockDetail 
          stock={selectedStock} 
          onClose={() => setSelectedStock(null)} 
        />
      )}
    </div>
  );
}
