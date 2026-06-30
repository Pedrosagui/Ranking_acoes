// src/App.jsx
import { StockProvider } from './context/StockContext';
import Dashboard from './components/Dashboard';

export default function App() {
  return (
    <StockProvider>
      <div className="app-root">
        <Dashboard />
      </div>
    </StockProvider>
  );
}
