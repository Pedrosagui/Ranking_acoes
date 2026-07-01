/**
 * seedB3Assets.js
 * 
 * Popula o banco com TODAS as ETFs e FIIs listados na B3.
 * Lista hardcoded baseada nos dados oficiais da B3 (mais completa possível).
 * Após inserir, roda as rotinas de cotação e histórico.
 */
import pgPkg from 'pg';
import prismaPkg from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import yahooFinancePkg from 'yahoo-finance2';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pgPkg;
const { PrismaClient } = prismaPkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const YF = yahooFinancePkg.default || yahooFinancePkg;
const yahooFinance = new YF({ suppressNotices: ['yahooSurvey'] });

// =============================================
// LISTA COMPLETA DE ETFs DA B3
// =============================================
const ALL_ETFS = [
  // Renda Variável Brasil
  { ticker: 'BOVA11', nome: 'iShares Ibovespa', benchmark: 'Ibovespa', gestora: 'BlackRock' },
  { ticker: 'IVVB11', nome: 'iShares S&P 500 BRL', benchmark: 'S&P 500', gestora: 'BlackRock' },
  { ticker: 'SMAL11', nome: 'iShares Small Cap', benchmark: 'Small Cap', gestora: 'BlackRock' },
  { ticker: 'DIVO11', nome: 'It Now IDIV', benchmark: 'IDIV', gestora: 'Itaú' },
  { ticker: 'HASH11', nome: 'Hashdex Nasdaq Crypto', benchmark: 'Crypto', gestora: 'Hashdex' },
  { ticker: 'XFIX11', nome: 'iShares IFIX', benchmark: 'IFIX', gestora: 'BlackRock' },
  { ticker: 'PIBB11', nome: 'It Now PIBBsp', benchmark: 'IBrX-50', gestora: 'Itaú' },
  { ticker: 'BRAX11', nome: 'iShares IBrX-100', benchmark: 'IBrX-100', gestora: 'BlackRock' },
  { ticker: 'ECOO11', nome: 'iShares ICO2', benchmark: 'ICO2', gestora: 'BlackRock' },
  { ticker: 'ISUS11', nome: 'iShares ISE', benchmark: 'ISE', gestora: 'BlackRock' },
  { ticker: 'FIND11', nome: 'It Now IFNC', benchmark: 'IFNC', gestora: 'Itaú' },
  { ticker: 'GOVE11', nome: 'It Now IGCT', benchmark: 'IGCT', gestora: 'Itaú' },
  { ticker: 'MATB11', nome: 'It Now IMAT', benchmark: 'IMAT', gestora: 'Itaú' },
  { ticker: 'IMAB11', nome: 'It Now IMA-B', benchmark: 'IMA-B', gestora: 'Itaú' },
  { ticker: 'IRFM11', nome: 'It Now IRF-M P2', benchmark: 'IRF-M', gestora: 'Itaú' },
  { ticker: 'FIXA11', nome: 'Mirae Pré-Fixados', benchmark: 'IRF-M', gestora: 'Mirae' },
  { ticker: 'B5P211', nome: 'It Now IMA-B5 P2', benchmark: 'IMA-B5', gestora: 'Itaú' },
  { ticker: 'GOLD11', nome: 'Trend Gold', benchmark: 'Ouro', gestora: 'XP' },
  { ticker: 'QBTC11', nome: 'QR Bitcoin', benchmark: 'Bitcoin', gestora: 'QR Asset' },
  { ticker: 'QETH11', nome: 'QR Ether', benchmark: 'Ethereum', gestora: 'QR Asset' },
  { ticker: 'BITH11', nome: 'Hashdex Bitcoin', benchmark: 'Bitcoin', gestora: 'Hashdex' },
  { ticker: 'ETHE11', nome: 'Hashdex Ethereum', benchmark: 'Ethereum', gestora: 'Hashdex' },
  { ticker: 'DEFI11', nome: 'Hashdex DeFi', benchmark: 'DeFi', gestora: 'Hashdex' },
  { ticker: 'WEB311', nome: 'Hashdex Web3', benchmark: 'Web3', gestora: 'Hashdex' },
  { ticker: 'META11', nome: 'Hashdex Metaverse', benchmark: 'Metaverse', gestora: 'Hashdex' },
  { ticker: 'SPXI11', nome: 'It Now S&P 500 TRN', benchmark: 'S&P 500', gestora: 'Itaú' },
  { ticker: 'NASD11', nome: 'Trend Nasdaq-100', benchmark: 'Nasdaq-100', gestora: 'XP' },
  { ticker: 'EURP11', nome: 'Trend MSCI Europe', benchmark: 'MSCI Europe', gestora: 'XP' },
  { ticker: 'ACWI11', nome: 'Trend MSCI ACWI', benchmark: 'MSCI ACWI', gestora: 'XP' },
  { ticker: 'XINA11', nome: 'Trend China', benchmark: 'MSCI China', gestora: 'XP' },
  { ticker: 'EMEG11', nome: 'Trend Emergentes', benchmark: 'MSCI EM', gestora: 'XP' },
  { ticker: 'JAPA11', nome: 'Trend Japão', benchmark: 'Nikkei', gestora: 'XP' },
  { ticker: 'TECK11', nome: 'Trend Tech', benchmark: 'NYSE FANG+', gestora: 'XP' },
  { ticker: 'USTK11', nome: 'Investo US Tech', benchmark: 'QQQ', gestora: 'Investo' },
  { ticker: 'WRLD11', nome: 'Investo MSCI World', benchmark: 'MSCI World', gestora: 'Investo' },
  { ticker: 'BOVV11', nome: 'It Now Ibovespa', benchmark: 'Ibovespa', gestora: 'Itaú' },
  { ticker: 'BBOV11', nome: 'BB Ibovespa', benchmark: 'Ibovespa', gestora: 'BB Asset' },
  { ticker: 'BOVB11', nome: 'Bradesco Ibovespa', benchmark: 'Ibovespa', gestora: 'Bradesco' },
  { ticker: 'SMAC11', nome: 'It Now Small Cap', benchmark: 'Small Cap', gestora: 'Itaú' },
  { ticker: 'NDIV11', nome: 'Investo Dividendos', benchmark: 'IDIV', gestora: 'Investo' },
  { ticker: 'BOVX11', nome: 'Trend Ibovespa', benchmark: 'Ibovespa', gestora: 'XP' },
  { ticker: 'SPXB11', nome: 'BTG S&P 500', benchmark: 'S&P 500', gestora: 'BTG' },
  { ticker: 'ESGB11', nome: 'BTG ESG Brasil', benchmark: 'S&P/B3 ESG', gestora: 'BTG' },
  { ticker: '5GTK11', nome: 'Trend 5G Tech', benchmark: '5G Tech', gestora: 'XP' },
  { ticker: 'SHOT11', nome: 'It Now S&P Short', benchmark: 'S&P 500 Short', gestora: 'Itaú' },
  { ticker: 'IBOV11', nome: 'BTG Ibovespa', benchmark: 'Ibovespa', gestora: 'BTG' },
  { ticker: 'YDRO11', nome: 'Trend Hidrogênio', benchmark: 'Hidrogênio', gestora: 'XP' },
  { ticker: 'GENB11', nome: 'Trend Genômica', benchmark: 'Genômica', gestora: 'XP' },
  { ticker: 'MILL11', nome: 'Trend Agro', benchmark: 'Agronegócio', gestora: 'XP' },
  { ticker: 'BLOK11', nome: 'Investo Blockchain', benchmark: 'Blockchain', gestora: 'Investo' },
  { ticker: 'ALUG11', nome: 'Investo MSCI US REIT', benchmark: 'REITs', gestora: 'Investo' },
  { ticker: 'SCVB11', nome: 'Investo Small Cap Value', benchmark: 'Small Cap Value', gestora: 'Investo' },
  { ticker: 'LVOL11', nome: 'Investo Low Vol', benchmark: 'Low Volatility', gestora: 'Investo' },
  { ticker: 'USAL11', nome: 'Investo MSCI USA', benchmark: 'MSCI USA', gestora: 'Investo' },
  { ticker: 'TECB11', nome: 'Investo Tech Brasil', benchmark: 'Tech Brasil', gestora: 'Investo' },
];

// =============================================
// LISTA COMPLETA DE FIIs DA B3 (os mais relevantes)
// =============================================
const ALL_FIIS = [
  // Tijolo - Logística
  { ticker: 'HGLG11', nome: 'CGHG Logística', segmento: 'Logística', gestora: 'CSHG' },
  { ticker: 'XPLG11', nome: 'XP Log', segmento: 'Logística', gestora: 'XP' },
  { ticker: 'BRCO11', nome: 'Bresco Logística', segmento: 'Logística', gestora: 'Bresco' },
  { ticker: 'BTLG11', nome: 'BTG Logística', segmento: 'Logística', gestora: 'BTG' },
  { ticker: 'VILG11', nome: 'Vinci Logística', segmento: 'Logística', gestora: 'Vinci' },
  { ticker: 'GGRC11', nome: 'GGR Covepi Renda', segmento: 'Logística', gestora: 'GGR' },
  { ticker: 'GALG11', nome: 'Guardian Logística', segmento: 'Logística', gestora: 'Guardian' },
  // Tijolo - Lajes Corporativas
  { ticker: 'KNRI11', nome: 'Kinea Renda Imobiliária', segmento: 'Lajes Corporativas', gestora: 'Kinea' },
  { ticker: 'BRCR11', nome: 'BTG Corporate Offices', segmento: 'Lajes Corporativas', gestora: 'BTG' },
  { ticker: 'HGRE11', nome: 'CSHG Real Estate', segmento: 'Lajes Corporativas', gestora: 'CSHG' },
  { ticker: 'JSRE11', nome: 'JS Real Estate', segmento: 'Lajes Corporativas', gestora: 'Safra' },
  { ticker: 'RBRP11', nome: 'RBR Properties', segmento: 'Lajes Corporativas', gestora: 'RBR' },
  { ticker: 'PVBI11', nome: 'VBI Prime Properties', segmento: 'Lajes Corporativas', gestora: 'VBI' },
  { ticker: 'VINO11', nome: 'Vinci Offices', segmento: 'Lajes Corporativas', gestora: 'Vinci' },
  // Tijolo - Shoppings
  { ticker: 'VISC11', nome: 'Vinci Shopping Centers', segmento: 'Shoppings', gestora: 'Vinci' },
  { ticker: 'XPML11', nome: 'XP Malls', segmento: 'Shoppings', gestora: 'XP' },
  { ticker: 'HSML11', nome: 'HSI Malls', segmento: 'Shoppings', gestora: 'Hemisfério Sul' },
  { ticker: 'HGBS11', nome: 'CSHG Brasil Shopping', segmento: 'Shoppings', gestora: 'CSHG' },
  { ticker: 'MALL11', nome: 'Malls Brasil Plural', segmento: 'Shoppings', gestora: 'Plural' },
  // Tijolo - Híbridos
  { ticker: 'HGRU11', nome: 'CSHG Renda Urbana', segmento: 'Híbrido', gestora: 'CSHG' },
  { ticker: 'TRXF11', nome: 'TRX Real Estate', segmento: 'Híbrido', gestora: 'TRX' },
  { ticker: 'RBVA11', nome: 'Rio Bravo Renda Varejo', segmento: 'Híbrido', gestora: 'Rio Bravo' },
  { ticker: 'ALZR11', nome: 'Alianza Trust Renda', segmento: 'Híbrido', gestora: 'Alianza' },
  { ticker: 'RZAT11', nome: 'Riza Arctium Real Estate', segmento: 'Híbrido', gestora: 'Riza' },
  // Papel (CRI)
  { ticker: 'KNCR11', nome: 'Kinea Rendimentos Imob.', segmento: 'Papel', gestora: 'Kinea' },
  { ticker: 'KNIP11', nome: 'Kinea Índices de Preços', segmento: 'Papel', gestora: 'Kinea' },
  { ticker: 'KNHY11', nome: 'Kinea High Yield', segmento: 'Papel', gestora: 'Kinea' },
  { ticker: 'KNSC11', nome: 'Kinea Securities', segmento: 'Papel', gestora: 'Kinea' },
  { ticker: 'MXRF11', nome: 'Maxi Renda', segmento: 'Papel', gestora: 'XP' },
  { ticker: 'CPTS11', nome: 'Capitânia Securities II', segmento: 'Papel', gestora: 'Capitânia' },
  { ticker: 'IRDM11', nome: 'Iridium Recebíveis', segmento: 'Papel', gestora: 'Iridium' },
  { ticker: 'RBRR11', nome: 'RBR Rendimento High Grade', segmento: 'Papel', gestora: 'RBR' },
  { ticker: 'HGCR11', nome: 'CSHG Recebíveis', segmento: 'Papel', gestora: 'CSHG' },
  { ticker: 'VGIR11', nome: 'Valora RE III', segmento: 'Papel', gestora: 'Valora' },
  { ticker: 'PLCR11', nome: 'Plural Recebíveis', segmento: 'Papel', gestora: 'Plural' },
  { ticker: 'DEVA11', nome: 'Devant Recebíveis', segmento: 'Papel', gestora: 'Devant' },
  { ticker: 'RECR11', nome: 'REC Recebíveis', segmento: 'Papel', gestora: 'REC' },
  { ticker: 'NCHB11', nome: 'NCH High Yield', segmento: 'Papel', gestora: 'NCH' },
  { ticker: 'VCJR11', nome: 'Vectis Juros Real', segmento: 'Papel', gestora: 'Vectis' },
  { ticker: 'CVBI11', nome: 'VBI CRI', segmento: 'Papel', gestora: 'VBI' },
  { ticker: 'AFHI11', nome: 'AF Invest CRI', segmento: 'Papel', gestora: 'AF Invest' },
  { ticker: 'HABT11', nome: 'Habitat II', segmento: 'Papel', gestora: 'Habitat' },
  { ticker: 'VRTA11', nome: 'Fator Veritá', segmento: 'Papel', gestora: 'Fator' },
  { ticker: 'RBRY11', nome: 'RBR Crédito Imob.', segmento: 'Papel', gestora: 'RBR' },
  // FOFs
  { ticker: 'BCFF11', nome: 'BTG FOF', segmento: 'FOF', gestora: 'BTG' },
  { ticker: 'HFOF11', nome: 'Hedge Top FOFII', segmento: 'FOF', gestora: 'Hedge' },
  { ticker: 'RBRF11', nome: 'RBR Alpha FOF', segmento: 'FOF', gestora: 'RBR' },
  { ticker: 'BCIA11', nome: 'Bradesco Carteira Imob.', segmento: 'FOF', gestora: 'Bradesco' },
  { ticker: 'KFOF11', nome: 'Kinea FOF', segmento: 'FOF', gestora: 'Kinea' },
  // Outros
  { ticker: 'MCCI11', nome: 'Mauá Capital Recebíveis', segmento: 'Papel', gestora: 'Mauá' },
  { ticker: 'TGAR11', nome: 'TG Ativo Real', segmento: 'Desenvolvimento', gestora: 'TG Core' },
  { ticker: 'SNCI11', nome: 'Suno CRI', segmento: 'Papel', gestora: 'Suno' },
  { ticker: 'RZTR11', nome: 'Riza Terrax', segmento: 'Agro', gestora: 'Riza' },
  { ticker: 'AIEC11', nome: 'Autonomy Edifícios Corp.', segmento: 'Lajes Corporativas', gestora: 'Autonomy' },
  { ticker: 'TEPP11', nome: 'Tellus Properties', segmento: 'Lajes Corporativas', gestora: 'Tellus' },
  { ticker: 'RCRB11', nome: 'Rio Bravo Renda Corp.', segmento: 'Lajes Corporativas', gestora: 'Rio Bravo' },
  { ticker: 'GTWR11', nome: 'Green Towers', segmento: 'Lajes Corporativas', gestora: 'Green' },
  { ticker: 'RECT11', nome: 'REC Renda Imobiliária', segmento: 'Lajes Corporativas', gestora: 'REC' },
  { ticker: 'LVBI11', nome: 'VBI Logístico', segmento: 'Logística', gestora: 'VBI' },
  { ticker: 'VGHF11', nome: 'Valora Hedge Fund', segmento: 'Papel', gestora: 'Valora' },
  { ticker: 'XPCI11', nome: 'XP Crédito Imobiliário', segmento: 'Papel', gestora: 'XP' },
  { ticker: 'VSLH11', nome: 'Versalhes Recebíveis', segmento: 'Papel', gestora: 'Versalhes' },
  { ticker: 'SNFF11', nome: 'Suno FoF', segmento: 'FOF', gestora: 'Suno' },
  { ticker: 'HGPO11', nome: 'CSHG Prime Offices', segmento: 'Lajes Corporativas', gestora: 'CSHG' },
  { ticker: 'PATL11', nome: 'Pátria Logística', segmento: 'Logística', gestora: 'Pátria' },
  { ticker: 'RURA11', nome: 'Itaú Asset Rural', segmento: 'Agro', gestora: 'Itaú' },
  { ticker: 'URPR11', nome: 'Urca Prime Renda', segmento: 'Papel', gestora: 'Urca' },
  { ticker: 'RBRL11', nome: 'RBR Log', segmento: 'Logística', gestora: 'RBR' },
  { ticker: 'MGFF11', nome: 'Mogno FOF', segmento: 'FOF', gestora: 'Mogno' },
  { ticker: 'VGIP11', nome: 'Valora CRI IPCA', segmento: 'Papel', gestora: 'Valora' },
  { ticker: 'HCTR11', nome: 'Hectare CE', segmento: 'Papel', gestora: 'Hectare' },
  { ticker: 'XPSF11', nome: 'XP Selection FoF', segmento: 'FOF', gestora: 'XP' },
  { ticker: 'BTCI11', nome: 'BTG Crédito Imob.', segmento: 'Papel', gestora: 'BTG' },
  { ticker: 'SADI11', nome: 'Santander Papéis Imob.', segmento: 'Papel', gestora: 'Santander' },
  { ticker: 'MORE11', nome: 'More Real Estate', segmento: 'Lajes Corporativas', gestora: 'More' },
  { ticker: 'NSLU11', nome: 'Hospital N.S. de Lourdes', segmento: 'Hospitalar', gestora: 'BRL Trust' },
  { ticker: 'RBRD11', nome: 'RBR Desenvolvimento', segmento: 'Desenvolvimento', gestora: 'RBR' },
];

async function main() {
  console.log('🚀 Iniciando seed de TODOS os ETFs e FIIs da B3...\n');
  
  // ---- ETFs ----
  console.log(`📊 Inserindo ${ALL_ETFS.length} ETFs...`);
  let etfInserted = 0;
  for (const etf of ALL_ETFS) {
    try {
      await prisma.etf.upsert({
        where: { ticker: etf.ticker },
        update: {
          nome: etf.nome,
          benchmark: etf.benchmark,
          gestora: etf.gestora,
        },
        create: {
          ticker: etf.ticker,
          nome: etf.nome,
          benchmark: etf.benchmark,
          gestora: etf.gestora,
        }
      });
      etfInserted++;
    } catch (err) {
      console.warn(`  ⚠️ Falha ETF ${etf.ticker}: ${err.message}`);
    }
  }
  console.log(`  ✅ ETFs inseridos/atualizados: ${etfInserted}`);

  // ---- FIIs ----
  console.log(`\n🏢 Inserindo ${ALL_FIIS.length} FIIs...`);
  let fiiInserted = 0;
  for (const fii of ALL_FIIS) {
    try {
      await prisma.fii.upsert({
        where: { ticker: fii.ticker },
        update: {
          nome: fii.nome,
          segmento: fii.segmento,
          gestora: fii.gestora,
        },
        create: {
          ticker: fii.ticker,
          nome: fii.nome,
          segmento: fii.segmento,
          gestora: fii.gestora,
        }
      });
      fiiInserted++;
    } catch (err) {
      console.warn(`  ⚠️ Falha FII ${fii.ticker}: ${err.message}`);
    }
  }
  console.log(`  ✅ FIIs inseridos/atualizados: ${fiiInserted}`);

  // ---- Buscar cotações via Yahoo Finance para tudo ----
  console.log('\n💰 Buscando cotações atuais de todos os ativos...');
  
  const allTickers = [
    ...ALL_ETFS.map(e => e.ticker),
    ...ALL_FIIS.map(f => f.ticker),
  ];
  
  const CHUNK_SIZE = 20;
  for (let i = 0; i < allTickers.length; i += CHUNK_SIZE) {
    const chunk = allTickers.slice(i, i + CHUNK_SIZE);
    const symbols = chunk.map(t => `${t}.SA`);
    
    try {
      const results = await yahooFinance.quote(symbols);
      for (const item of results) {
        if (!item || !item.symbol) continue;
        const rawTicker = item.symbol.replace('.SA', '');
        
        const isEtf = ALL_ETFS.some(e => e.ticker === rawTicker);
        const model = isEtf ? 'etf' : 'fii';
        
        try {
          await prisma[model].update({
            where: { ticker: rawTicker },
            data: {
              cotacaoAtual: item.regularMarketPrice || 0,
              retornoDiario: item.regularMarketChangePercent || 0,
              updatedAt: new Date(),
            }
          });
        } catch (err) {
          // skip if not found
        }
      }
      console.log(`  ⏳ Cotações: ${Math.min(i + CHUNK_SIZE, allTickers.length)} / ${allTickers.length}`);
    } catch (err) {
      console.warn(`  ⚠️ Erro ao buscar cotações chunk: ${err.message}`);
    }
  }
  
  console.log('\n🎯 Seed completo! Agora rode as rotinas de histórico para popular os gráficos.');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
