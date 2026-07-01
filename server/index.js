import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import pgPkg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import prismaPkg from '@prisma/client';

const { Pool } = pgPkg;
const { PrismaClient } = prismaPkg;

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const app = express();
app.use(cors());
app.use(express.json());

import { updateQuotes } from './jobs/updateQuotes.js';

// --- ROTAS DA API ---

app.get('/api/admin/update-quotes', async (req, res) => {
  const result = await updateQuotes(prisma);
  res.json(result);
});

app.get('/api/stocks', async (req, res) => {
  try {
    const stocks = await prisma.stock.findMany({
      orderBy: { ticker: 'asc' }
    });
    res.json(stocks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar ações', details: error.message, stack: error.stack });
  }
});

app.get('/api/stocks/:ticker/history', async (req, res) => {
  try {
    const history = await prisma.history.findMany({
      where: { ticker: req.params.ticker.toUpperCase() },
      orderBy: { date: 'asc' }
    });
    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

// --- ROTINAS (CRON JOBS) ---

// Cron 1: Atualizar Cotações 3x ao dia (10:30, 14:00, 18:00) de segunda a sexta
cron.schedule('30 10,14,18 * * 1-5', async () => {
  console.log('Iniciando rotina de cotações...');
  await updateQuotes(prisma);
});

// Cron 2: Atualizar Fundamentos (Fundamentus) todo sábado às 02:00
cron.schedule('0 2 * * 6', async () => {
  console.log('Iniciando rotina de fundamentos (Fundamentus)...');
  // Aqui migraremos o updateDatabase.mjs
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Aegis rodando na porta ${PORT}`);
});
