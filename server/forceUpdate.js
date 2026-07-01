import 'dotenv/config';
import pgPkg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import prismaPkg from '@prisma/client';
import { updateQuotes } from './jobs/updateQuotes.js';

const { Pool } = pgPkg;
const { PrismaClient } = prismaPkg;

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  console.log('Forçando atualização das cotações...');
  await updateQuotes(prisma);
  console.log('Feito!');
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
