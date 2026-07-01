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
import { updateFundamentals } from './jobs/updateFundamentals.js';

// --- ROTAS DA API ---

app.get('/api/admin/update-quotes', async (req, res) => {
  const result = await updateQuotes(prisma);
  res.json(result);
});

app.get('/api/admin/update-fundamentals', async (req, res) => {
  const result = await updateFundamentals(prisma);
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

app.get('/api/fiis', async (req, res) => {
  try {
    const fiis = await prisma.fii.findMany({
      orderBy: { ticker: 'asc' }
    });
    res.json(fiis);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar FIIs', details: error.message });
  }
});

app.get('/api/etfs', async (req, res) => {
  try {
    const etfs = await prisma.etf.findMany({
      orderBy: { ticker: 'asc' }
    });
    res.json(etfs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar ETFs', details: error.message });
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

// Cron 1: Atualizar Cotações de hora em hora (10:00 às 18:00) de segunda a sexta
cron.schedule('0 10-18 * * 1-5', async () => {
  console.log('Iniciando rotina de cotações...');
  await updateQuotes(prisma);
});

// Cron 2: Atualizar Fundamentos e Valuation diariamente às 22:00
cron.schedule('0 22 * * *', async () => {
  console.log('Iniciando rotina de fundamentos (22:00)...');
  await updateFundamentals(prisma);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
