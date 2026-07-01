import React, { useMemo } from 'react';
import { getHistorico } from '../data/historico5anos';
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
    } else {
       // Se faltar ibov, assume 0% no mes
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
    const dateStr = new Date(label).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: 'var(--text-primary)' }}>{dateStr}</p>
        {payload.map(p => (
          <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }}></div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{p.name}:</span>
            <span style={{ fontWeight: 600, color: p.color }}>R$ {p.value.toFixed(2)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function StockDetail({ stock, onClose }) {
  const history = getHistorico(stock.ticker);
  const ibovHistory = getHistorico('^BVSP');
  
  const simulation = useMemo(() => calcInvestmentSimulation(history, ibovHistory), [history, ibovHistory]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {stock.logoUrl ? (
              <img src={stock.logoUrl} alt={stock.ticker} style={{width: 48, height: 48, borderRadius: '50%', objectFit: 'contain', background: 'white', border: '1px solid var(--border-light)'}} />
            ) : (
              <div style={{width: 48, height: 48, borderRadius: '50%', background: 'var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', color: 'var(--text-secondary)'}}>{stock.ticker ? stock.ticker.charAt(0) : '?'}</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 className="modal-title" style={{ margin: 0, fontSize: '24px' }}>{stock.ticker}</h2>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{stock.empresa}</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} style={{ alignSelf: 'flex-start', fontSize: '24px' }}>&times;</button>
        </div>

        <div className="stock-detail-top" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div className="metric-card" style={{ background: 'var(--bg-app)', border: 'none' }}>
            <div className="metric-title">Cotação Atual</div>
            <div className="metric-value">R$ {stock.cotacaoAtual?.toFixed(2)}</div>
          </div>
          <div className="metric-card" style={{ background: 'var(--bg-app)', border: 'none' }}>
            <div className="metric-title">Score Final</div>
            <div className="metric-value" style={{ color: 'var(--primary)' }}>{stock.scoreComposto || stock.score} <span style={{fontSize:'12px', fontWeight:400}}>pts</span></div>
          </div>
          <div className="metric-card" style={{ background: 'var(--bg-app)', border: 'none' }}>
            <div className="metric-title">Upside Graham</div>
            <div className={`metric-value ${stock.margemGraham > 0 ? 'text-green' : 'text-red'}`}>
              {stock.margemGraham > 0 ? '+' : ''}{stock.margemGraham?.toFixed(1)}%
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
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>{stock.ticker}</span>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary)' }}>R$ {simulation.finalStock.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>IBOV</span>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>R$ {simulation.finalIbov.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>CDI</span>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-muted)' }}>R$ {simulation.finalCdi.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={simulation.data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
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
                  <Area type="monotone" dataKey="stockValue" name={stock.ticker} stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorStock)" activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--primary)' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="center-content" style={{ padding: '40px 0', background: 'var(--bg-app)', borderRadius: '16px', marginBottom: '40px' }}>
            Sem histórico suficiente (2 anos) no Yahoo Finance para simular retorno.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          
          {/* Fundamentos Card */}
          <div style={{ background: 'var(--bg-app)', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 20px 0', color: 'var(--text-primary)' }}>Fundamentos Principais</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Div. Yield</span>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>{stock.divYield?.toFixed(1) || '0.0'}%</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>P/L</span>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>{stock.pl?.toFixed(2) || '0.00'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>ROE</span>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>{stock.roe?.toFixed(1) || '0.0'}%</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Margem Líquida</span>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>{stock.margemLiquida?.toFixed(1) || '0.0'}%</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>VPA (Valor Patrimonial)</span>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>R$ {stock.vpa?.toFixed(2) || '0.00'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>LPA (Lucro por Ação)</span>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>R$ {stock.lpa?.toFixed(2) || '0.00'}</span>
              </div>

            </div>
          </div>

          {/* Saúde e Valuation Card */}
          <div style={{ background: 'var(--bg-app)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Saúde Financeira</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '120px', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Alavancagem</div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>{stock.divBrutaPatrim?.toFixed(2) || '0.00'}</div>
                </div>
                <div style={{ flex: 1, minWidth: '120px', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Liq. Corrente</div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>{stock.liqCorr?.toFixed(2) || '0.00'}</div>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Valuation Models</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '12px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Preço Justo (Graham)</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Baseado em VPA e LPA</div>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: stock.margemGraham > 0 ? 'var(--green)' : 'inherit' }}>R$ {stock.precoJustoGraham?.toFixed(2)}</div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '12px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Preço Teto (Bazin)</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Foco em 6% de Dividendos</div>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: stock.margemBazin > 0 ? 'var(--green)' : 'inherit' }}>R$ {stock.precoTetoBazin?.toFixed(2)}</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '12px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Piotroski F-Score</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Mede melhora nos fundamentos</div>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>{stock.fScore} / 9</div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
