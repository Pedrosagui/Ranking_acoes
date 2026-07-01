// Página de Carteira — estrutura e lógica principal
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePortfolio } from '../../context/PortfolioContext';
import { useStocks } from '../../context/StockContext';
import { calcPerformancePosicao } from '../../services/portfolioService';
import PortfolioImport from './PortfolioImport';

export default function Portfolio() {
  const { isPro } = useAuth();
  const { carteiras, carteiraAtiva, setCarteiraAtiva, addPosicao, removePosicao } = usePortfolio();
  const { stocks } = useStocks();
  const [showImport, setShowImport] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Enriquece as posições com cotações atuais
  const posicoesEnriquecidas = carteiraAtiva?.posicoes.map(pos => {
    const stockData = stocks.find(s => s.ticker === pos.ticker);
    if (!stockData) return { ...pos, cotacaoAtual: null, variacaoDia: null };
    return calcPerformancePosicao(pos, stockData.cotacaoAtual, stockData.variacaoDia);
  }) || [];

  // Totais da carteira
  const totalInvestido = posicoesEnriquecidas.reduce((s, p) => s + (p.valorInvestido || 0), 0);
  const totalAtual = posicoesEnriquecidas.reduce((s, p) => s + (p.valorAtual || 0), 0);
  const lucroTotal = totalAtual - totalInvestido;
  const lucroPercTotal = totalInvestido > 0 ? (lucroTotal / totalInvestido) * 100 : 0;
  const variacaoHojeBrl = posicoesEnriquecidas.reduce((s, p) => s + (p.variacaoHojeBrl || 0), 0);
  const variacaoHojePerc = totalAtual > 0 ? (variacaoHojeBrl / totalAtual) * 100 : 0;

  // Melhor e pior do dia
  const sorted = [...posicoesEnriquecidas].sort((a, b) => (b.variacaoDia || 0) - (a.variacaoDia || 0));
  const melhorDia = sorted[0];
  const piorDia = sorted[sorted.length - 1];

  return (
    <div className="portfolio-page" style={{ padding: '24px 0' }}>
      {/* Header com resumo */}
      <div className="portfolio-summary-card">
        <div className="portfolio-summary-grid">
          <div>
            <span className="summary-label">Valor Total</span>
            <span className="summary-value">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAtual)}
            </span>
          </div>
          <div>
            <span className="summary-label">Hoje</span>
            <span className={`summary-value ${variacaoHojePerc >= 0 ? 'text-green' : 'text-red'}`}>
              {variacaoHojePerc >= 0 ? '+' : ''}{variacaoHojePerc.toFixed(2)}%
              <span style={{ fontSize: '14px', marginLeft: '6px' }}>({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(variacaoHojeBrl)})</span>
            </span>
          </div>
          <div>
            <span className="summary-label">Lucro Total</span>
            <span className={`summary-value ${lucroTotal >= 0 ? 'text-green' : 'text-red'}`}>
              {lucroPercTotal >= 0 ? '+' : ''}{lucroPercTotal.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Melhor e pior do dia */}
        {melhorDia && (
          <div className="portfolio-highlights">
            <div className="highlight-green">
              🟢 Destaque: {melhorDia.ticker}
              {melhorDia.variacaoDia != null ? ` +${melhorDia.variacaoDia.toFixed(2)}%` : ''}
            </div>
            <div className="highlight-red">
              🔴 Em queda: {piorDia?.ticker}
              {piorDia?.variacaoDia != null ? ` ${piorDia.variacaoDia.toFixed(2)}%` : ''}
            </div>
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="portfolio-actions">
        <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
          + Adicionar Ativo
        </button>
        {isPro || true ? (
          <button className="btn btn-secondary" onClick={() => setShowImport(true)}>
            📥 Importar da B3
          </button>
        ) : (
          <span className="pro-badge">
            🔒 Importação da B3 disponível no Pro
          </span>
        )}
      </div>

      {/* Tabela de posições */}
      <div className="table-container">
        <table className="valuation-table">
          <thead>
            <tr>
              <th>Ativo</th>
              <th>Qtd</th>
              <th>P. Médio</th>
              <th>Cotação</th>
              <th>Hoje</th>
              <th>Total</th>
              <th>% Carteira</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {posicoesEnriquecidas.map(pos => (
              <tr key={pos.ticker}>
                <td><strong>{pos.ticker}</strong></td>
                <td>{pos.quantidade}</td>
                <td>R$ {pos.precoMedio?.toFixed(2)}</td>
                <td>R$ {pos.cotacaoAtual?.toFixed(2) || '-'}</td>
                <td className={pos.variacaoDia >= 0 ? 'text-green' : 'text-red'}>
                  {pos.variacaoDia != null ? `${pos.variacaoDia >= 0 ? '+' : ''}${pos.variacaoDia.toFixed(2)}%` : '-'}
                </td>
                <td className={pos.lucroPercTotal >= 0 ? 'text-green' : 'text-red'}>
                  {pos.lucroPercTotal != null ? `${pos.lucroPercTotal >= 0 ? '+' : ''}${pos.lucroPercTotal.toFixed(2)}%` : '-'}
                </td>
                <td>{totalAtual > 0 ? ((pos.valorAtual / totalAtual) * 100).toFixed(1) : 0}%</td>
                <td>
                  <button onClick={() => removePosicao(carteiraAtiva.id, pos.ticker)} style={{background:'transparent', border:'none', color:'var(--red)', cursor:'pointer', fontSize:'16px'}}>✕</button>
                </td>
              </tr>
            ))}
            {posicoesEnriquecidas.length === 0 && (
              <tr><td colSpan="8" style={{textAlign:'center', padding:'40px 0', color:'var(--text-muted)'}}>Nenhum ativo na carteira. Importe da B3!</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showImport && <PortfolioImport onClose={() => setShowImport(false)} />}
    </div>
  );
}
