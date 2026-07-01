import React from 'react';
import { useStocks } from '../context/StockContext';

const IconAI = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="url(#purpleGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <defs>
      <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8A2BE2" />
        <stop offset="100%" stopColor="#4169E1" />
      </linearGradient>
    </defs>
    <path d="M12 2a10 10 0 0 1 10 10v4a2 2 0 0 1-2 2h-1.5a1.5 1.5 0 0 1-1.5-1.5v-5a1.5 1.5 0 0 1 1.5-1.5H22"/>
    <path d="M2 12a10 10 0 0 1 10-10"/>
    <path d="M2 12v4a2 2 0 0 0 2 2h1.5a1.5 1.5 0 0 0 1.5-1.5v-5a1.5 1.5 0 0 0-1.5-1.5H2"/>
    <path d="M12 22a10 10 0 0 0 10-10"/>
  </svg>
);

export default function SyncModal() {
  const { isLoading, isSyncing, syncProgress } = useStocks();

  if (!isLoading && !isSyncing) return null;

  const progress = syncProgress && syncProgress.totalLotes > 0 ? Math.round((syncProgress.loteAtual / syncProgress.totalLotes) * 100) : (isLoading ? 10 : 100);

  let activeStep = 1;
  if (progress > 10) activeStep = 2;
  if (progress > 50) activeStep = 3;
  if (progress > 90) activeStep = 4;

  return (
    <div className="sync-modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div className="sync-modal-card" style={{
        background: 'var(--bg-surface)',
        borderRadius: '16px',
        width: '100%', maxWidth: '500px',
        padding: '40px 32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '1px solid var(--border-light)',
        display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        
        <div style={{ marginBottom: '24px' }}>
          <IconAI />
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '32px' }}>
          Sincronizando Dados...
        </h2>

        <div style={{ width: '100%', marginBottom: '12px', background: 'var(--bg-app)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ 
            height: '100%', 
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #8A2BE2 0%, #4169E1 100%)',
            transition: 'width 0.3s ease-out'
          }}></div>
        </div>
        <div style={{ color: '#8A2BE2', fontWeight: 600, fontSize: '14px', marginBottom: '40px' }}>
          {progress}% completado
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: activeStep >= 1 ? 1 : 0.4 }}>
            <div style={{ 
              width: '12px', height: '12px', borderRadius: '50%', 
              background: activeStep === 1 ? '#8A2BE2' : (activeStep > 1 ? '#4169E1' : 'var(--border-light)'),
              boxShadow: activeStep === 1 ? '0 0 0 3px rgba(138, 43, 226, 0.2)' : 'none'
            }}></div>
            <span style={{ fontSize: '14px', color: activeStep >= 1 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              Conectando ao banco de dados e obtendo tickers
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: activeStep >= 2 ? 1 : 0.4 }}>
            <div style={{ 
              width: '12px', height: '12px', borderRadius: '50%', 
              background: activeStep === 2 ? '#8A2BE2' : (activeStep > 2 ? '#4169E1' : 'var(--border-light)'),
              boxShadow: activeStep === 2 ? '0 0 0 3px rgba(138, 43, 226, 0.2)' : 'none'
            }}></div>
            <span style={{ fontSize: '14px', color: activeStep >= 2 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              Baixando cotações e fundamentos (Yahoo/StatusInvest)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: activeStep >= 3 ? 1 : 0.4 }}>
            <div style={{ 
              width: '12px', height: '12px', borderRadius: '50%', 
              background: activeStep === 3 ? '#8A2BE2' : (activeStep > 3 ? '#4169E1' : 'var(--border-light)'),
              boxShadow: activeStep === 3 ? '0 0 0 3px rgba(138, 43, 226, 0.2)' : 'none'
            }}></div>
            <span style={{ fontSize: '14px', color: activeStep >= 3 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              Calculando valuation (Graham, Bazin, Piotroski)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: activeStep >= 4 ? 1 : 0.4 }}>
            <div style={{ 
              width: '12px', height: '12px', borderRadius: '50%', 
              background: activeStep === 4 ? '#8A2BE2' : (activeStep > 4 ? '#4169E1' : 'var(--border-light)'),
              boxShadow: activeStep === 4 ? '0 0 0 3px rgba(138, 43, 226, 0.2)' : 'none'
            }}></div>
            <span style={{ fontSize: '14px', color: activeStep >= 4 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              Otimizando ranking de investimentos
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
