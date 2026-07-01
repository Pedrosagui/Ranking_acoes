import React, { useState } from 'react';
import { useETFs } from '../../context/ETFContext';
import ETFDetail from './ETFDetail';

const ITEMS_PER_PAGE = 20;

export default function ETFTable() {
  const { filteredETFs, isLoading } = useETFs();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedETF, setSelectedETF] = useState(null);

  if (isLoading) {
    return <div className="loading-screen" style={{padding: '40px 0'}}>Carregando ETFs...</div>;
  }

  const totalPages = Math.ceil(filteredETFs.length / ITEMS_PER_PAGE);
  const currentData = filteredETFs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <>
      <div className="table-container desktop-only">
        <table className="valuation-table">
          <thead>
            <tr>
              <th>Posição</th>
              <th>ETF</th>
              <th>Benchmark</th>
              <th>Taxa Adm.</th>
              <th>Retorno (12M)</th>
              <th>Liquidez</th>
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
                <td>{etf.taxaAdm?.toFixed(2)}%</td>
                <td className={etf.retorno12m >= 0 ? 'text-green' : 'text-red'}>
                  {etf.retorno12m >= 0 ? '+' : ''}{(etf.retorno12m || 0).toFixed(1)}%
                </td>
                <td>{Math.round(etf.volumeDiario / 1000000)}M</td>
                <td>
                  <div className="score-badge">
                    <span className="score-value">{etf.scoreComposto}</span>
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
