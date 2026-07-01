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
import { updateHistory } from './jobs/updateHistory.js';

// --- ROTAS DA API ---

app.get('/api/admin/update-quotes', async (req, res) => {
  const result = await updateQuotes(prisma);
  res.json(result);
});

app.get('/api/admin/update-fundamentals', async (req, res) => {
  const result = await updateFundamentals(prisma);
  res.json(result);
});

app.get('/api/admin/update-history', async (req, res) => {
  const result = await updateHistory(prisma);
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

app.get('/api/history/:ticker', async (req, res) => {
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

// Cron 1: Atualizar Cotações de hora em hora (24/7)
cron.schedule('0 * * * *', async () => {
  console.log('[Cron] Iniciando rotina de cotações (hora em hora)...');
  await updateQuotes(prisma);
});

// Cron 2: Atualizar Fundamentos e Valuation a cada 6 horas
cron.schedule('0 */6 * * *', async () => {
  console.log('[Cron] Iniciando rotina de fundamentos (6 em 6h)...');
  await updateFundamentals(prisma);
});

// Cron 3: Atualizar Histórico de 5 anos diariamente às 03:00
cron.schedule('0 3 * * *', async () => {
  console.log('[Cron] Iniciando rotina de histórico de 5 anos (03:00)...');
  await updateHistory(prisma);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
