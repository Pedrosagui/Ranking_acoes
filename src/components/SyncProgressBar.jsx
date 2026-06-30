// src/components/SyncProgressBar.jsx
import { useStocks } from '../context/StockContext';

export default function SyncProgressBar() {
  const { isSyncing, syncProgress } = useStocks();

  if (!isSyncing || !syncProgress) return null;

  const { loteAtual, totalLotes, tickersProcessados, tickersNomesAtual } = syncProgress;
  const percent = Math.round((loteAtual / totalLotes) * 100);

  return (
    <div className="sync-bar-wrapper">
      <div className="sync-bar-inner">
        <div className="sync-bar-header">
          <span className="sync-bar-label">
            ⚡ Sincronizando lote {loteAtual}/{totalLotes}
          </span>
          <span className="sync-bar-percent"> - {percent}%</span>
        </div>
        <div className="sync-bar-track">
          <div
            className="sync-bar-fill"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="sync-bar-detail">
          Buscando: {tickersNomesAtual} · {tickersProcessados} ativos processados
        </p>
      </div>
    </div>
  );
}
