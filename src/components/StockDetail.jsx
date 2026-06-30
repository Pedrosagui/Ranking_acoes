import React from 'react';
import { getHistorico } from '../data/historico5anos';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function StockDetail({ stock, onClose }) {
  const history = getHistorico(stock.ticker);

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
