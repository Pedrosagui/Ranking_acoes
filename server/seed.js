import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import data from frontend
const tickersModule = await import('../src/data/tickers.js');
const fundamentosModule = await import('../src/data/fundamentos.js');
const historicoModule = await import('../src/data/historico5anos.js');
const { TICKERS_B3 } = tickersModule;
const { fundamentos } = fundamentosModule;
const { historico5anos } = historicoModule;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Faltou DATABASE_URL no .env");
  process.exit(1);
}

const { Pool } = pkg;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log("🌱 Iniciando migração de dados locais para o Supabase...");

  for (const t of TICKERS_B3) {
    const ticker = t.ticker;
    const f = fundamentos[ticker] || { lpa: 0, vpa: 0, roe: 0 };
    
    // Insert or update Stock
    await prisma.stock.upsert({
      where: { ticker },
      update: {
        empresa: t.empresa,
        setor: t.setor,
        lpa: f.lpa,
        vpa: f.vpa,
        roe: f.roe
      },
      create: {
        ticker,
        empresa: t.empresa,
        setor: t.setor,
        lpa: f.lpa,
        vpa: f.vpa,
        roe: f.roe
      }
    });

    // Insert history
    const hist = historico5anos[ticker];
    if (hist && hist.length > 0) {
      // hist looks like [{ date: '2018-01', close: 10.5 }, ...]
      const historyData = hist.map(h => ({
        ticker,
        date: h.date,
        price: h.price
      }));
      
      // Delete old history to avoid duplicates then insert
      await prisma.history.deleteMany({ where: { ticker } });
      await prisma.history.createMany({
        data: historyData,
        skipDuplicates: true
      });
    }
  }

  console.log("✅ Migração finalizada com sucesso!");
}

seed()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
