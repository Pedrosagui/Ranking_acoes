import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching XFIX11.SA...');
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/XFIX11.SA?range=5y&interval=1mo`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const data = await res.json();
  const result = data.chart?.result?.[0];
  
  if (result && result.timestamp && result.indicators?.quote?.[0]?.close) {
    const timestamps = result.timestamp;
    const closes = result.indicators.quote[0].close;
    
    const historyData = [];
    for (let j = 0; j < timestamps.length; j++) {
      if (closes[j] !== null && closes[j] !== undefined) {
        const dateObj = new Date(timestamps[j] * 1000);
        const yyyymm = dateObj.toISOString().substring(0, 7);
        historyData.push({
          ticker: 'IFIX.SA',
          date: yyyymm,
          price: closes[j]
        });
      }
    }
    
    console.log(`Saving ${historyData.length} records for IFIX.SA...`);
    
    await prisma.$transaction([
      prisma.history.deleteMany({ where: { ticker: 'IFIX.SA' } }),
      prisma.history.createMany({ data: historyData, skipDuplicates: true })
    ]);
    console.log('Success!');
  } else {
    console.log('Failed to fetch data');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
