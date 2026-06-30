import React from 'react';
import { getHistorico } from '../data/historico5anos';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function calcPerformance(stockHistory, ibovHistory) {
  if (!stockHistory || stockHistory.length < 2) return { ibovWinRate: 0, cdiWinRate: 0, totalMonths: 0 };
  
  // Usar até os últimos 25 pontos de dados para obter 24 meses de retorno
  const recentStock = stockHistory.slice(-25);
  const cdiMonthlyReturn = 0.0085; // ~0.85% ao mês (aprox 10.5% ao ano)
  
  let ibovWins = 0;
  let cdiWins = 0;
  let totalMonths = 0;

  for (let i = 1; i < recentStock.length; i++) {
    const s1 = recentStock[i-1];
    const s2 = recentStock[i];
    const stockReturn = (s2.price - s1.price) / s1.price;
    
    // Encontrar os meses correspondentes no IBOV
    const i2 = ibovHistory.find(b => b.date.substring(0, 7) === s2.date.substring(0, 7));
    const i1 = ibovHistory.find(b => b.date.substring(0, 7) === s1.date.substring(0, 7));
    
    let ibovReturn = null;
    if (i2 && i1) {
       ibovReturn = (i2.price - i1.price) / i1.price;
    }
    
    if (ibovReturn !== null) {
       if (stockReturn > ibovReturn) ibovWins++;
    } else {
       // Se o IBOV faltar, pula a checagem desse mes para o IBOV mas ainda calcula o CDI
    }
    
    if (stockReturn > cdiMonthlyReturn) cdiWins++;
    totalMonths++;
  }

  return {
    ibovWinRate: totalMonths > 0 ? ibovWins / totalMonths : 0,
    cdiWinRate: totalMonths > 0 ? cdiWins / totalMonths : 0,
    totalMonths
  };
}

function getIndicatorColor(winRate) {
  if (winRate >= 1.0) return 'var(--primary)'; // Azul (Muito Bom)
  if (winRate >= 0.9) return 'var(--green)'; // Verde (Bom)
  if (winRate <= 0) return 'var(--red)'; // Vermelho (Ruim)
  if (winRate <= 0.5) return 'var(--yellow)'; // Amarelo (Alerta)
  return 'var(--text-muted)'; // Cinza/Neutro
}

function getIndicatorText(winRate) {
  if (winRate >= 1.0) return 'Muito Bom';
  if (winRate >= 0.9) return 'Bom';
  if (winRate <= 0) return 'Ruim';
  if (winRate <= 0.5) return 'Alerta';
  return 'Neutro';
}

export default function StockDetail({ stock, onClose }) {
  const history = getHistorico(stock.ticker);
  const ibovHistory = getHistorico('^BVSP');
  const performance = calcPerformance(history, ibovHistory);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{stock.ticker} - {stock.empresa}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ padding: '16px', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Cotação Atual</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>R$ {stock.cotacaoAtual?.toFixed(2)}</div>
          </div>
          <div style={{ padding: '16px', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Score Total</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>{stock.score} pts</div>
          </div>
          <div style={{ padding: '16px', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Margem Graham</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: stock.margemGraham > 0 ? 'var(--green)' : 'var(--red)' }}>
              {stock.margemGraham?.toFixed(1)}%
            </div>
          </div>
        </div>

        <h3>Gráfico de Preços (Últimos 5 Anos)</h3>
        <div className="chart-container">
          {history.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={str => new Date(str).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })} 
                />
                <YAxis domain={['auto', 'auto']} tickFormatter={val => `R$ ${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-light)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--primary)' }}
                  labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                  formatter={value => [`R$ ${value}`, 'Preço']}
                  labelFormatter={label => new Date(label).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                />
                <Line type="monotone" dataKey="price" stroke="var(--primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="center-content">Sem histórico de 5 anos disponível no Yahoo Finance</div>
          )}
        </div>

        {performance.totalMonths > 0 && (
          <>
            <h3>Performance (Últimos 2 Anos - {performance.totalMonths} meses)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px', marginBottom: '24px' }}>
              
              <div 
                style={{ padding: '16px', border: '1px solid var(--border-light)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}
                title={`Esta ação rendeu acima do IBOVESPA em ${(performance.ibovWinRate * 100).toFixed(0)}% dos últimos ${performance.totalMonths} meses`}
              >
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: getIndicatorColor(performance.ibovWinRate) }}></div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>vs IBOVESPA</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    {getIndicatorText(performance.ibovWinRate)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{(performance.ibovWinRate * 100).toFixed(0)}% do tempo acima</div>
                </div>
              </div>

              <div 
                style={{ padding: '16px', border: '1px solid var(--border-light)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}
                title={`Esta ação rendeu acima do CDI (~0.85% ao mês) em ${(performance.cdiWinRate * 100).toFixed(0)}% dos últimos ${performance.totalMonths} meses`}
              >
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: getIndicatorColor(performance.cdiWinRate) }}></div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>vs CDI</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    {getIndicatorText(performance.cdiWinRate)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{(performance.cdiWinRate * 100).toFixed(0)}% do tempo acima</div>
                </div>
              </div>

            </div>
          </>
        )}

        <h3>Fundamentos (Último Balanço)</h3>
        <table style={{ marginTop: '16px', width: '100%' }}>
          <tbody>
            <tr>
              <td><strong>LPA (Lucro por Ação):</strong></td>
              <td>R$ {stock.lpa?.toFixed(2)}</td>
            </tr>
            <tr>
              <td><strong>VPA (Valor Patrimonial):</strong></td>
              <td>R$ {stock.vpa?.toFixed(2)}</td>
            </tr>
            <tr>
              <td><strong>ROE (Retorno sobre Eq.):</strong></td>
              <td>{stock.roe?.toFixed(1)}%</td>
            </tr>
            <tr>
              <td><strong>Preço Justo (Graham):</strong></td>
              <td>R$ {stock.precoJustoGraham?.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
