/**
 * runFullUpdate.js
 * 
 * Executa TODAS as rotinas de atualização na mão, em sequência:
 * 1) Fundamentos (Fundamentus + Yahoo P/L)
 * 2) Cotações (Yahoo Finance)
 * 3) Histórico de 5 anos (Yahoo Finance chart)
 */
import pgPkg from 'pg';
import prismaPkg from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
dotenv.config();

import { updateFundamentals } from './jobs/updateFundamentals.js';
import { updateQuotes } from './jobs/updateQuotes.js';
import { updateHistory } from './jobs/updateHistory.js';

const { Pool } = pgPkg;
const { PrismaClient } = prismaPkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const start = Date.now();
  
  console.log('\n========== 1/3: FUNDAMENTOS ==========\n');
  const r1 = await updateFundamentals(prisma);
  console.log('Resultado:', r1);
  
  console.log('\n========== 2/3: COTAÇÕES ==========\n');
  const r2 = await updateQuotes(prisma);
  console.log('Resultado:', r2);
  
  console.log('\n========== 3/3: HISTÓRICO 5 ANOS ==========\n');
  const r3 = await updateHistory(prisma);
  console.log('Resultado:', r3);
  
  const elapsed = ((Date.now() - start) / 1000 / 60).toFixed(1);
  console.log(`\n🏁 Atualização completa finalizada em ${elapsed} minutos!`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
