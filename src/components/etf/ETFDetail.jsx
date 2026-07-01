import React from 'react';

export default function ETFDetail({ etf, onClose }) {
  const alpha = (etf.retorno12m - etf.retornoBenchmark12m) || 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{width: 48, height: 48, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)', border: '1px solid var(--border-light)'}}>
              {etf.ticker ? etf.ticker.charAt(0) : '?'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 className="modal-title" style={{ margin: 0, fontSize: '24px' }}>{etf.ticker}</h2>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{etf.nome}</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} style={{ alignSelf: 'flex-start', fontSize: '24px' }}>&times;</button>
        </div>

        <div className="stock-detail-top" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div className="metric-card" style={{ background: 'var(--bg-app)', border: 'none' }}>
            <div className="metric-title">Score Final</div>
            <div className="metric-value" style={{ color: '#8A2BE2' }}>
              {etf.scoreComposto} <span style={{fontSize:'12px', fontWeight:400}}>pts</span>
            </div>
          </div>
          <div className="metric-card" style={{ background: 'var(--bg-app)', border: 'none' }}>
            <div className="metric-title">Retorno (12M)</div>
            <div className={`metric-value ${etf.retorno12m >= 0 ? 'text-green' : 'text-red'}`}>
              {etf.retorno12m >= 0 ? '+' : ''}{etf.retorno12m?.toFixed(1)}%
            </div>
          </div>
          <div className="metric-card" style={{ background: 'var(--bg-app)', border: 'none' }}>
            <div className="metric-title">Alpha (vs Benchmark)</div>
            <div className={`metric-value ${alpha >= 0 ? 'text-green' : 'text-red'}`}>
              {alpha >= 0 ? '+' : ''}{alpha?.toFixed(2)}%
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          <div style={{ background: 'var(--bg-app)', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 20px 0', color: 'var(--text-primary)' }}>Fundamentos do ETF</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Benchmark Referência</span>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>{etf.benchmark}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Gestora</span>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>{etf.gestora}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Taxa de Administração</span>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>{etf.taxaAdm?.toFixed(2)}% a.a.</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Nº Ativos na Carteira</span>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>{etf.numAtivos}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Liquidez Diária (R$)</span>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>R$ {(etf.volumeDiario/1000000).toFixed(1)}M</span>
              </div>

            </div>
          </div>

          <div style={{ background: 'var(--bg-app)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Análise dos Pilares</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '12px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Performance (40%)</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Alpha + Índice Sharpe</div>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>{etf.detalhePilares?.performance}/100</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '12px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Custo (30%)</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Taxa de Adm. + Eficiência</div>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>{etf.detalhePilares?.custo}/100</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '12px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Liquidez (30%)</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Volume financeiro neg.</div>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>{etf.detalhePilares?.liquidez}/100</div>
                </div>

              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
