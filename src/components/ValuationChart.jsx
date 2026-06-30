// src/components/ValuationChart.jsx
// Gráfico de barras agrupadas: Top 5 — Cotação vs Graham vs Bazin
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useStocks } from '../context/StockContext';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-title">{label}</p>
      {payload.map(entry => (
        <p key={entry.name} style={{ color: entry.color }} className="chart-tooltip-row">
          {entry.name}: {' '}
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.value)}
        </p>
      ))}
    </div>
  );
}

export default function ValuationChart() {
  const { filteredStocks } = useStocks();

  const top5 = filteredStocks
    .filter(s => s.score > 0 && s.cotacaoAtual && s.precoJustoGraham && s.precoTetoBazin)
    .slice(0, 5);

  if (top5.length === 0) return null;

  const data = top5.map(s => ({
    name: s.ticker,
    'Cotação Atual': parseFloat(s.cotacaoAtual?.toFixed(2)),
    'Preço Graham': parseFloat(s.precoJustoGraham?.toFixed(2)),
    'Preço Teto Bazin': parseFloat(s.precoTetoBazin?.toFixed(2)),
  }));

  return (
    <div className="chart-section">
      <div className="chart-header">
        <h2 className="chart-title">
          <span className="chart-title-accent">Top 5</span> — Comparativo de Valuation
        </h2>
        <p className="chart-subtitle">
          Cotação atual vs. Preço Justo (Graham) vs. Preço Teto (Bazin)
        </p>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 600 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v =>
                new Intl.NumberFormat('pt-BR', {
                  style: 'currency', currency: 'BRL',
                  notation: 'compact', maximumFractionDigits: 0,
                }).format(v)
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '12px', fontSize: '12px', color: '#94a3b8' }}
            />
            <Bar dataKey="Cotação Atual" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Preço Graham" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Preço Teto Bazin" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
