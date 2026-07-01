import React, { useState } from 'react';
import { useStocks } from '../context/StockContext';
import SyncProgressBar from './SyncProgressBar';
import StockDetail from './StockDetail';
import { rankPiotroskiGraham, PERFIS_SCORE } from '../utils/valuation';

// --- SVGs for Icons (Vercel Style) ---
const IconOverview = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>;
const IconValuation = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>;
const IconSpeed = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>;
const IconSettings = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const IconLogo = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;

const IconHelp = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;

const Tooltip = ({ children, text }) => (
  <div className="tooltip-container" title={text}>
    {children}
    <span className="tooltip-text">{text}</span>
  </div>
);

function LoadingState() {
  return (
    <div className="center-content">
      <div className="loading-spinner-large"></div>
      <p style={{ marginTop: '16px' }}>Carregando dados locais...</p>
    </div>
  );
}

function StatusIndicator({ value, thresholds, inverse = false }) {
  if (value === null || value === undefined) return <span style={{ color: 'var(--text-muted)' }}>-</span>;
  
  let colorClass = 'text-yellow'; // Default/Middle
  const { good, bad } = thresholds;
  
  if (inverse) {
    if (value <= good) colorClass = 'text-green';
    else if (value >= bad) colorClass = 'text-red';
  } else {
    if (value >= good) colorClass = 'text-green';
    else if (value <= bad) colorClass = 'text-red';
  }

  return <span className={colorClass} style={{ fontWeight: 500 }}>{value}</span>;
}

function Top10Chart({ stocks, title, scoreField, scoreSuffix = 'pts' }) {
  const top10 = stocks.slice(0, 10);
  
  return (
    <div className="card">
      <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>{title}</h3>
      <div className="top10-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
        {top10.map((stock, i) => (
          <div key={stock.ticker} className="metric-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>#{i + 1} &middot; {stock.setor?.substring(0, 15)}</div>
              <div className="metric-value text-green" style={{ fontSize: '18px' }}>
                <span className="status-dot status-green"></span>
                {stock[scoreField]}
              </div>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 600 }}>{stock.ticker}</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>R$ {stock.cotacaoAtual?.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { filteredStocks, stocks, isLoading, isSyncing, error, activeProfile, setProfile } = useStocks();
  const [activeTab, setActiveTab] = useState('graham_bazin');
  const [selectedStock, setSelectedStock] = useState(null);

  if (isLoading || (isSyncing && stocks.length === 0)) return <LoadingState />;

  const piotroskiStocks = rankPiotroskiGraham(stocks);

  const renderGrahamBazin = () => (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Perfil:</span>
          <select 
            className="vercel-select"
            value={activeProfile} 
            onChange={(e) => setProfile(e.target.value)}
          >
            {Object.entries(PERFIS_SCORE).map(([key, perfil]) => (
              <option key={key} value={key}>{perfil.label}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredStocks.length > 0 && <Top10Chart stocks={filteredStocks} title={`Top 10 — Ranking ${PERFIS_SCORE[activeProfile]?.label || 'Valuation'}`} scoreField="scoreComposto" scoreSuffix="pts" />}
      
      <div className="table-container">
        <table className="valuation-table">
          <thead>
            <tr>
              <th>Posição</th>
              <th>Ativo</th>
              <th>Cotação</th>
              <th><Tooltip text="Relação percentual entre os dividendos pagos nos últimos 12 meses e o preço atual da ação.">Div. Yield <IconHelp/></Tooltip></th>
              <th><Tooltip text="Preço / Lucro. Quantos anos levaria para reaver o capital investido considerando o lucro atual.">P/L <IconHelp/></Tooltip></th>
              <th><Tooltip text="Porcentagem de lucro líquido em relação à receita total da empresa.">M. Líquida <IconHelp/></Tooltip></th>
              <th><Tooltip text="Retorno sobre o Patrimônio Líquido. Mede o quão eficiente a empresa é em gerar lucro com os recursos dos acionistas.">ROE <IconHelp/></Tooltip></th>
              <th><Tooltip text="Dívida Bruta dividida pelo Patrimônio. Mede o risco de endividamento da empresa.">Alavancagem <IconHelp/></Tooltip></th>
              <th><Tooltip text="Preço Teto baseado no dividendo mínimo de 6% (Fórmula de Décio Bazin).">Valuation Bazin <IconHelp/></Tooltip></th>
              <th><Tooltip text="Preço Justo calculado a partir do VPA e LPA (Fórmula de Benjamin Graham).">Valuation Graham <IconHelp/></Tooltip></th>
              <th><Tooltip text="Pontuação estatística de 0 a 100 baseada nos 5 pilares com os pesos do Perfil selecionado.">Score Final <IconHelp/></Tooltip></th>
            </tr>
          </thead>
          <tbody>
            {filteredStocks.map((stock, index) => (
              <tr key={stock.ticker} onClick={() => setSelectedStock(stock)}>
                <td style={{ color: index < 3 ? 'var(--yellow)' : 'inherit', fontWeight: index < 3 ? 600 : 'normal' }}>
                  {index < 3 ? '★' : ''} {index + 1}
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stock.ticker}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{stock.empresa?.substring(0, 20)}</span>
                  </div>
                </td>
                <td>R$ {stock.cotacaoAtual?.toFixed(2) || 'N/A'}</td>
                <td><StatusIndicator value={stock.divYield?.toFixed(1)} thresholds={{good: 6, bad: 3}}/>%</td>
                <td><StatusIndicator value={stock.pl?.toFixed(2)} thresholds={{good: 5, bad: 15}} inverse={true}/></td>
                <td><StatusIndicator value={stock.margemLiquida?.toFixed(1)} thresholds={{good: 15, bad: 5}}/>%</td>
                <td><StatusIndicator value={stock.roe?.toFixed(1)} thresholds={{good: 15, bad: 5}}/>%</td>
                <td>{stock.divBrutaPatrim?.toFixed(2) || 'N/A'}</td>
                
                <td>
                  R$ {stock.precoTetoBazin?.toFixed(2) || '0.00'}
                </td>
                <td>
                  R$ {stock.precoJustoGraham?.toFixed(2) || '0.00'}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className={`status-dot ${stock.scoreComposto > 70 ? 'status-green' : stock.scoreComposto > 40 ? 'status-yellow' : 'status-red'}`}></span>
                    <span style={{ fontWeight: 600 }}>{stock.scoreComposto}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderPiotroski = () => (
    <>
      {piotroskiStocks.length > 0 && <Top10Chart stocks={piotroskiStocks} title="Top 10 — Graham + Piotroski" scoreField="fScore" scoreSuffix="F-Score" />}
      
      <div className="table-container">
        <table className="valuation-table">
          <thead>
            <tr>
              <th>Posição</th>
              <th>Ativo</th>
              <th>Cotação</th>
              <th><Tooltip text="Retorno sobre o Patrimônio Líquido.">ROE <IconHelp/></Tooltip></th>
              <th><Tooltip text="Liquidez Corrente. Capacidade da empresa de pagar suas dívidas de curto prazo.">Liq. Corr. <IconHelp/></Tooltip></th>
              <th><Tooltip text="Dívida Bruta dividida pelo Patrimônio.">Alavancagem <IconHelp/></Tooltip></th>
              <th><Tooltip text="Preço Justo calculado a partir do VPA e LPA (Fórmula de Benjamin Graham).">Valuation Graham <IconHelp/></Tooltip></th>
              <th><Tooltip text="Nota de 0 a 9 que mede a força financeira da empresa (Fórmula de Joseph Piotroski).">Piotroski F-Score <IconHelp/></Tooltip></th>
            </tr>
          </thead>
          <tbody>
            {piotroskiStocks.map((stock, index) => (
              <tr key={stock.ticker} onClick={() => setSelectedStock(stock)}>
                <td style={{ color: index < 3 ? 'var(--yellow)' : 'inherit', fontWeight: index < 3 ? 600 : 'normal' }}>
                  {index < 3 ? '★' : ''} {index + 1}
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stock.ticker}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{stock.empresa?.substring(0, 20)}</span>
                  </div>
                </td>
                <td>R$ {stock.cotacaoAtual?.toFixed(2) || 'N/A'}</td>
                <td><StatusIndicator value={stock.roe?.toFixed(1)} thresholds={{good: 15, bad: 5}}/>%</td>
                <td><StatusIndicator value={stock.liqCorr?.toFixed(2)} thresholds={{good: 1.5, bad: 1}}/></td>
                <td>{stock.divBrutaPatrim?.toFixed(2) || 'N/A'}</td>
                
                <td>
                  R$ {stock.precoJustoGraham?.toFixed(2) || '0.00'}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className={`status-dot ${stock.fScore >= 7 ? 'status-green' : stock.fScore >= 4 ? 'status-yellow' : 'status-red'}`}></span>
                    <span style={{ fontWeight: 600 }}>{stock.fScore} / 9</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderMetodologia = () => (
    <div style={{ maxWidth: '800px', margin: '0 auto', color: 'var(--text-primary)', lineHeight: 1.6 }}>
      <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Metodologia Aegis</h2>
      <p style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>
        O Aegis utiliza um modelo matemático avançado que combina as filosofias dos maiores investidores do mundo para ranquear as ações da bolsa brasileira. 
        Em vez de olhar para indicadores isolados, calculamos um <strong>Score Composto</strong> que penaliza empresas ruins e premia as melhores em cinco pilares fundamentais.
      </p>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--blue)' }}>■</span> 1. Valuation (Preço Justo e Teto)
        </h3>
        <p style={{ marginBottom: '16px', fontSize: '14px' }}>
          Calculamos duas âncoras de preço para saber se a ação está barata ou cara:
        </p>
        <ul style={{ paddingLeft: '24px', fontSize: '14px', marginBottom: '16px' }}>
          <li style={{ marginBottom: '8px' }}><strong>Fórmula de Graham:</strong> <code>Raiz(22.5 × VPA × LPA)</code>. Encontra o preço intrínseco de empresas maduras baseando-se no patrimônio e no lucro.</li>
          <li><strong>Fórmula de Bazin:</strong> <code>Dividendo Anual / 0.06</code>. Encontra o preço máximo que você deve pagar para garantir pelo menos 6% de retorno em dividendos.</li>
        </ul>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--green)' }}>■</span> 2. Os 5 Pilares do Score Composto
        </h3>
        <p style={{ marginBottom: '16px', fontSize: '14px' }}>
          O Score Final (de 0 a 100) não é absoluto, ele é <strong>relativo</strong>. Comparamos o P/L, ROE, etc., da empresa X com todo o restante da Bolsa (Percentil). Os pilares são:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13px' }}>
          <div style={{ padding: '12px', background: 'var(--bg-app)', borderRadius: '6px' }}><strong>Valuation:</strong> Earning Yield (EV/EBIT) e P/L. Avalia se a empresa está "em promoção".</div>
          <div style={{ padding: '12px', background: 'var(--bg-app)', borderRadius: '6px' }}><strong>Qualidade:</strong> Margem Líquida, Margem EBIT e ROIC. Mede a eficiência e o fosso competitivo.</div>
          <div style={{ padding: '12px', background: 'var(--bg-app)', borderRadius: '6px' }}><strong>Proventos:</strong> Dividend Yield histórico e atual. Foco na geração de renda passiva.</div>
          <div style={{ padding: '12px', background: 'var(--bg-app)', borderRadius: '6px' }}><strong>Saúde Financeira:</strong> Dívida Bruta/Patrimônio e Liquidez. Penaliza empresas alavancadas e arriscadas.</div>
          <div style={{ padding: '12px', background: 'var(--bg-app)', borderRadius: '6px' }}><strong>Crescimento:</strong> Crescimento de Receita (5 anos) e ROE. Mede o motor de expansão.</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--yellow)' }}>■</span> 3. Perfis de Investidor
        </h3>
        <p style={{ fontSize: '14px', marginBottom: '16px' }}>
          O filtro de "Perfil" altera dinamicamente os <strong>Pesos</strong> dos 5 Pilares. 
          Por exemplo, se você seleciona <em>Dividendista</em>, o pilar de "Proventos" passa a valer 40% da nota final, enquanto "Crescimento" perde importância.
          Se escolher <em>Magic Formula (Greenblatt)</em>, o motor ignora dividendos e foca 50% no Earning Yield (Valuation) e 50% no ROIC (Qualidade).
        </p>
      </div>
    </div>
  );

  return (
    <div className="app-wrapper">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <IconLogo />
          <span>Aegis Platform</span>
        </div>
        <div className="sidebar-menu">
          <div style={{ margin: '8px 0', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', paddingLeft: '12px' }}>Analytics</div>
          <div 
            className={`sidebar-item ${activeTab === 'graham_bazin' ? 'active' : ''}`}
            onClick={() => setActiveTab('graham_bazin')}
          >
            <IconSpeed />
            <span>Ranking Compostos</span>
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'piotroski' ? 'active' : ''}`}
            onClick={() => setActiveTab('piotroski')}
          >
            <IconValuation />
            <span>Graham + Piotroski</span>
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'metodologia' ? 'active' : ''}`}
            onClick={() => setActiveTab('metodologia')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            <span>Metodologia</span>
          </div>
          <div style={{ margin: '16px 0 8px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', paddingLeft: '12px' }}>Sistema</div>
          <div className="sidebar-item">
            <IconSettings />
            <span>Configurações</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          {activeTab === 'graham_bazin' ? 'Aegis / Speed Insights / Ranking Compostos' : activeTab === 'piotroski' ? 'Aegis / Speed Insights / Graham + Piotroski' : 'Aegis / Analytics / Metodologia'}
        </header>

        <div className="content-inner">
          {error && (
            <div style={{ background: 'var(--bg-app)', border: '1px solid var(--red)', color: 'var(--red)', padding: '16px', marginBottom: '24px', borderRadius: '8px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {isSyncing && stocks.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <SyncProgressBar />
            </div>
          )}

          {activeTab === 'graham_bazin' && renderGrahamBazin()}
          {activeTab === 'piotroski' && renderPiotroski()}
          {activeTab === 'metodologia' && renderMetodologia()}
        </div>
      </main>

      {/* Modal Detalhes */}
      {selectedStock && (
        <StockDetail 
          stock={selectedStock} 
          onClose={() => setSelectedStock(null)} 
        />
      )}
    </div>
  );
}
