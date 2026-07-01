import React, { useState } from 'react';
import { useFIIs } from '../../context/FIIContext';
import FIIDetail from './FIIDetail';

const ITEMS_PER_PAGE = 20;

export default function FIITable() {
  const { filteredFIIs, isLoading } = useFIIs();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFII, setSelectedFII] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (isLoading) {
    return <div className="loading-screen" style={{padding: '40px 0'}}>Carregando FIIs...</div>;
  }

  const searchedFIIs = filteredFIIs.filter(fii => 
    fii.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (fii.nome && fii.nome.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(searchedFIIs.length / ITEMS_PER_PAGE);
  const currentData = searchedFIIs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const renderMobileCard = (fii) => {
    const percent = Math.min(100, Math.max(0, Math.round(fii.scoreComposto)));
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
      <div className="mobile-card" onClick={() => setSelectedFII(fii)} key={fii.ticker}>
        <div className="mobile-card-indicator" style={{ backgroundColor: dotColor }}></div>
        <div className="mobile-card-content">
          <div className="mobile-card-header">
            <span className="mobile-card-title" style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: fii.posicao <= 3 ? 'var(--yellow)' : 'inherit', marginRight: '6px' }}>{fii.posicao <= 3 ? '★ ' : ''}#{fii.posicao}</span> 
              <div style={{width: 20, height: 20, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px', fontSize: '10px', fontWeight: 'bold', color: 'var(--text-primary)', border: '1px solid var(--border-light)'}}>{fii.ticker ? fii.ticker.charAt(0) : '?'}</div>
              {fii.ticker}
            </span>
            <span className="mobile-card-price">R$ {fii.cotacaoAtual?.toFixed(2) || '---'}</span>
          </div>
          <div className="mobile-card-subtitle">{fii.nome?.substring(0, 25)}</div>
          
          <div className="mobile-card-score-row">
            <div className="mobile-card-score-value">
              {fii.scoreComposto} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>score</span>
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
              <span className={`mobile-card-stat-value ${(fii.retornoDiario || 0) >= 0 ? 'text-green' : 'text-red'}`}>
                {(fii.retornoDiario || 0) >= 0 ? '+' : ''}{(fii.retornoDiario || 0).toFixed(2)}%
              </span>
            </div>
            <div className="mobile-card-stat">
              <span className="mobile-card-stat-label">Ret. 12M</span>
              <span className={`mobile-card-stat-value ${(fii.retorno12m || 0) >= 0 ? 'text-green' : 'text-red'}`}>
                {(fii.retorno12m || 0) >= 0 ? '+' : ''}{(fii.retorno12m || 0).toFixed(1)}%
              </span>
            </div>
            <div className="mobile-card-stat">
              <span className="mobile-card-stat-label">Div. Yield</span>
              <span className="mobile-card-stat-value text-green">{(fii.divYield || 0).toFixed(1)}%</span>
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
          placeholder="Buscar por Ticker ou Nome do FII..." 
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
              <th>FII</th>
              <th>Segmento</th>
              <th>Cotação / P/VP</th>
              <th>Retorno Diário</th>
              <th>Retorno (12M)</th>
              <th>Div. Yield (12M)</th>
              <th>Liquidez</th>
              <th>Score (100)</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((fii) => (
              <tr key={fii.ticker} onClick={() => setSelectedFII(fii)} style={{ cursor: 'pointer' }}>
                <td style={{ fontWeight: 600, color: fii.posicao <= 3 ? 'var(--yellow)' : 'inherit' }}>
                  {fii.posicao <= 3 ? '★ ' : ''}#{fii.posicao}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{width: 24, height: 24, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', border: '1px solid var(--border-light)'}}>
                      {fii.ticker.charAt(0)}
                    </div>
                    <div>
                      <strong style={{ display: 'block' }}>{fii.ticker}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{fii.nome.substring(0,20)}</span>
                    </div>
                  </div>
                </td>
                <td>{fii.segmento}</td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600 }}>R$ {fii.cotacaoAtual?.toFixed(2) || '---'}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>P/VP: {fii.pvp?.toFixed(2) || '---'}</span>
                  </div>
                </td>
                <td className={(fii.retornoDiario || 0) >= 0 ? 'text-green' : 'text-red'}>
                  {(fii.retornoDiario || 0) >= 0 ? '+' : ''}{(fii.retornoDiario || 0).toFixed(2)}%
                </td>
                <td className={(fii.retorno12m || 0) >= 0 ? 'text-green' : 'text-red'}>
                  {(fii.retorno12m || 0) >= 0 ? '+' : ''}{(fii.retorno12m || 0).toFixed(1)}%
                </td>
                <td className="text-green">{(fii.divYield || 0).toFixed(1)}%</td>
                <td>{Math.round(fii.volumeDiario / 1000)}k</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className={`status-dot ${fii.scoreComposto > 70 ? 'status-green' : fii.scoreComposto > 40 ? 'status-yellow' : 'status-red'}`}></span>
                    <span style={{ fontWeight: 600 }}>{fii.scoreComposto}</span>
                  </div>
                </td>
              </tr>
            ))}
            {currentData.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  Nenhum FII encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mobile-card-list mobile-only">
        {currentData.map((fii) => renderMobileCard(fii))}
        {currentData.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            Nenhum FII encontrado.
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

      {selectedFII && (
        <FIIDetail fii={selectedFII} onClose={() => setSelectedFII(null)} />
      )}
    </>
  );
}
