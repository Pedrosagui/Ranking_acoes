// src/components/StockCard.jsx
import { getOportunidade } from '../utils/valuation';

function fmt(val, decimals = 2) {
  if (val === null || val === undefined || isNaN(val)) return 'N/A';
  return val.toFixed(decimals);
}

function fmtBRL(val) {
  if (val === null || val === undefined || isNaN(val) || val <= 0) return 'N/A';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

function fmtPct(val) {
  if (val === null || val === undefined || isNaN(val) || val < -500) return 'N/A';
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toFixed(1)}%`;
}

const OPORTUNIDADE_CONFIG = {
  COMPRA_FORTE: {
    label: 'Compra Forte',
    badgeClass: 'badge-compra',
    cardBorder: 'card-border-green',
    dot: 'dot-green',
  },
  NEUTRO: {
    label: 'Neutro',
    badgeClass: 'badge-neutro',
    cardBorder: 'card-border-yellow',
    dot: 'dot-yellow',
  },
  CARO: {
    label: 'Acima do Preço',
    badgeClass: 'badge-caro',
    cardBorder: 'card-border-red',
    dot: 'dot-red',
  },
};

export default function StockCard({ stock }) {
  const {
    posicao, ticker, empresa, setor,
    cotacaoAtual, precoTetoBazin, precoJustoGraham,
    margemBazin, margemGraham, roe, score,
    consistente, lpa, vpa,
  } = stock;

  const oportunidade = getOportunidade(margemBazin ?? -999, margemGraham ?? -999);
  const config = OPORTUNIDADE_CONFIG[oportunidade];

  const isInvalid = !lpa || !vpa || lpa <= 0 || vpa <= 0;

  return (
    <div className={`stock-card ${config.cardBorder} ${isInvalid ? 'card-invalid' : ''}`}>
      {/* Cabeçalho do card */}
      <div className="card-header">
        <div className="card-rank">
          <span className="rank-number">#{posicao}</span>
        </div>

        <div className="card-identity">
          <div className="card-ticker-row">
            <span className="card-ticker">{ticker}</span>
            <span className={`badge ${config.badgeClass}`}>
              <span className={`dot ${config.dot}`} />
              {config.label}
            </span>
          </div>
          <p className="card-empresa">{empresa}</p>
          <span className="card-setor">{setor}</span>
        </div>

        <div className="card-score">
          <div className={`score-circle ${score >= 60 ? 'score-high' : score >= 30 ? 'score-mid' : 'score-low'}`}>
            <span className="score-value">{score}</span>
            <span className="score-label">score</span>
          </div>
        </div>
      </div>

      {/* Preço atual */}
      <div className="card-price-row">
        <div className="price-current">
          <span className="price-label">Cotação Atual</span>
          <span className="price-value">{fmtBRL(cotacaoAtual)}</span>
        </div>
        {consistente && (
          <span className="consistente-badge" title="Pagou dividendos em todos os anos">
            ✅ Consistente
          </span>
        )}
      </div>

      {/* Grid de métricas de valuation */}
      <div className="card-metrics">
        <div className="metric-block">
          <span className="metric-label">Preço Teto Bazin</span>
          <span className="metric-value">{fmtBRL(precoTetoBazin)}</span>
          <span className={`metric-pct ${margemBazin > 0 ? 'pct-positive' : 'pct-negative'}`}>
            {fmtPct(margemBazin)}
          </span>
        </div>

        <div className="metric-divider" />

        <div className="metric-block">
          <span className="metric-label">Preço Justo Graham</span>
          <span className="metric-value">{fmtBRL(precoJustoGraham)}</span>
          <span className={`metric-pct ${margemGraham > 0 ? 'pct-positive' : 'pct-negative'}`}>
            {fmtPct(margemGraham)}
          </span>
        </div>
      </div>

      {/* Footer com dados fundamentalistas */}
      <div className="card-footer">
        <div className="fundamental">
          <span className="fundamental-label">LPA</span>
          <span className="fundamental-value">{fmt(lpa)}</span>
        </div>
        <div className="fundamental">
          <span className="fundamental-label">VPA</span>
          <span className="fundamental-value">{fmt(vpa)}</span>
        </div>
        <div className="fundamental">
          <span className="fundamental-label">ROE</span>
          <span className={`fundamental-value ${roe >= 15 ? 'value-green' : roe >= 8 ? 'value-yellow' : 'value-red'}`}>
            {roe ? `${fmt(roe, 1)}%` : 'N/A'}
          </span>
        </div>
        <div className="fundamental">
          <span className="fundamental-label">P/VP</span>
          <span className="fundamental-value">
            {vpa && cotacaoAtual ? fmt(cotacaoAtual / vpa, 1) + 'x' : 'N/A'}
          </span>
        </div>
      </div>

      {/* Barra de score visual */}
      <div className="score-bar-track">
        <div
          className={`score-bar-fill ${score >= 60 ? 'fill-green' : score >= 30 ? 'fill-yellow' : 'fill-red'}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
