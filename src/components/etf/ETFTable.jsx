import React, { useState } from 'react';
import { useETFs } from '../../context/ETFContext';
import ETFDetail from './ETFDetail';

const ITEMS_PER_PAGE = 20;

export default function ETFTable() {
  const { filteredETFs, isLoading } = useETFs();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedETF, setSelectedETF] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (isLoading) {
    return <div className="loading-screen" style={{padding: '40px 0'}}>Carregando ETFs...</div>;
  }

  const searchedETFs = filteredETFs.filter(etf => 
    etf.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (etf.nome && etf.nome.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(searchedETFs.length / ITEMS_PER_PAGE);
  const currentData = searchedETFs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const renderMobileCard = (etf) => {
    const percent = Math.min(100, Math.max(0, Math.round(etf.scoreComposto)));
    let dotColor = 'var(--yellow)';
    let gradient = 'linear-gradient(90deg, #F5A62340 0%, #F5A623 100%)';
    if (percent >= 70) {
      dotColor = 'var(--green)';
      gradient = 'linear-gradient(90deg, #16A34A40 0%, #16A34A 100%)';
    } else if (percent <= 40) {
      dotColor = 'var(--red)';
      gradient = 'linear-gradient(90deg, #E0000040 0%, #E00000 100%)';
    }

    return (
      <div className="mobile-card" onClick={() => setSelectedETF(etf)} key={etf.ticker}>
        <div className="mobile-card-indicator" style={{ backgroundColor: dotColor }}></div>
        <div className="mobile-card-content">
          <div className="mobile-card-header">
            <span className="mobile-card-title" style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: etf.posicao <= 3 ? 'var(--yellow)' : 'inherit', marginRight: '6px' }}>{etf.posicao <= 3 ? '★ ' : ''}#{etf.posicao}</span> 
              <div style={{width: 20, height: 20, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px', fontSize: '10px', fontWeight: 'bold', color: 'var(--text-primary)', border: '1px solid var(--border-light)'}}>{etf.ticker ? etf.ticker.charAt(0) : '?'}</div>
              {etf.ticker}
            </span>
            <span className="mobile-card-price">R$ {etf.cotacaoAtual?.toFixed(2) || '---'}</span>
          </div>
          <div className="mobile-card-subtitle">{etf.nome?.substring(0, 25)}</div>
          
          <div className="mobile-card-score-row">
            <div className="mobile-card-score-value">
              {etf.scoreComposto} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>score</span>
            </div>
            <div className="mobile-card-progress-track">
              <div className="mobile-card-progress-fill" style={{ width: `${percent}%`, background: gradient }}>
                <div className="mobile-card-progress-dot" style={{ backgroundColor: dotColor }}></div>
              </div>
            </div>
          </div>

          <div className="mobile-card-stats">
            <div className="mobile-card-stat">
              <span className="mobile-card-stat-label">Ret. Dia</span>
              <span className={`mobile-card-stat-value ${(etf.retornoDiario || 0) >= 0 ? 'text-green' : 'text-red'}`}>
                {(etf.retornoDiario || 0) >= 0 ? '+' : ''}{(etf.retornoDiario || 0).toFixed(2)}%
              </span>
            </div>
            <div className="mobile-card-stat">
              <span className="mobile-card-stat-label">Ret. 12M</span>
              <span className={`mobile-card-stat-value ${(etf.retorno12m || 0) >= 0 ? 'text-green' : 'text-red'}`}>
                {(etf.retorno12m || 0) >= 0 ? '+' : ''}{(etf.retorno12m || 0).toFixed(1)}%
              </span>
            </div>
            <div className="mobile-card-stat">
              <span className="mobile-card-stat-label">Taxa Adm</span>
              <span className="mobile-card-stat-value">{etf.taxaAdm?.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <input 
          type="search" 
          className="search-input" 
          placeholder="Buscar por Ticker ou Nome do ETF..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none' }}
        />
      </div>

      <div className="table-container desktop-only">
        <table className="valuation-table">
          <thead>
            <tr>
              <th>Posição</th>
              <th>ETF</th>
              <th>Benchmark</th>
              <th>Cotação Atual</th>
              <th>Retorno Diário</th>
              <th>Retorno (12M)</th>
              <th>Taxa Adm.</th>
              <th>Score (100)</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((etf) => (
              <tr key={etf.ticker} onClick={() => setSelectedETF(etf)} style={{ cursor: 'pointer' }}>
                <td style={{ fontWeight: 600, color: etf.posicao <= 3 ? 'var(--yellow)' : 'inherit' }}>
                  {etf.posicao <= 3 ? '★ ' : ''}#{etf.posicao}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{width: 24, height: 24, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', border: '1px solid var(--border-light)'}}>
                      {etf.ticker.charAt(0)}
                    </div>
                    <div>
                      <strong style={{ display: 'block' }}>{etf.ticker}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{etf.nome.substring(0,20)}</span>
                    </div>
                  </div>
                </td>
                <td>{etf.benchmark}</td>
                <td style={{ fontWeight: 600 }}>R$ {etf.cotacaoAtual?.toFixed(2) || '---'}</td>
                <td className={(etf.retornoDiario || 0) >= 0 ? 'text-green' : 'text-red'}>
                  {(etf.retornoDiario || 0) >= 0 ? '+' : ''}{(etf.retornoDiario || 0).toFixed(2)}%
                </td>
                <td className={(etf.retorno12m || 0) >= 0 ? 'text-green' : 'text-red'}>
                  {(etf.retorno12m || 0) >= 0 ? '+' : ''}{(etf.retorno12m || 0).toFixed(1)}%
                </td>
                <td style={{ color: 'var(--text-muted)' }}>{etf.taxaAdm?.toFixed(2)}%</td>
                <td>
                  <div className="score-badge" style={{
                    background: `conic-gradient(var(--yellow) ${etf.scoreComposto * 3.6}deg, var(--bg-app) 0deg)`,
                    border: 'none',
                    padding: '4px',
                    minWidth: '48px',
                    minHeight: '48px',
                    flexShrink: 0
                  }}>
                    <div style={{ 
                      background: 'var(--bg-surface)', 
                      width: '100%', 
                      height: '100%', 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                      <span className="score-value">{etf.scoreComposto}</span>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {currentData.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  Nenhum ETF encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mobile-card-list mobile-only">
        {currentData.map((etf) => renderMobileCard(etf))}
        {currentData.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            Nenhum ETF encontrado.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px', paddingBottom: '24px' }}>
          <button 
            className="btn btn-ghost"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </button>
          <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
            {currentPage} de {totalPages}
          </span>
          <button 
            className="btn btn-ghost"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Próxima
          </button>
        </div>
      )}

      {selectedETF && (
        <ETFDetail etf={selectedETF} onClose={() => setSelectedETF(null)} />
      )}
    </>
  );
}
