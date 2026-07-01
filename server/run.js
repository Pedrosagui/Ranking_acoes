import pgPkg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import prismaPkg from '@prisma/client';
import { updateHistory } from './jobs/updateHistory.js';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pgPkg;
const { PrismaClient } = prismaPkg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await updateHistory(prisma);
  await prisma.$disconnect();
  pool.end();
}
main();
