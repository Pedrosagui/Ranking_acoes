import 'dotenv/config';
import pgPkg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import prismaPkg from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pgPkg;
const { PrismaClient } = prismaPkg;

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  console.log('🔄 Iniciando migração do histórico de dividendos...');
  
  try {
    const rawPath = path.join(__dirname, '../src/data/dividendosHistoricos.js');
    // Convert to file URL for dynamic import on Windows
    const fileUrl = 'file:///' + rawPath.replace(/\\/g, '/');
    const { DIVIDENDOS_HISTORICOS } = await import(fileUrl);
    
    const tickers = Object.keys(DIVIDENDOS_HISTORICOS);
    let count = 0;
    
    for (const ticker of tickers) {
      const dividendHistory = DIVIDENDOS_HISTORICOS[ticker];
      try {
        await prisma.stock.update({
          where: { ticker },
          data: { dividendHistory }
        });
        count++;
        console.log(`✅ ${ticker} histórico de dividendos migrado.`);
      } catch (err) {
        // Se a ação não existe no banco, ignora
      }
    }
    
    console.log(`🎉 Migração de dividendos finalizada! ${count} ações atualizadas.`);
  } catch (err) {
    console.error('❌ Erro no import do arquivo JS:', err);
  }
}

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
