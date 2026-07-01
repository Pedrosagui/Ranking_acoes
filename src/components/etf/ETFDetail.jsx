import React, { useMemo } from 'react';
import { useHistory } from '../../hooks/useHistory';
import { ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

function calcInvestmentSimulation(stockHistory, ibovHistory) {
  if (!stockHistory || stockHistory.length < 2) return { data: [], finalStock: 0, finalIbov: 0, finalCdi: 0 };
  
  // Pegamos os ultimos 25 pontos (24 meses de retorno)
  const recentStock = stockHistory.slice(-25);
  const cdiMonthlyReturn = 0.0085; // ~0.85%
  
  const simulationData = [];
  let currentStock = 100;
  let currentIbov = 100;
  let currentCdi = 100;

  // Initial Point
  simulationData.push({
    date: recentStock[0].date,
    stockValue: currentStock,
    ibovValue: currentIbov,
    cdiValue: currentCdi,
    originalStockPrice: recentStock[0].price
  });

  for (let i = 1; i < recentStock.length; i++) {
    const s1 = recentStock[i-1];
    const s2 = recentStock[i];
    const stockReturn = (s2.price - s1.price) / s1.price;
    currentStock = currentStock * (1 + stockReturn);
    
    // IBOV
    const i2 = ibovHistory.find(b => b.date.substring(0, 7) === s2.date.substring(0, 7));
    const i1 = ibovHistory.find(b => b.date.substring(0, 7) === s1.date.substring(0, 7));
    
    if (i2 && i1) {
       const ibovReturn = (i2.price - i1.price) / i1.price;
       currentIbov = currentIbov * (1 + ibovReturn);
    }
    
    currentCdi = currentCdi * (1 + cdiMonthlyReturn);
    
    simulationData.push({
      date: s2.date,
      stockValue: currentStock,
      ibovValue: currentIbov,
      cdiValue: currentCdi,
      originalStockPrice: s2.price
    });
  }

  return {
    data: simulationData,
    finalStock: currentStock,
    finalIbov: currentIbov,
    finalCdi: currentCdi
  };
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#242526', border: '1px solid #3A3B3C', padding: '12px', borderRadius: '8px', color: '#E4E6EB', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ margin: '4px 0', color: entry.color, display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
            <span>{entry.name}:</span>
            <span style={{ fontWeight: 'bold' }}>
              R$ {entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ETFDetail({ etf, onClose }) {
  const alpha = (etf.retorno12m - etf.retornoBenchmark12m) || 0;
  const { history } = useHistory(etf.ticker);
  const { history: ibovHistory } = useHistory('^BVSP');
  
  const simulation = useMemo(() => calcInvestmentSimulation(history, ibovHistory), [history, ibovHistory]);

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

        {simulation.data.length > 0 ? (
          <div style={{ marginBottom: '40px', background: 'var(--bg-app)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 8px 0' }}>Retorno Histórico (2 Anos)</h3>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Se você tivesse investido <strong>R$ 100,00</strong> há 2 anos, hoje você teria:
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>{etf.ticker}</span>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: '#8A2BE2' }}>R$ {simulation.finalStock.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>IBOV</span>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--green)' }}>R$ {simulation.finalIbov.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>CDI</span>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>R$ {simulation.finalCdi.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={simulation.data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="strokeGradientETF" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#8A2BE2" />
                      <stop offset="100%" stopColor="#4169E1" />
                    </linearGradient>
                    <linearGradient id="colorETF" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8A2BE2" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4169E1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" opacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={str => new Date(str).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })} 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                    domain={['dataMin - 10', 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  
                  <Line type="monotone" dataKey="cdiValue" name="100% CDI" stroke="var(--text-primary)" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={false} />
                  <Line type="monotone" dataKey="ibovValue" name="IBOVESPA" stroke="var(--green)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Area type="monotone" dataKey="stockValue" name={etf.ticker} stroke="url(#strokeGradientETF)" strokeWidth={3} fillOpacity={1} fill="url(#colorETF)" activeDot={{ r: 6, strokeWidth: 0, fill: '#8A2BE2' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="center-content" style={{ padding: '40px 0', background: 'var(--bg-app)', borderRadius: '16px', marginBottom: '40px' }}>
            Sem histórico suficiente (2 anos) para simular retorno.
          </div>
        )}

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
