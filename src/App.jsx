// src/App.jsx
import { StockProvider } from './context/StockContext';
import Header from './components/Header';
import Dashboard from './components/Dashboard';

export default function App() {
  return (
    <StockProvider>
      <div className="app-root">
        <Header />
        <Dashboard />
      </div>
    </StockProvider>
  );
}
