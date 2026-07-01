import https from 'https';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis do .env do diretório /server
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;
const pool = new pkg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function fetchBrapiList() {
  return new Promise((resolve, reject) => {
    https.get('https://brapi.dev/api/quote/list?limit=10000', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.stocks || []);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  try {
    console.log('🌱 Iniciando atualização de nomes e logos via Brapi...');
    
    // 1. Fetch brapi list
    const brapiStocks = await fetchBrapiList();
    console.log(`Baixados ${brapiStocks.length} ativos da Brapi.`);
    
    // 2. Fetch all stocks from DB
    const dbStocks = await prisma.stock.findMany({ select: { ticker: true } });
    console.log(`Encontrados ${dbStocks.length} ativos no banco de dados local.`);
    
    // 3. Map brapi data by ticker for quick access
    const brapiMap = new Map();
    for (const bs of brapiStocks) {
      brapiMap.set(bs.stock, bs);
    }
    
    // 4. Update each DB stock if found in brapi
    let updatedCount = 0;
    
    // Fazendo em lotes pequenos para não sobrecarregar
    for (const stock of dbStocks) {
      const brapiInfo = brapiMap.get(stock.ticker);
      if (brapiInfo) {
        await prisma.stock.update({
          where: { ticker: stock.ticker },
          data: {
            empresa: brapiInfo.name || `${stock.ticker} S.A.`,
            logoUrl: brapiInfo.logo || null,
          }
        });
        updatedCount++;
        process.stdout.write(`\rAtualizados: ${updatedCount}/${dbStocks.length}`);
      }
    }
    
    console.log(`\n✅ Atualização concluída! ${updatedCount} ativos receberam nomes reais e logotipos.`);
    
  } catch (error) {
    console.error('❌ Erro na atualização:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
