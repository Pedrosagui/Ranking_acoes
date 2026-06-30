// src/components/FilterBar.jsx
import { useStocks } from '../context/StockContext';
import { SETORES } from '../data/tickers';

export default function FilterBar() {
  const { filters, setFilter, filteredStocks, stocks } = useStocks();

  if (stocks.length === 0) return null;

  return (
    <div className="filter-bar">
      {/* Busca */}
      <div className="filter-search-wrap">
        <svg className="filter-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className="filter-input filter-search"
          placeholder="Buscar por ticker ou empresa..."
          value={filters.busca}
          onChange={e => setFilter('busca', e.target.value)}
        />
      </div>

      {/* Setor */}
      <select
        className="filter-input filter-select"
        value={filters.setor}
        onChange={e => setFilter('setor', e.target.value)}
      >
        <option value="Todos">Todos os Setores</option>
        {SETORES.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {/* Ordenação */}
      <select
        className="filter-input filter-select"
        value={filters.ordenacao}
        onChange={e => setFilter('ordenacao', e.target.value)}
      >
        <option value="score">Ordenar: Score Total</option>
        <option value="margemBazin">Ordenar: Margem Bazin</option>
        <option value="margemGraham">Ordenar: Margem Graham</option>
        <option value="roe">Ordenar: ROE</option>
      </select>

      {/* Toggles */}
      <label className="filter-toggle">
        <input
          type="checkbox"
          checked={filters.apenasDesconto}
          onChange={e => setFilter('apenasDesconto', e.target.checked)}
        />
        <span className="toggle-track" />
        <span className="toggle-label">Apenas com desconto</span>
      </label>

      <label className="filter-toggle">
        <input
          type="checkbox"
          checked={filters.apenasConsistentes}
          onChange={e => setFilter('apenasConsistentes', e.target.checked)}
        />
        <span className="toggle-track" />
        <span className="toggle-label">Pagadores consistentes</span>
      </label>

      {/* Contador de resultados */}
      <span className="filter-count">
        {filteredStocks.length} de {stocks.length} ativos
      </span>
    </div>
  );
}
