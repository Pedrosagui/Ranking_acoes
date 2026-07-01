import React from 'react';

export default function FIIDetail({ fii, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{width: 48, height: 48, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)', border: '1px solid var(--border-light)'}}>
              {fii.ticker ? fii.ticker.charAt(0) : '?'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 className="modal-title" style={{ margin: 0, fontSize: '24px' }}>{fii.ticker}</h2>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{fii.nome}</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} style={{ alignSelf: 'flex-start', fontSize: '24px' }}>&times;</button>
        </div>

        <div className="stock-detail-top" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div className="metric-card" style={{ background: 'var(--bg-app)', border: 'none' }}>
            <div className="metric-title">Score Final</div>
            <div className="metric-value" style={{ color: '#8A2BE2' }}>
              {fii.scoreComposto} <span style={{fontSize:'12px', fontWeight:400}}>pts</span>
            </div>
          </div>
          <div className="metric-card" style={{ background: 'var(--bg-app)', border: 'none' }}>
            <div className="metric-title">Div. Yield Anualizado</div>
            <div className="metric-value text-green">
              {fii.divYield?.toFixed(1)}%
            </div>
          </div>
          <div className="metric-card" style={{ background: 'var(--bg-app)', border: 'none' }}>
            <div className="metric-title">P/VP</div>
            <div className={`metric-value ${fii.pvp < 1 ? 'text-green' : 'text-red'}`}>
              {fii.pvp?.toFixed(2)}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          <div style={{ background: 'var(--bg-app)', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 20px 0', color: 'var(--text-primary)' }}>Fundamentos do FII</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Segmento</span>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>{fii.segmento}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Gestora</span>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>{fii.gestora}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Nº Cotistas</span>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>{fii.numCotistas?.toLocaleString('pt-BR')}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Liquidez Diária (R$)</span>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>R$ {(fii.volumeDiario/1000000).toFixed(1)}M</span>
              </div>

            </div>
          </div>

          <div style={{ background: 'var(--bg-app)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Análise dos Pilares</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '12px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Proventos (40%)</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Constância e Yield</div>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>{fii.detalhePilares?.proventos}/100</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '12px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Desconto P/VP (30%)</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Margem de segurança</div>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>{fii.detalhePilares?.descontoPVP}/100</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '12px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Qualidade (20%)</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Resiliência do setor</div>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>{fii.detalhePilares?.qualidade}/100</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '12px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Liquidez (10%)</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Volume financeiro neg.</div>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>{fii.detalhePilares?.liquidez}/100</div>
                </div>

              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
