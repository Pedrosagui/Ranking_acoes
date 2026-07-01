import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const stocks = await prisma.stock.findMany({
    where: { ticker: { in: ['VULC3', 'POMO3', 'CAMB3'] } },
    select: { ticker: true, retorno12m: true, retornoDiario: true }
  });
  console.log(stocks);
}

main().finally(() => prisma.$disconnect());
