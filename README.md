# ValorB3 — Ranking de Valuation de Ações da B3

Ranqueie automaticamente as principais ações da B3 usando as metodologias de valuation de **Graham** e **Bazin**. Análise fundamentalista 100% client-side, sem cadastro.

## 🚀 Como rodar

```bash
npm install
npm run dev
```

## 📊 Funcionalidades

- ~150 ativos da B3 organizados por setor
- Histórico de dividendos de 10 anos embutido (zero chamadas de API)
- Motor de valuation: Graham, Bazin, Score 0-100
- Sincronização em lotes com dados mock ou API real (Brapi)
- Dark mode premium com glassmorphism e animações
- Filtros por setor, desconto, consistência e ordenação
- Gráfico comparativo Top 5

## 🔑 Modos de uso

### Sem API Key (Demo)
Clique **Sincronizar Todos os Ativos** → dados mock realistas pré-definidos.

### Com API Key (Dados Reais)
1. Obtenha um token gratuito em [brapi.dev](https://brapi.dev/dashboard)
2. Cole em **Configurações** → **Testar** → **Salvar**
3. Clique **Sincronizar Todos os Ativos**

## 📐 Fórmulas

| Métrica | Fórmula |
|---|---|
| Média Dividendos | `Σ dividendos / 10` |
| Preço Teto Bazin | `Média Div / 0.06` |
| Preço Justo Graham | `√(22.5 × LPA × VPA)` |
| Margem Bazin | `(Teto - Cotação) / Teto × 100` |
| Margem Graham | `(Graham - Cotação) / Graham × 100` |
| Score (0-100) | `70% Desconto + 20% ROE + 10% Consistência` |

## 🛠️ Stack

- React 19 + Vite
- Tailwind CSS 4
- Dexie.js (IndexedDB)
- Recharts
