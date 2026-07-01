// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StockProvider } from './context/StockContext';
import { AuthProvider } from './context/AuthContext';
import { FIIProvider } from './context/FIIContext';
import { ETFProvider } from './context/ETFContext';
import { PortfolioProvider } from './context/PortfolioContext';
import AuthGuard from './components/auth/AuthGuard';
import Dashboard from './components/Dashboard';
import EmailConfirmPage from './components/auth/EmailConfirmPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StockProvider>
          <FIIProvider>
            <ETFProvider>
              <PortfolioProvider>
                <Routes>
                  <Route path="/auth/confirm" element={<EmailConfirmPage />} />
                  <Route path="*" element={
                    <AuthGuard>
                      <div className="app-root">
                        <Dashboard />
                      </div>
                    </AuthGuard>
                  } />
                </Routes>
              </PortfolioProvider>
            </ETFProvider>
          </FIIProvider>
        </StockProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
