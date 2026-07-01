import React, { useState } from 'react';
import { parseB3Excel } from '../../services/portfolioService';
import { usePortfolio } from '../../context/PortfolioContext';

export default function PortfolioImport({ onClose }) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { addPosicoesLote } = usePortfolio();

  async function handleFile(file) {
    setLoading(true);
    setError('');
    try {
      const posicoes = await parseB3Excel(file);
      setPreview(posicoes);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function confirmImport() {
    await addPosicoesLote(preview);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '600px' }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>📥 Importar Carteira da B3</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-secondary)' }}>✕</button>
        </div>

        <div className="modal-body">
          <ol className="import-steps">
            <li>Acesse <a href="https://cei.b3.com.br" target="_blank" rel="noreferrer" style={{color: 'var(--primary)'}}>cei.b3.com.br</a></li>
            <li>Login com CPF e senha</li>
            <li>Vá em <strong>Extrato → Posição Consolidada</strong></li>
            <li>Clique em <strong>Exportar → Excel</strong></li>
            <li>Arraste o arquivo abaixo 👇</li>
          </ol>

          {!preview ? (
            <div
              className={`drop-zone ${dragging ? 'drop-zone-active' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".xls,.xlsx,.csv"
                onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
                style={{ display: 'none' }}
                id="b3-file-input"
              />
              <label htmlFor="b3-file-input" style={{ cursor: 'pointer', display: 'block' }}>
                {loading ? '⏳ Processando...' : '📂 Arraste o arquivo aqui ou clique para selecionar'}
              </label>
            </div>
          ) : (
            <div style={{ marginTop: '24px' }}>
              <p style={{ color: 'var(--green)', fontWeight: 600 }}>✅ {preview.length} posições encontradas:</p>
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: '8px', marginTop: '12px' }}>
                <table className="valuation-table" style={{ margin: 0 }}>
                  <thead><tr><th>Ticker</th><th>Quantidade</th><th>Preço Médio</th></tr></thead>
                  <tbody>
                    {preview.map(p => (
                      <tr key={p.ticker}>
                        <td>{p.ticker}</td>
                        <td>{p.quantidade}</td>
                        <td>R$ {p.precoMedio.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && <p className="status-err" style={{ color: 'var(--red)', marginTop: '16px' }}>❌ {error}</p>}
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
          {preview && (
            <button className="btn btn-primary" onClick={confirmImport} style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              Importar {preview.length} posições
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
