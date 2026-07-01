import React, { useState, useEffect } from 'react';
import { useStocks } from '../context/StockContext';
import StockDetail from './StockDetail';
import { rankPiotroskiGraham, PERFIS_SCORE } from '../utils/valuation';

// --- SVGs for Icons (Vercel Style) ---
const IconOverview = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>;
const IconValuation = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>;
const IconSpeed = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>;
const IconLogo = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;

const Tooltip = ({ children, text }) => (
  <div className="tooltip-container" title={text}>
    {children}
    <span className="tooltip-text">{text}</span>
  </div>
);

import SyncModal from './SyncModal';

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



const ITEMS_PER_PAGE = 30;

export default function Dashboard() {
  const { filteredStocks, stocks, isLoading, error, activeProfile, setProfile, isSyncing } = useStocks();
  const [activeTab, setActiveTab] = useState('graham_bazin');
  const [selectedStock, setSelectedStock] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, activeProfile, filteredStocks.length, searchQuery]);

  if (isLoading || stocks.length === 0) return <SyncModal />;

  const searchedStocks = filteredStocks.filter(s => 
    s.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.empresa && s.empresa.toLowerCase().includes(searchQuery.toLowerCase()))
  );


  const renderPagination = (totalItems) => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    if (totalPages <= 1) return null;
    return (
      <div className="pagination-controls">
        <button 
          className="btn btn-ghost" 
          disabled={currentPage === 1} 
          onClick={() => {
            setCurrentPage(p => p - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}>
          Anterior
        </button>
        <span className="pagination-info">Página {currentPage} de {totalPages}</span>
        <button 
          className="btn btn-ghost" 
          disabled={currentPage === totalPages} 
          onClick={() => {
            setCurrentPage(p => p + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}>
          Próxima
        </button>
      </div>
    );
  };

  const MobileCard = ({ stock, scoreField, index }) => {
    const score = stock[scoreField] || 0;
    const maxScore = scoreField === 'fScore' ? 9 : 100;
    const percent = Math.min(100, Math.max(0, Math.round((score / maxScore) * 100)));
    
    // Superpower style gradient and indicator
    let dotColor = 'var(--yellow)';
    let gradient = 'linear-gradient(90deg, #F5A62340 0%, #F5A623 100%)';
    if (percent >= 70) {
      dotColor = 'var(--green)';
      gradient = 'linear-gradient(90deg, #16A34A40 0%, #16A34A 100%)';
    } else if (percent <= 40) {
      dotColor = 'var(--red)';
      gradient = 'linear-gradient(90deg, #E0000040 0%, #E00000 100%)';
    }

    return (
      <div className="mobile-card" onClick={() => setSelectedStock(stock)}>
        <div className="mobile-card-indicator" style={{ backgroundColor: dotColor }}></div>
        <div className="mobile-card-content">
          <div className="mobile-card-header">
            <span className="mobile-card-title" style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: stock.posicao <= 3 ? 'var(--yellow)' : 'inherit', marginRight: '6px' }}>{stock.posicao <= 3 ? '★' : ''} #{stock.posicao}</span> 
              
              {stock.logoUrl ? (
                <img src={stock.logoUrl} alt={stock.ticker} style={{width: 20, height: 20, borderRadius: '50%', marginRight: '8px', objectFit: 'contain', background: 'white'}} />
              ) : (
                <div style={{width: 20, height: 20, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px', fontSize: '10px', fontWeight: 'bold', color: 'var(--text-primary)', border: '1px solid var(--border-light)'}}>{stock.ticker ? stock.ticker.charAt(0) : '?'}</div>
              )}

              {stock.ticker}
            </span>
            <span className="mobile-card-price">R$ {stock.cotacaoAtual?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="mobile-card-subtitle">{stock.empresa?.substring(0, 25)}</div>
          
          <div className="mobile-card-score-row">
            <div className="mobile-card-score-value">
              {score} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>{scoreField === 'fScore' ? 'pts' : 'score'}</span>
            </div>
            <div className="mobile-card-progress-track">
              <div 
                className="mobile-card-progress-fill" 
                style={{ 
                  width: `${percent}%`, 
                  background: gradient 
                }}
              >
                <div className="mobile-card-progress-dot" style={{ backgroundColor: dotColor }}></div>
              </div>
              <div className="mobile-card-progress-target"></div>
            </div>
          </div>
          
          <div className="mobile-card-stats">
            <div className="mobile-card-stat">
              <span className="mobile-card-stat-label">P/L</span>
              <span className="mobile-card-stat-value">{stock.pl?.toFixed(2) || '-'}</span>
            </div>
            <div className="mobile-card-stat">
              <span className="mobile-card-stat-label">Div. Yield</span>
              <span className="mobile-card-stat-value">{stock.divYield?.toFixed(1) || '-'}%</span>
            </div>
            <div className="mobile-card-stat">
              <span className="mobile-card-stat-label">ROE</span>
              <span className="mobile-card-stat-value">{stock.roe?.toFixed(1) || '-'}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGrahamBazin = () => {
    const currentData = searchedStocks.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
      <>
        <div className="dashboard-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div className="search-container" style={{ flex: '1', minWidth: '250px' }}>
            <input 
              type="search" 
              className="search-input" 
              placeholder="Buscar por Ticker ou Empresa..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>
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

        {/* Desktop Table */}
        <div className="table-container desktop-only">
          <table className="valuation-table">
            <thead>
              <tr>
                <th>Posição</th>
                <th>Ativo</th>
                <th>Cotação</th>
                <th><Tooltip text="Relação percentual entre os dividendos pagos nos últimos 12 meses e o preço atual da ação.">Div. Yield</Tooltip></th>
                <th><Tooltip text="Preço / Lucro. Quantos anos levaria para reaver o capital investido considerando o lucro atual.">P/L</Tooltip></th>
                <th><Tooltip text="Porcentagem de lucro líquido em relação à receita total da empresa.">M. Líquida</Tooltip></th>
                <th><Tooltip text="Retorno sobre o Patrimônio Líquido. Mede o quão eficiente a empresa é em gerar lucro com os recursos dos acionistas.">ROE</Tooltip></th>
                <th><Tooltip text="Dívida Bruta dividida pelo Patrimônio. Mede o risco de endividamento da empresa.">Alavancagem</Tooltip></th>
                <th><Tooltip text="Preço Teto baseado no dividendo mínimo de 6% (Fórmula de Décio Bazin).">Valuation Bazin</Tooltip></th>
                <th><Tooltip text="Preço Justo calculado a partir do VPA e LPA (Fórmula de Benjamin Graham).">Valuation Graham</Tooltip></th>
                <th><Tooltip text="Pontuação estatística de 0 a 100 baseada nos 5 pilares com os pesos do Perfil selecionado.">Score Final</Tooltip></th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((stock, idx) => {
                const index = (currentPage - 1) * ITEMS_PER_PAGE + idx;
                return (
                  <tr key={stock.ticker} onClick={() => setSelectedStock(stock)}>
                    <td style={{ color: stock.posicao <= 3 ? 'var(--yellow)' : 'inherit', fontWeight: stock.posicao <= 3 ? 600 : 'normal' }}>
                      {stock.posicao <= 3 ? '★' : ''} {stock.posicao}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {stock.logoUrl ? (
                          <img src={stock.logoUrl} alt={stock.ticker} style={{width: 28, height: 28, borderRadius: '50%', objectFit: 'contain', background: 'white'}} />
                        ) : (
                          <div style={{width: 28, height: 28, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', border: '1px solid var(--border-light)'}}>{stock.ticker ? stock.ticker.charAt(0) : '?'}</div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stock.ticker}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{stock.empresa?.substring(0, 25)}</span>
                        </div>
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
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="mobile-card-list mobile-only">
          {currentData.map((stock) => (
            <MobileCard key={stock.ticker} stock={stock} scoreField="scoreComposto" />
          ))}
        </div>

        {renderPagination(filteredStocks.length)}
      </>
    );
  };

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
          O filtro de "Perfil" altera dinamicamente os <strong>Pesos</strong> dos 5 Pilares para encontrar a ação perfeita para o seu objetivo:
        </p>
        <ul style={{ paddingLeft: '24px', fontSize: '14px', marginBottom: '16px' }}>
          <li style={{ marginBottom: '8px' }}><strong>⚖️ Equilibrado:</strong> Busca empresas balanceadas (30% Valuation, 25% Qualidade, 25% Proventos, 15% Saúde). Ideal para quem não quer abrir mão de nada.</li>
          <li style={{ marginBottom: '8px' }}><strong>💰 Dividendista:</strong> Foco absoluto na geração de renda passiva. O pilar de "Proventos" passa a valer 45% da nota final, premiando empresas que pagam muito e com consistência.</li>
          <li style={{ marginBottom: '8px' }}><strong>🚀 Crescimento (Growth):</strong> Ignora os dividendos e foca em empresas eficientes (35% Qualidade) que estão muito baratas (35% Valuation) e têm caixa saudável.</li>
          <li style={{ marginBottom: '8px' }}><strong>🧙 Magic Formula (Greenblatt):</strong> Uma réplica da famosa fórmula de Joel Greenblatt. O motor ignora dividendos e foca 50% em Qualidade (ROIC) e 50% em Valuation (Earning Yield).</li>
          <li style={{ marginBottom: '8px' }}><strong>🛡️ Conservador:</strong> Penaliza fortemente empresas endividadas. O pilar de Saúde Financeira passa a valer 35%, e Proventos 30%. Ideal para carteiras defensivas.</li>
          <li><strong>📈 Graham + Piotroski:</strong> Substitui os 5 pilares por um checklist binário (F-Score) criado por Joseph Piotroski que avalia 9 critérios de saúde financeira. A pontuação original de 0 a 9 é escalonada de 0 a 100 no ranking, servindo como um excelente filtro de "empresas baratas que estão melhorando".</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="app-wrapper">
      {/* Sidebar Desktop Only */}
      <aside className="sidebar desktop-only">
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
            className={`sidebar-item ${activeTab === 'metodologia' ? 'active' : ''}`}
            onClick={() => setActiveTab('metodologia')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            <span>Metodologia</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content pb-mobile">
        <header className="header">
          {activeTab === 'graham_bazin' ? 'Aegis / Speed Insights / Ranking Compostos' : 'Aegis / Analytics / Metodologia'}
        </header>

        <div className="content-inner">
          {error && (
            <div style={{ background: 'var(--bg-app)', border: '1px solid var(--red)', color: 'var(--red)', padding: '16px', marginBottom: '24px', borderRadius: '8px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {isSyncing && stocks.length > 0 && (
            <SyncModal />
          )}

          {activeTab === 'graham_bazin' && renderGrahamBazin()}
          {activeTab === 'metodologia' && renderMetodologia()}
        </div>
      </main>

      {/* Bottom Nav Mobile */}
      <nav className="bottom-nav mobile-only">
        <div className={`bottom-nav-item ${activeTab === 'graham_bazin' ? 'active' : ''}`} onClick={() => setActiveTab('graham_bazin')}>
          <IconSpeed />
          <span>Ranking</span>
        </div>

        <div className={`bottom-nav-item ${activeTab === 'metodologia' ? 'active' : ''}`} onClick={() => setActiveTab('metodologia')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
          <span>Metodologia</span>
        </div>
      </nav>

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
