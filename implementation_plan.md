# 🚀 Aegis Platform v2.0 — Plano Final

## Decisões Confirmadas

| Tópico | Decisão |
|---|---|
| Planos | Apenas **Free** e **Pro** |
| ETFs | Apenas listados na **B3** |
| Múltiplas carteiras | Free = 1 / Pro = até 5 |
| Alertas | ❌ Fora do escopo |
| Fase 4 (Lynch/Greenblatt abas) | ❌ Removida |
| Paywall agora | ❌ Por enquanto todos têm acesso total |
| Sistema de cupons | ✅ Futuro — válidos por 6/15/30/90 dias ou vitalício |

---

## Planos de Acesso (estrutura para o futuro)

| Funcionalidade | Free | Pro |
|---|---|---|
| Ranking Ações | Top 15 | Completo |
| Ranking FIIs | Top 15 | Completo |
| Ranking ETFs | Top 15 | Completo |
| Perfis de score | Só Equilibrado | Todos os perfis |
| Busca por ticker | ❌ | ✅ |
| Carteira manual | 1 carteira | Até 5 carteiras |
| Importação B3 | ❌ | ✅ |
| Propagandas | ✅ | ❌ |
| Cupons de acesso | — | 6/15/30/90 dias ou vitalício |

---

## Fase 1 — Autenticação (Firebase Auth + Firestore)

### Arquivos
| Arquivo | Ação |
|---|---|
| `src/services/authService.js` | [NEW] Google + Email OTP login/logout |
| `src/services/firestoreService.js` | [NEW] User profile + cupons |
| `src/context/AuthContext.jsx` | [NEW] Estado global de auth |
| `src/components/auth/LoginPage.jsx` | [NEW] Tela de login |
| `src/components/auth/AuthGuard.jsx` | [NEW] Proteção de rotas |
| `src/App.jsx` | [MODIFY] Router + AuthGuard |
| `package.json` | [MODIFY] + firebase + react-router-dom |

### Modelo Firestore
```
/users/{uid}
  ├── email, nome, plano, planValidUntil
  └── createdAt

/coupons/{code}
  ├── validDays: 30 | 90 | 180 | "lifetime"
  ├── usedBy: uid | null
  └── usedAt: timestamp | null
```

---

## Fase 2 — FIIs e ETFs

### FIIs — Indicadores
| Indicador | Peso no Score | Ideal |
|---|---|---|
| DY 12m | 40% | > 8% |
| P/VP | 30% | < 1.0 |
| Qualidade do segmento | 20% | Logística/Lajes |
| Liquidez Diária | 10% | > R$ 1M |

### ETFs — Indicadores
| Indicador | Peso no Score | Ideal |
|---|---|---|
| Alpha vs benchmark 12m | 40% | > 0% |
| Taxa de Administração | 30% | < 0.5% |
| Tracking Error | 20% | < 2% |
| Liquidez Diária | 10% | > R$ 1M |

### Gráfico ETF: compara com o índice que replica
- BOVA11 → IBOVESPA
- XFIX11 → IFIX
- IVVB11 → S&P 500 (em R$)

### Arquivos
| Arquivo | Ação |
|---|---|
| `src/data/fiis.js` | [NEW] ~80 FIIs com metadados |
| `src/data/etfs.js` | [NEW] ~40 ETFs B3 com benchmark |
| `src/data/dividendosFiis.js` | [NEW] Histórico proventos mensais |
| `src/utils/fiiValuation.js` | [NEW] Score engine FIIs |
| `src/utils/etfValuation.js` | [NEW] Score engine ETFs |
| `src/context/FIIContext.jsx` | [NEW] Estado global FIIs |
| `src/context/ETFContext.jsx` | [NEW] Estado global ETFs |
| `src/components/FIITable.jsx` | [NEW] Tabela ranking FIIs |
| `src/components/FIIDetail.jsx` | [NEW] Modal detalhes FII |
| `src/components/ETFTable.jsx` | [NEW] Tabela ranking ETFs |
| `src/components/ETFDetail.jsx` | [NEW] Modal detalhes ETF |
| `src/components/Dashboard.jsx` | [MODIFY] + abas FIIs e ETFs |

---

## Fase 3 — Carteira

### Funcionalidades
- Dashboard de performance em tempo real
- Melhor/pior ativo do dia (% e R$)
- Gráfico de composição (pizza por ativo e por setor)
- Importação via arquivo Excel da B3 (SheetJS)
- Múltiplas carteiras (Free: 1 / Pro: 5)

### Arquivos
| Arquivo | Ação |
|---|---|
| `src/components/Portfolio.jsx` | [NEW] Página principal da carteira |
| `src/components/PortfolioImport.jsx` | [NEW] Upload e parse do Excel B3 |
| `src/context/PortfolioContext.jsx` | [NEW] Estado das carteiras |
| `src/services/portfolioService.js` | [NEW] CRUD Firestore + IndexedDB |
| `package.json` | [MODIFY] + xlsx |
