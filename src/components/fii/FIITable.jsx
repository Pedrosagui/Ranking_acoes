import React, { useState } from 'react';
import { useFIIs } from '../../context/FIIContext';
import FIIDetail from './FIIDetail';

const ITEMS_PER_PAGE = 20;

export default function FIITable() {
  const { filteredFIIs, isLoading } = useFIIs();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFII, setSelectedFII] = useState(null);

  if (isLoading) {
    return <div className="loading-screen" style={{padding: '40px 0'}}>Carregando FIIs...</div>;
  }

  const totalPages = Math.ceil(filteredFIIs.length / ITEMS_PER_PAGE);
  const currentData = filteredFIIs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <>
      <div className="table-container desktop-only">
        <table className="valuation-table">
          <thead>
            <tr>
              <th>Posição</th>
              <th>FII</th>
              <th>Segmento</th>
              <th>Cotação / P/VP</th>
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
                <td className="text-green">{(fii.divYield || 0).toFixed(1)}%</td>
                <td>{Math.round(fii.volumeDiario / 1000)}k</td>
                <td>
                  <div className="score-badge">
                    <span className="score-value">{fii.scoreComposto}</span>
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
