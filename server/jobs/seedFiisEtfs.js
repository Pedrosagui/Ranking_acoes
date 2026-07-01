import 'dotenv/config';
import pgPkg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import prismaPkg from '@prisma/client';

import { FIIS_B3 } from '../../src/data/fiis.js';
import { ETFS_B3 } from '../../src/data/etfs.js';

const { Pool } = pgPkg;
const { PrismaClient } = prismaPkg;

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log('Iniciando carga de FIIs e ETFs estáticos...');
  
  let fiisCriados = 0;
  for (const fii of FIIS_B3) {
    await prisma.fii.upsert({
      where: { ticker: fii.ticker },
      update: {
        nome: fii.nome,
        segmento: fii.segmento,
        gestora: fii.gestora,
        numCotistas: fii.numCotistas,
      },
      create: {
        ticker: fii.ticker,
        nome: fii.nome,
        segmento: fii.segmento,
        gestora: fii.gestora,
        numCotistas: fii.numCotistas,
      }
    });
    fiisCriados++;
  }
  console.log(`✅ Carga concluída: ${fiisCriados} FIIs processados.`);

  let etfsCriados = 0;
  for (const etf of ETFS_B3) {
    await prisma.etf.upsert({
      where: { ticker: etf.ticker },
      update: {
        nome: etf.nome,
        benchmark: etf.benchmark,
        taxaAdm: etf.taxaAdm,
        gestora: etf.gestora,
        numAtivos: etf.numAtivos,
      },
      create: {
        ticker: etf.ticker,
        nome: etf.nome,
        benchmark: etf.benchmark,
        taxaAdm: etf.taxaAdm,
        gestora: etf.gestora,
        numAtivos: etf.numAtivos,
      }
    });
    etfsCriados++;
  }
  console.log(`✅ Carga concluída: ${etfsCriados} ETFs processados.`);
  
  console.log('Carga finalizada com sucesso. Execute os jobs de atualização para buscar as cotações reias.');
  process.exit(0);
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
});
