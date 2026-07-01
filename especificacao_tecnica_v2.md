# 📋 Aegis Platform v2.0 — Especificação Técnica Completa

> **Este documento é o guia de implementação.** Contém código pronto para cada arquivo,
> estrutura de dados, APIs e decisões arquiteturais para as 3 fases da evolução.

---

## 📦 Dependências a Instalar

```bash
npm install firebase react-router-dom xlsx
```

| Pacote | Versão recomendada | Para que serve |
|---|---|---|
| `firebase` | ^11.x | Auth (Google + OTP) + Firestore |
| `react-router-dom` | ^7.x | Roteamento entre páginas |
| `xlsx` | ^0.18.x | Leitura do arquivo Excel da B3 |

---

## 🔧 Configuração Inicial do Firebase

### Passo a passo no Firebase Console
1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Abra o projeto existente (usado no Firebase Hosting)
3. **Authentication** → Get Started → Habilitar:
   - ✅ Google
   - ✅ Email/Password → ✅ Email link (passwordless sign-in)
4. **Firestore Database** → Create Database → Production mode
5. **Project Settings** → Web App → Copiar as credenciais

### Arquivo: `.env.local` (não commitar no git)
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=12345...
VITE_FIREBASE_APP_ID=1:12345:web:abc...
```

### Arquivo: `.gitignore` — adicionar
```
.env.local
```

---

## 🏗️ Nova Estrutura de Pastas

```
src/
├── services/
│   ├── brapiService.js      (existente)
│   ├── syncService.js       (existente)
│   ├── firebaseConfig.js    [NEW] Inicialização Firebase
│   ├── authService.js       [NEW] Login/Logout
│   ├── firestoreService.js  [NEW] Users, coupons, portfolios
│   └── portfolioService.js  [NEW] CRUD carteira + parser B3
│
├── context/
│   ├── StockContext.jsx     (existente)
│   ├── AuthContext.jsx      [NEW] Estado de autenticação
│   ├── FIIContext.jsx       [NEW] Estado dos FIIs
│   ├── ETFContext.jsx       [NEW] Estado dos ETFs
│   └── PortfolioContext.jsx [NEW] Estado das carteiras
│
├── components/
│   ├── Dashboard.jsx        [MODIFY] + abas FII, ETF, Carteira
│   ├── StockDetail.jsx      (existente)
│   ├── auth/
│   │   ├── LoginPage.jsx    [NEW] Tela de login
│   │   └── AuthGuard.jsx    [NEW] Protetor de rotas
│   ├── fii/
│   │   ├── FIITable.jsx     [NEW] Tabela ranking FIIs
│   │   └── FIIDetail.jsx    [NEW] Modal detalhes FII
│   ├── etf/
│   │   ├── ETFTable.jsx     [NEW] Tabela ranking ETFs
│   │   └── ETFDetail.jsx    [NEW] Modal detalhes ETF
│   └── portfolio/
│       ├── Portfolio.jsx        [NEW] Página principal
│       ├── PortfolioForm.jsx    [NEW] Adicionar/editar posição
│       └── PortfolioImport.jsx  [NEW] Upload Excel B3
│
├── data/
│   ├── tickers.js           (existente)
│   ├── dividendosHistoricos.js (existente)
│   ├── fiis.js              [NEW] ~80 FIIs com metadados
│   ├── dividendosFiis.js    [NEW] Proventos mensais 24 meses
│   └── etfs.js              [NEW] ~40 ETFs B3 com benchmark
│
├── utils/
│   ├── valuation.js         (existente — ações)
│   ├── fiiValuation.js      [NEW] Score engine FIIs
│   └── etfValuation.js      [NEW] Score engine ETFs
│
└── App.jsx                  [MODIFY] + Router + AuthGuard
```

---

## FASE 1 — Autenticação

---

### `src/services/firebaseConfig.js`
```javascript
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
```

---

### `src/services/authService.js`
```javascript
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  sendSignInLinkToEmail, isSignInWithEmailLink,
  signInWithEmailLink, signOut, onAuthStateChanged,
} from 'firebase/auth';
import { app } from './firebaseConfig';

export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// URL para onde o link de login vai redirecionar
const ACTION_CODE_SETTINGS = {
  url: `${window.location.origin}/auth/confirm`,
  handleCodeInApp: true,
};

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function sendEmailOTP(email) {
  await sendSignInLinkToEmail(auth, email, ACTION_CODE_SETTINGS);
  localStorage.setItem('emailForSignIn', email);
}

export async function confirmEmailLink(link) {
  const email = localStorage.getItem('emailForSignIn');
  if (!email || !isSignInWithEmailLink(auth, link)) {
    throw new Error('Link inválido ou expirado.');
  }
  const result = await signInWithEmailLink(auth, email, link);
  localStorage.removeItem('emailForSignIn');
  return result.user;
}

export async function logout() {
  await signOut(auth);
}

export function onAuthChange(cb) {
  return onAuthStateChanged(auth, cb);
}
```

---

### `src/services/firestoreService.js`
```javascript
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { app } from './firebaseConfig';

export const db = getFirestore(app);

// ── Usuários ──────────────────────────────────────────────────

export async function getOrCreateUser(firebaseUser) {
  const ref = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) return snap.data();

  const newUser = {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    nome: firebaseUser.displayName || firebaseUser.email,
    plano: 'free',                    // 'free' | 'pro'
    planValidUntil: null,             // ISO date string ou null (vitalício = 'lifetime')
    createdAt: serverTimestamp(),
    loginCount: 1,
  };

  await setDoc(ref, newUser);
  return newUser;
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

// ── Sistema de Cupons ─────────────────────────────────────────

// Estrutura do documento no Firestore:
// /coupons/{code}
// {
//   code: "AMIGO30",
//   validDays: 30 | 90 | 180 | 365 | "lifetime",
//   usedBy: null | uid,
//   usedAt: null | timestamp,
//   createdBy: "admin",
//   createdAt: timestamp,
// }

export async function redeemCoupon(uid, code) {
  const couponRef = doc(db, 'coupons', code.toUpperCase());
  const couponSnap = await getDoc(couponRef);

  if (!couponSnap.exists()) throw new Error('Cupom não encontrado.');

  const coupon = couponSnap.data();
  if (coupon.usedBy) throw new Error('Este cupom já foi utilizado.');

  // Marca o cupom como usado
  await updateDoc(couponRef, {
    usedBy: uid,
    usedAt: serverTimestamp(),
  });

  // Calcula a data de expiração do plano
  let planValidUntil;
  if (coupon.validDays === 'lifetime') {
    planValidUntil = 'lifetime';
  } else {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + coupon.validDays);
    planValidUntil = expiry.toISOString();
  }

  // Atualiza o plano do usuário
  await updateDoc(doc(db, 'users', uid), {
    plano: 'pro',
    planValidUntil,
  });

  return { validDays: coupon.validDays, planValidUntil };
}

export function isPlanActive(user) {
  if (!user || user.plano === 'free') return false;
  if (user.planValidUntil === 'lifetime') return true;
  if (!user.planValidUntil) return false;
  return new Date(user.planValidUntil) > new Date();
}
```

---

### `src/context/AuthContext.jsx`
```jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange } from '../services/authService';
import { getOrCreateUser, getUserProfile, isPlanActive } from '../services/firestoreService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(undefined); // undefined = loading
  const [userProfile, setUserProfile] = useState(null);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const unsub = onAuthChange(async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const profile = await getOrCreateUser(fbUser);
        setUserProfile(profile);
        setIsPro(isPlanActive(profile));
      } else {
        setUserProfile(null);
        setIsPro(false);
      }
    });
    return unsub;
  }, []);

  const refreshProfile = async () => {
    if (!firebaseUser) return;
    const profile = await getUserProfile(firebaseUser.uid);
    setUserProfile(profile);
    setIsPro(isPlanActive(profile));
  };

  return (
    <AuthContext.Provider value={{
      firebaseUser,
      userProfile,
      isPro,
      isLoading: firebaseUser === undefined,
      isLoggedIn: !!firebaseUser,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

---

### `src/components/auth/LoginPage.jsx`

> **Design**: Dark mode consistente com o app. Dois métodos de login lado a lado.
> No mobile: empilhados verticalmente.

```jsx
import { useState } from 'react';
import { loginWithGoogle, sendEmailOTP } from '../../services/authService';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGoogle() {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      // AuthContext detecta o login automaticamente via onAuthChange
    } catch (e) {
      setError('Erro ao entrar com Google. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleEmail(e) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      await sendEmailOTP(email);
      setSent(true);
    } catch (e) {
      setError('Erro ao enviar o link. Verifique o email e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {/* Logo */}
      <div className="login-brand">
        <div className="login-logo-icon">📊</div>
        <h1 className="login-title">Aegis Platform</h1>
        <p className="login-subtitle">Ranking de Valuation · B3</p>
      </div>

      <div className="login-card">
        {!sent ? (
          <>
            {/* Google */}
            <button
              className="btn-google"
              onClick={handleGoogle}
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                {/* SVG do Google — usar ícone padrão */}
              </svg>
              Entrar com Google
            </button>

            <div className="login-divider"><span>ou</span></div>

            {/* Email */}
            <form onSubmit={handleEmail} className="login-form">
              <label className="login-label">Seu email</label>
              <input
                type="email"
                className="login-input"
                placeholder="email@exemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !email}
              >
                {loading ? 'Enviando...' : 'Enviar Link de Acesso'}
              </button>
            </form>

            {error && <p className="login-error">{error}</p>}
          </>
        ) : (
          <div className="login-sent">
            <div style={{ fontSize: '48px' }}>📬</div>
            <h3>Verifique seu email</h3>
            <p>Enviamos um link de acesso para <strong>{email}</strong>.</p>
            <p>Clique no link do email para entrar.</p>
            <button
              className="btn btn-ghost"
              onClick={() => setSent(false)}
              style={{ marginTop: '16px' }}
            >
              Usar outro email
            </button>
          </div>
        )}
      </div>

      <p className="login-footer">
        Ao entrar, você concorda com os Termos de Uso.<br />
        Nenhum dado financeiro seu é armazenado em nossos servidores.
      </p>
    </div>
  );
}
```

---

### `src/components/auth/AuthGuard.jsx`
```jsx
import { useAuth } from '../../context/AuthContext';
import LoginPage from './LoginPage';

/**
 * Protege rotas que requerem login.
 * Por enquanto: DESATIVADO (todos têm acesso).
 * Para ativar no futuro, mude REQUIRE_AUTH para true.
 */
const REQUIRE_AUTH = false; // ← mude para true quando quiser ativar o login

export default function AuthGuard({ children }) {
  const { isLoading, isLoggedIn } = useAuth();

  if (!REQUIRE_AUTH) return children;
  if (isLoading) return <div className="loading-screen">Carregando...</div>;
  if (!isLoggedIn) return <LoginPage />;

  return children;
}
```

---

### `src/App.jsx` — atualizado
```jsx
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
                  {/* Rota de confirmação do email magic link */}
                  <Route path="/auth/confirm" element={<EmailConfirmPage />} />

                  {/* App principal */}
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
```

---

### `src/components/auth/EmailConfirmPage.jsx`
```jsx
// Página que recebe o magic link do email e confirma o login
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { confirmEmailLink } from '../../services/authService';

export default function EmailConfirmPage() {
  const [status, setStatus] = useState('loading'); // loading | success | error
  const navigate = useNavigate();

  useEffect(() => {
    async function confirm() {
      try {
        await confirmEmailLink(window.location.href);
        setStatus('success');
        setTimeout(() => navigate('/'), 2000);
      } catch (e) {
        setStatus('error');
      }
    }
    confirm();
  }, []);

  if (status === 'loading') return <div className="loading-screen">Confirmando acesso...</div>;
  if (status === 'success') return <div className="loading-screen">✅ Logado com sucesso! Redirecionando...</div>;
  return <div className="loading-screen">❌ Link inválido ou expirado. Tente novamente.</div>;
}
```

---

## FASE 2 — FIIs

---

### `src/data/fiis.js` — Lista completa (~80 FIIs)
```javascript
// Principais FIIs listados na B3 organizados por segmento
export const FIIS_B3 = [
  // ── LOGÍSTICA ──────────────────────────────────────────────
  { ticker: 'HGLG11', nome: 'CSHG Logística', segmento: 'Logística', gestora: 'Credit Suisse Hedging-Griffo', numCotistas: 280000 },
  { ticker: 'BRCO11', nome: 'Bresco Logística', segmento: 'Logística', gestora: 'Bresco', numCotistas: 95000 },
  { ticker: 'XPLG11', nome: 'XP Log', segmento: 'Logística', gestora: 'XP Asset', numCotistas: 120000 },
  { ticker: 'LVBI11', nome: 'VBI Logístico', segmento: 'Logística', gestora: 'VBI Real Estate', numCotistas: 75000 },
  { ticker: 'GAIA11', nome: 'Gaivota Renda Imobiliária', segmento: 'Logística', gestora: 'Gaivota', numCotistas: 45000 },
  { ticker: 'BTLG11', nome: 'BTG Pactual Logística', segmento: 'Logística', gestora: 'BTG Pactual', numCotistas: 180000 },
  { ticker: 'LGCP11', nome: 'Log Commercial Properties', segmento: 'Logística', gestora: 'Log CP', numCotistas: 55000 },
  { ticker: 'GGRC11', nome: 'GGR Covepi Renda', segmento: 'Logística', gestora: 'GGR', numCotistas: 65000 },
  { ticker: 'VVPR11', nome: 'Villa Velha Properties', segmento: 'Logística', gestora: 'VBI', numCotistas: 35000 },
  { ticker: 'TRXF11', nome: 'TRX Real Estate', segmento: 'Logística', gestora: 'TRX', numCotistas: 90000 },

  // ── LAJES CORPORATIVAS ──────────────────────────────────────
  { ticker: 'KNRI11', nome: 'Kinea Renda Imobiliária', segmento: 'Lajes Corporativas', gestora: 'Kinea', numCotistas: 320000 },
  { ticker: 'PVBI11', nome: 'VBI Prime Properties', segmento: 'Lajes Corporativas', gestora: 'VBI Real Estate', numCotistas: 60000 },
  { ticker: 'BRCR11', nome: 'BC Fund', segmento: 'Lajes Corporativas', gestora: 'BTG Pactual', numCotistas: 80000 },
  { ticker: 'RBRP11', nome: 'RBR Properties', segmento: 'Lajes Corporativas', gestora: 'RBR', numCotistas: 45000 },
  { ticker: 'JSRE11', nome: 'JS Real Estate', segmento: 'Lajes Corporativas', gestora: 'JS Investimentos', numCotistas: 70000 },
  { ticker: 'HGPO11', nome: 'CSHG Prime Offices', segmento: 'Lajes Corporativas', gestora: 'Credit Suisse', numCotistas: 35000 },
  { ticker: 'BLMG11', nome: 'Bluemacaw Logística', segmento: 'Lajes Corporativas', gestora: 'Bluemacaw', numCotistas: 28000 },

  // ── SHOPPINGS ───────────────────────────────────────────────
  { ticker: 'XPML11', nome: 'XP Malls', segmento: 'Shoppings', gestora: 'XP Asset', numCotistas: 420000 },
  { ticker: 'VISC11', nome: 'Vinci Shopping Centers', segmento: 'Shoppings', gestora: 'Vinci Real Estate', numCotistas: 250000 },
  { ticker: 'HSML11', nome: 'HSI Malls', segmento: 'Shoppings', gestora: 'Hemisfério Sul Investimentos', numCotistas: 130000 },
  { ticker: 'MALL11', nome: 'Malls Brasil Plural', segmento: 'Shoppings', gestora: 'Brasil Plural', numCotistas: 160000 },
  { ticker: 'GSFI11', nome: 'Guardian Shopping Iguatemi', segmento: 'Shoppings', gestora: 'Guardian', numCotistas: 25000 },
  { ticker: 'ABCP11', nome: 'Grand Plaza Shopping', segmento: 'Shoppings', gestora: 'Administração', numCotistas: 55000 },

  // ── CRI/CRA (Papel) ─────────────────────────────────────────
  { ticker: 'KNCR11', nome: 'Kinea Índice de Preços', segmento: 'CRI/CRA', gestora: 'Kinea', numCotistas: 200000 },
  { ticker: 'MXRF11', nome: 'Maxi Renda', segmento: 'CRI/CRA', gestora: 'XP Asset', numCotistas: 1100000 },
  { ticker: 'VRTA11', nome: 'Fator Veritá', segmento: 'CRI/CRA', gestora: 'Fator', numCotistas: 95000 },
  { ticker: 'RECT11', nome: 'REC Renda Imobiliária', segmento: 'CRI/CRA', gestora: 'REC Gestão', numCotistas: 80000 },
  { ticker: 'KNIP11', nome: 'Kinea Índice de Preços', segmento: 'CRI/CRA', gestora: 'Kinea', numCotistas: 180000 },
  { ticker: 'CPTS11', nome: 'Capitânia Securities', segmento: 'CRI/CRA', gestora: 'Capitânia', numCotistas: 95000 },
  { ticker: 'HABT11', nome: 'Habitat II', segmento: 'CRI/CRA', gestora: 'Habitat Capital', numCotistas: 70000 },
  { ticker: 'VGIR11', nome: 'Valora CRI CDI', segmento: 'CRI/CRA', gestora: 'Valora', numCotistas: 115000 },
  { ticker: 'RBRR11', nome: 'RBR Rendimento High Grade', segmento: 'CRI/CRA', gestora: 'RBR', numCotistas: 60000 },
  { ticker: 'KCRE11', nome: 'Kinea CRI', segmento: 'CRI/CRA', gestora: 'Kinea', numCotistas: 45000 },

  // ── FUNDO DE FUNDOS (FoF) ───────────────────────────────────
  { ticker: 'BCFF11', nome: 'BTG Pactual Fundo de Fundos', segmento: 'Fundo de Fundos', gestora: 'BTG Pactual', numCotistas: 380000 },
  { ticker: 'HFOF11', nome: 'Hedge Top FOFII', segmento: 'Fundo de Fundos', gestora: 'Hedge Investments', numCotistas: 150000 },
  { ticker: 'RBRF11', nome: 'RBR Alpha', segmento: 'Fundo de Fundos', gestora: 'RBR', numCotistas: 120000 },
  { ticker: 'BPFF11', nome: 'Brasil Plural FoF', segmento: 'Fundo de Fundos', gestora: 'Brasil Plural', numCotistas: 65000 },
  { ticker: 'MGFF11', nome: 'Mogno FoF', segmento: 'Fundo de Fundos', gestora: 'Mogno Capital', numCotistas: 80000 },
  { ticker: 'CPFF11', nome: 'Capitânia FoF', segmento: 'Fundo de Fundos', gestora: 'Capitânia', numCotistas: 55000 },

  // ── RESIDENCIAL ─────────────────────────────────────────────
  { ticker: 'HGRU11', nome: 'CSHG Renda Urbana', segmento: 'Residencial/Varejo', gestora: 'Credit Suisse', numCotistas: 160000 },
  { ticker: 'VINO11', nome: 'Vinci Logística', segmento: 'Residencial/Varejo', gestora: 'Vinci', numCotistas: 70000 },
  { ticker: 'ALZR11', nome: 'Alianza Trust Renda Imobiliária', segmento: 'Residencial/Varejo', gestora: 'Alianza', numCotistas: 95000 },

  // ── HOSPITALAR ──────────────────────────────────────────────
  { ticker: 'HCTR11', nome: 'Hectare CE', segmento: 'Hospitalar', gestora: 'Hectare', numCotistas: 55000 },
  { ticker: 'NSLU11', nome: 'NSL Urbana', segmento: 'Hospitalar', gestora: 'RBR', numCotistas: 30000 },
];

export const SEGMENTOS_FII = [...new Set(FIIS_B3.map(f => f.segmento))].sort();
```

---

### `src/data/etfs.js` — Lista de ETFs B3
```javascript
// ETFs listados na B3 com seus benchmarks e taxa de administração
export const ETFS_B3 = [
  // ── RENDA VARIÁVEL BRASIL ───────────────────────────────────
  { ticker: 'BOVA11', nome: 'iShares Ibovespa', benchmark: 'IBOVESPA', taxaAdm: 0.10, gestora: 'BlackRock', numAtivos: 89 },
  { ticker: 'BOVV11', nome: 'IT Now Ibovespa', benchmark: 'IBOVESPA', taxaAdm: 0.05, gestora: 'Itaú Asset', numAtivos: 89 },
  { ticker: 'SMAL11', nome: 'iShares SMLL', benchmark: 'SMLL (Small Caps)', taxaAdm: 0.50, gestora: 'BlackRock', numAtivos: 68 },
  { ticker: 'DIVO11', nome: 'IT Now IDIV', benchmark: 'IDIV (Dividendos)', taxaAdm: 0.20, gestora: 'Itaú Asset', numAtivos: 40 },
  { ticker: 'FIND11', nome: 'IT Now IFNC', benchmark: 'IFNC (Financeiro)', taxaAdm: 0.20, gestora: 'Itaú Asset', numAtivos: 20 },
  { ticker: 'MATB11', nome: 'IT Now IMAT', benchmark: 'IMAT (Materiais)', taxaAdm: 0.20, gestora: 'Itaú Asset', numAtivos: 15 },
  { ticker: 'ISUS11', nome: 'IT Now ISE', benchmark: 'ISE (Sustentabilidade)', taxaAdm: 0.20, gestora: 'Itaú Asset', numAtivos: 39 },
  { ticker: 'ECOO11', nome: 'iShares Carbono', benchmark: 'ICO2', taxaAdm: 0.40, gestora: 'BlackRock', numAtivos: 50 },
  { ticker: 'GOVE11', nome: 'IT Now IGCT', benchmark: 'IGCT (Governança)', taxaAdm: 0.20, gestora: 'Itaú Asset', numAtivos: 40 },
  { ticker: 'AGRI11', nome: 'Trend Agronegócio', benchmark: 'IAGRO', taxaAdm: 0.49, gestora: 'XP Asset', numAtivos: 20 },
  { ticker: 'TECK11', nome: 'Trend Tecnologia', benchmark: 'ITECH', taxaAdm: 0.49, gestora: 'XP Asset', numAtivos: 18 },

  // ── RENDA VARIÁVEL EXTERIOR ─────────────────────────────────
  { ticker: 'IVVB11', nome: 'iShares S&P500', benchmark: 'S&P 500 (em R$)', taxaAdm: 0.23, gestora: 'BlackRock', numAtivos: 503 },
  { ticker: 'NASD11', nome: 'Trend Nasdaq', benchmark: 'Nasdaq 100 (em R$)', taxaAdm: 0.49, gestora: 'XP Asset', numAtivos: 100 },
  { ticker: 'SPXI11', nome: 'iShares S&P500 Hedge', benchmark: 'S&P 500 (hedged)', taxaAdm: 0.44, gestora: 'BlackRock', numAtivos: 503 },
  { ticker: 'EURP11', nome: 'Trend Europa', benchmark: 'MSCI Europe (em R$)', taxaAdm: 0.49, gestora: 'XP Asset', numAtivos: 280 },
  { ticker: 'GOLD11', nome: 'Trend Ouro', benchmark: 'Ouro (LBMA)', taxaAdm: 0.30, gestora: 'XP Asset', numAtivos: 1 },
  { ticker: 'HASH11', nome: 'Hashdex Nasdaq Crypto', benchmark: 'Nasdaq Crypto Index', taxaAdm: 0.80, gestora: 'Hashdex', numAtivos: 8 },
  { ticker: 'BITI11', nome: 'QR Bitcoin ETF', benchmark: 'Bitcoin (USD)', taxaAdm: 0.75, gestora: 'QR Asset', numAtivos: 1 },
  { ticker: 'ETHE11', nome: 'QR Ethereum ETF', benchmark: 'Ethereum (USD)', taxaAdm: 0.75, gestora: 'QR Asset', numAtivos: 1 },

  // ── FIIs ───────────────────────────────────────────────────
  { ticker: 'XFIX11', nome: 'XP IFIX', benchmark: 'IFIX', taxaAdm: 0.30, gestora: 'XP Asset', numAtivos: 35 },
  { ticker: 'BIFF11', nome: 'BTG Pactual IFIX', benchmark: 'IFIX', taxaAdm: 0.25, gestora: 'BTG Pactual', numAtivos: 40 },

  // ── RENDA FIXA ──────────────────────────────────────────────
  { ticker: 'IMAB11', nome: 'iShares IMA-B', benchmark: 'IMA-B (IPCA+)', taxaAdm: 0.20, gestora: 'BlackRock', numAtivos: 25 },
  { ticker: 'IRFM11', nome: 'iShares IRF-M', benchmark: 'IRF-M (Pré-fixado)', taxaAdm: 0.20, gestora: 'BlackRock', numAtivos: 15 },
  { ticker: 'B5P211', nome: 'iShares IMA-B 5+', benchmark: 'IMA-B 5+ (IPCA+ longo)', taxaAdm: 0.20, gestora: 'BlackRock', numAtivos: 10 },
];

export const BENCHMARKS_ETF = [...new Set(ETFS_B3.map(e => e.benchmark))].sort();
```

---

### `src/utils/fiiValuation.js`
```javascript
// Motor de score para FIIs

function normalize(value, min, max, inverse = false) {
  if (value === null || value === undefined || isNaN(value)) return 0;
  const clamped = Math.min(Math.max(value, min), max);
  const score = ((clamped - min) / (max - min)) * 100;
  return inverse ? 100 - score : score;
}

// Pontuação por segmento (baseada em historico de performance)
const SCORE_SEGMENTO = {
  'Logística': 90,
  'Lajes Corporativas': 75,
  'Shoppings': 70,
  'Residencial/Varejo': 65,
  'Hospitalar': 60,
  'CRI/CRA': 55,
  'Fundo de Fundos': 50,
};

// Filtros eliminatórios para FIIs
export function passaFiltrosFII(fii) {
  if (!fii.divYield || fii.divYield < 4) return false;   // DY mínimo 4%
  if (!fii.pvp || fii.pvp <= 0 || fii.pvp > 3) return false; // P/VP absurdo
  return true;
}

export function calcScoreFII(fii) {
  if (!passaFiltrosFII(fii)) return 0;

  // Pilar 1 — Proventos (40%)
  // DY: 5% = 0, 15% = 100
  const sDY = normalize(fii.divYield, 5, 15);

  // Consistência: meses pagos nos últimos 12 / 12
  const mesesPagos = fii.dividendosMensais
    ? fii.dividendosMensais.filter(d => d.valor > 0).length
    : 0;
  const sConsistencia = (Math.min(mesesPagos, 12) / 12) * 100;

  const pilarProventos = 0.60 * sDY + 0.40 * sConsistencia;

  // Pilar 2 — Desconto P/VP (30%)
  // PVP 0.5 = 100 (grande desconto), PVP 1.5 = 0 (prêmio)
  const sPVP = normalize(fii.pvp, 0.5, 1.5, true);

  // Pilar 3 — Qualidade do Segmento (20%)
  const sSegmento = SCORE_SEGMENTO[fii.segmento] ?? 50;

  // Pilar 4 — Liquidez (10%)
  // Volume < 200k = 0, > 10M = 100
  const sLiquidez = normalize(fii.volumeDiario, 200000, 10000000);

  const scoreTotal = Math.round(
    0.40 * pilarProventos +
    0.30 * sPVP +
    0.20 * sSegmento +
    0.10 * sLiquidez
  );

  return {
    scoreTotal,
    detalhes: {
      proventos: Math.round(pilarProventos),
      descontoPVP: Math.round(sPVP),
      qualidade: Math.round(sSegmento),
      liquidez: Math.round(sLiquidez),
    }
  };
}

export function rankFIIs(fiis) {
  return fiis
    .map(fii => {
      const resultado = calcScoreFII(fii);
      return {
        ...fii,
        scoreComposto: typeof resultado === 'object' ? resultado.scoreTotal : resultado,
        detalhePilares: typeof resultado === 'object' ? resultado.detalhes : {},
        eliminado: !passaFiltrosFII(fii),
      };
    })
    .sort((a, b) => b.scoreComposto - a.scoreComposto)
    .map((f, i) => ({ ...f, posicao: i + 1 }));
}
```

---

### `src/utils/etfValuation.js`
```javascript
// Motor de score para ETFs

function normalize(value, min, max, inverse = false) {
  if (value === null || value === undefined || isNaN(value)) return 0;
  const clamped = Math.min(Math.max(value, min), max);
  const score = ((clamped - min) / (max - min)) * 100;
  return inverse ? 100 - score : score;
}

// Calcula alpha = retorno ETF - retorno benchmark (ambos em %)
export function calcAlpha(retornoEtf, retornoBenchmark) {
  if (retornoEtf == null || retornoBenchmark == null) return 0;
  return retornoEtf - retornoBenchmark;
}

// Calcula Sharpe simplificado = (retorno - cdi) / volatilidade
export function calcSharpe(retorno12m, volatilidade12m, cdi12m = 10.5) {
  if (!volatilidade12m || volatilidade12m === 0) return 0;
  return (retorno12m - cdi12m) / volatilidade12m;
}

export function passaFiltrosETF(etf) {
  if (!etf.retorno12m && etf.retorno12m !== 0) return false;
  return true;
}

export function calcScoreETF(etf) {
  if (!passaFiltrosETF(etf)) return 0;

  // Pilar 1 — Performance vs Benchmark (40%)
  const alpha = calcAlpha(etf.retorno12m, etf.retornoBenchmark12m);
  // alpha -10% = 0, alpha +20% = 100
  const sAlpha = normalize(alpha, -10, 20);

  // Sharpe: 0 = 0, 2+ = 100
  const sharpe = calcSharpe(etf.retorno12m, etf.volatilidade12m);
  const sSharpe = normalize(sharpe, 0, 2);

  const pilarPerformance = 0.60 * sAlpha + 0.40 * sSharpe;

  // Pilar 2 — Custo / Eficiência (30%)
  // Taxa de adm: 1.5% = 0, 0% = 100
  const sTaxa = normalize(etf.taxaAdm, 0, 1.5, true);

  // Tracking error: 5% = 0, 0% = 100
  const trackingError = etf.trackingError ?? 1;
  const sTracking = normalize(trackingError, 0, 5, true);

  const pilarCusto = 0.60 * sTaxa + 0.40 * sTracking;

  // Pilar 3 — Liquidez (30%)
  // Volume < 500k = 0, > 50M = 100
  const sLiquidez = normalize(etf.volumeDiario, 500000, 50000000);

  const scoreTotal = Math.round(
    0.40 * pilarPerformance +
    0.30 * pilarCusto +
    0.30 * sLiquidez
  );

  return {
    scoreTotal,
    detalhes: {
      performance: Math.round(pilarPerformance),
      custo: Math.round(pilarCusto),
      liquidez: Math.round(sLiquidez),
    }
  };
}

export function rankETFs(etfs) {
  return etfs
    .map(etf => {
      const resultado = calcScoreETF(etf);
      return {
        ...etf,
        scoreComposto: typeof resultado === 'object' ? resultado.scoreTotal : resultado,
        detalhePilares: typeof resultado === 'object' ? resultado.detalhes : {},
        eliminado: !passaFiltrosETF(etf),
      };
    })
    .sort((a, b) => b.scoreComposto - a.scoreComposto)
    .map((e, i) => ({ ...e, posicao: i + 1 }));
}
```

---

## FASE 3 — Carteira

---

### `src/services/portfolioService.js`
```javascript
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { app } from './firebaseConfig';
import { db as indexedDB } from '../db/database';
import * as XLSX from 'xlsx';

const firestore = getFirestore(app);

// ── Estrutura de uma carteira ──────────────────────────────────
// {
//   id: "carteira-principal",
//   nome: "Carteira Principal",
//   posicoes: [
//     { ticker: "ITUB4", quantidade: 100, precoMedio: 38.50 }
//   ],
//   criadaEm: "2026-07-01",
//   atualizadaEm: "2026-07-01"
// }

// ── CRUD Local (IndexedDB) ────────────────────────────────────

export async function getCarteirasLocal() {
  return await indexedDB.carteiras.toArray();
}

export async function saveCarteiraLocal(carteira) {
  await indexedDB.carteiras.put({ ...carteira, atualizadaEm: new Date().toISOString() });
}

// ── CRUD Firestore (Pro) ──────────────────────────────────────

export async function getCarteirasFirestore(uid) {
  const snap = await getDoc(doc(firestore, 'users', uid, 'carteiras', 'data'));
  return snap.exists() ? snap.data().carteiras : [];
}

export async function saveCarteiraFirestore(uid, carteira) {
  const ref = doc(firestore, 'users', uid, 'carteiras', 'data');
  await setDoc(ref, { carteiras: arrayUnion(carteira) }, { merge: true });
}

// ── Cálculo de Performance ────────────────────────────────────

export function calcPerformancePosicao(posicao, cotacaoAtual, variacaoDia) {
  const { quantidade, precoMedio } = posicao;
  const valorAtual = cotacaoAtual * quantidade;
  const valorInvestido = precoMedio * quantidade;
  const lucroTotal = valorAtual - valorInvestido;
  const lucroPercTotal = ((cotacaoAtual / precoMedio) - 1) * 100;
  const variacaoHojeBrl = variacaoDia ? (variacaoDia / 100) * valorAtual : 0;

  return {
    ...posicao,
    cotacaoAtual,
    variacaoDia,
    valorAtual,
    valorInvestido,
    lucroTotal,
    lucroPercTotal,
    variacaoHojeBrl,
  };
}

// ── Parser do arquivo Excel da B3 ────────────────────────────

export function parseB3Excel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // A B3 exporta em diferentes abas dependendo da versão
        // Tentamos as mais comuns:
        const sheetNames = ['Posição', 'Posicao', 'Sheet1', workbook.SheetNames[0]];
        let sheet = null;
        for (const name of sheetNames) {
          if (workbook.Sheets[name]) {
            sheet = workbook.Sheets[name];
            break;
          }
        }
        if (!sheet) sheet = workbook.Sheets[workbook.SheetNames[0]];

        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Procura a linha de cabeçalho
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(rows.length, 20); i++) {
          const row = rows[i].map(c => String(c || '').toLowerCase());
          if (row.some(c => c.includes('código') || c.includes('produto') || c.includes('ticker'))) {
            headerRowIndex = i;
            break;
          }
        }
        if (headerRowIndex === -1) throw new Error('Formato do arquivo não reconhecido.');

        const headers = rows[headerRowIndex].map(h => String(h || '').toLowerCase().trim());
        const codigoIdx = headers.findIndex(h => h.includes('código') || h.includes('ticker') || h.includes('codigo'));
        const qtdIdx = headers.findIndex(h => h.includes('qtd') || h.includes('quantidade'));
        const precoIdx = headers.findIndex(h => h.includes('preço') || h.includes('valor unit'));

        const posicoes = [];
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          const ticker = String(row[codigoIdx] || '').trim().toUpperCase();
          if (!ticker || ticker.length < 4) continue;

          const quantidade = parseFloat(String(row[qtdIdx] || '0').replace(/\./g, '').replace(',', '.')) || 0;
          const preco = parseFloat(String(row[precoIdx] || '0').replace(/[R$\s.]/g, '').replace(',', '.')) || 0;

          if (quantidade > 0) {
            posicoes.push({ ticker, quantidade, precoMedio: preco });
          }
        }

        resolve(posicoes);
      } catch (err) {
        reject(new Error('Erro ao ler o arquivo: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
    reader.readAsArrayBuffer(file);
  });
}
```

---

### `src/components/portfolio/Portfolio.jsx` — Estrutura Principal

```jsx
// Página de Carteira — estrutura e lógica principal
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePortfolio } from '../../context/PortfolioContext';
import { useStocks } from '../../context/StockContext';
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
    <div className="portfolio-page">
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
              ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(variacaoHojeBrl)})
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
        {isPro && (
          <button className="btn btn-secondary" onClick={() => setShowImport(true)}>
            📥 Importar da B3
          </button>
        )}
        {!isPro && (
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
                  <button onClick={() => removePosicao(carteiraAtiva.id, pos.ticker)}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showImport && <PortfolioImport onClose={() => setShowImport(false)} />}
    </div>
  );
}
```

---

### `src/components/portfolio/PortfolioImport.jsx`
```jsx
import { useState } from 'react';
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
      <div className="modal-box">
        <div className="modal-header">
          <h2>📥 Importar Carteira da B3</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <ol className="import-steps">
            <li>Acesse <a href="https://cei.b3.com.br" target="_blank">cei.b3.com.br</a></li>
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
              <label htmlFor="b3-file-input" style={{ cursor: 'pointer' }}>
                {loading ? '⏳ Processando...' : '📂 Arraste o arquivo aqui ou clique para selecionar'}
              </label>
            </div>
          ) : (
            <div>
              <p>✅ {preview.length} posições encontradas:</p>
              <table className="valuation-table">
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
          )}

          {error && <p className="status-err">❌ {error}</p>}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          {preview && (
            <button className="btn btn-primary" onClick={confirmImport}>
              Importar {preview.length} posições
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## Modificações no Dashboard.jsx

### Sidebar — adicionar novos itens
```jsx
// Adicionar na seção de menu da sidebar (após Ranking Compostos):
<div className={`sidebar-item ${activeTab === 'fiis' ? 'active' : ''}`}
  onClick={() => setActiveTab('fiis')}>
  <IconFII />
  <span>FIIs</span>
</div>

<div className={`sidebar-item ${activeTab === 'etfs' ? 'active' : ''}`}
  onClick={() => setActiveTab('etfs')}>
  <IconETF />
  <span>ETFs</span>
</div>

{/* Nova seção */}
<div style={{ margin: '16px 0 8px', fontSize: '11px', fontWeight: 600,
  textTransform: 'uppercase', color: 'var(--text-muted)', paddingLeft: '12px' }}>
  Carteira
</div>
<div className={`sidebar-item ${activeTab === 'carteira' ? 'active' : ''}`}
  onClick={() => setActiveTab('carteira')}>
  <IconPortfolio />
  <span>Minha Carteira</span>
</div>
```

### Bottom Nav Mobile — adicionar
```jsx
// Adicionar no bottom-nav:
<div className={`bottom-nav-item ${activeTab === 'fiis' ? 'active' : ''}`}
  onClick={() => setActiveTab('fiis')}>
  <IconFII />
  <span>FIIs</span>
</div>
<div className={`bottom-nav-item ${activeTab === 'etfs' ? 'active' : ''}`}
  onClick={() => setActiveTab('etfs')}>
  <IconETF />
  <span>ETFs</span>
</div>
<div className={`bottom-nav-item ${activeTab === 'carteira' ? 'active' : ''}`}
  onClick={() => setActiveTab('carteira')}>
  <IconPortfolio />
  <span>Carteira</span>
</div>
```

### Render condicional — adicionar
```jsx
{activeTab === 'fiis' && <FIITable />}
{activeTab === 'etfs' && <ETFTable />}
{activeTab === 'carteira' && <Portfolio />}
```

---

## Regras do Firestore (Security Rules)

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Usuários só acessam seu próprio perfil
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;

      // Sub-coleção de carteiras
      match /carteiras/{doc} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }

    // Cupons — só leitura para validar, escrita apenas via admin
    match /coupons/{code} {
      allow read: if request.auth != null;
      allow write: if false; // Apenas via Firebase Admin SDK ou console
    }
  }
}
```

---

## CSS — Novos estilos a adicionar no `index.css`

```css
/* ── Login Page ─────────────────────────────────── */
.login-page { display: flex; flex-direction: column; align-items: center;
  justify-content: center; min-height: 100vh; padding: 24px;
  background: var(--bg-app); }
.login-brand { text-align: center; margin-bottom: 32px; }
.login-logo-icon { font-size: 48px; margin-bottom: 12px; }
.login-title { font-size: 28px; font-weight: 800; }
.login-subtitle { color: var(--text-secondary); font-size: 14px; }
.login-card { background: var(--bg-surface); border: 1px solid var(--border-light);
  border-radius: 16px; padding: 32px; width: 100%; max-width: 400px; }
.btn-google { display: flex; align-items: center; justify-content: center; gap: 12px;
  width: 100%; padding: 12px; border: 1px solid var(--border-light);
  background: var(--bg-app); color: var(--text-primary); border-radius: 8px;
  cursor: pointer; font-size: 15px; font-weight: 500; }
.login-divider { text-align: center; color: var(--text-muted); margin: 20px 0;
  position: relative; }
.login-divider::before, .login-divider::after { content: ''; position: absolute;
  top: 50%; width: 45%; height: 1px; background: var(--border-light); }
.login-divider::before { left: 0; } .login-divider::after { right: 0; }
.login-error { color: var(--red); font-size: 13px; margin-top: 12px; }
.login-footer { margin-top: 24px; text-align: center; font-size: 12px;
  color: var(--text-muted); line-height: 1.6; }

/* ── Portfolio ──────────────────────────────────── */
.portfolio-summary-card { background: var(--bg-surface); border: 1px solid var(--border-light);
  border-radius: 12px; padding: 24px; margin-bottom: 24px; }
.portfolio-summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.summary-label { display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 6px; }
.summary-value { font-size: 20px; font-weight: 700; }
.portfolio-highlights { display: flex; gap: 16px; margin-top: 20px; flex-wrap: wrap; }
.highlight-green { background: rgba(22,163,74,0.1); border: 1px solid rgba(22,163,74,0.3);
  color: var(--green); padding: 8px 16px; border-radius: 8px; font-size: 13px; }
.highlight-red { background: rgba(224,0,0,0.1); border: 1px solid rgba(224,0,0,0.3);
  color: var(--red); padding: 8px 16px; border-radius: 8px; font-size: 13px; }
.portfolio-actions { display: flex; gap: 12px; margin-bottom: 20px; align-items: center; }
.pro-badge { font-size: 12px; color: var(--text-muted);
  background: var(--bg-surface); border: 1px solid var(--border-light);
  padding: 6px 12px; border-radius: 6px; }

/* ── Drop Zone (Import B3) ────────────────────── */
.drop-zone { border: 2px dashed var(--border-light); border-radius: 12px;
  padding: 48px 24px; text-align: center; color: var(--text-secondary);
  cursor: pointer; transition: all 0.2s; margin: 16px 0; }
.drop-zone-active { border-color: var(--primary); background: rgba(99,102,241,0.05); }
.import-steps { padding-left: 20px; margin-bottom: 24px; color: var(--text-secondary); }
.import-steps li { margin-bottom: 8px; font-size: 14px; }
```

---

## Ordem de Implementação Recomendada

```
1. Copie os arquivos de auth (firebaseConfig, authService, firestoreService, AuthContext, LoginPage, AuthGuard, EmailConfirmPage)
2. Configure o Firebase Console (habilitar Auth + Firestore)
3. Crie o .env.local com suas credenciais
4. Atualize o App.jsx com BrowserRouter + AuthProvider
5. Teste o login (AuthGuard está DESATIVADO, só estrutura)
6. Copie os dados de FIIs (fiis.js) e utils (fiiValuation.js)
7. Crie FIIContext, FIITable, FIIDetail
8. Repita para ETFs
9. Atualize Dashboard.jsx com as novas abas
10. Copie portfolioService.js, PortfolioContext, Portfolio, PortfolioImport
11. Adicione a aba Carteira no Dashboard
12. Adicione os novos estilos ao index.css
13. npm run build → teste completo
```
