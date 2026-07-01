import { PrismaClient } from '@prisma/client';
import { updateQuotes } from './jobs/updateQuotes.js';
import { updateHistory } from './jobs/updateHistory.js';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('--- UPDATE QUOTES ---');
  await updateQuotes(prisma);
  console.log('--- UPDATE HISTORY ---');
  await updateHistory(prisma);
  console.log('--- DONE ---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
