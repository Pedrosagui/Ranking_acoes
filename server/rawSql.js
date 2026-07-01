import 'dotenv/config';
import pgPkg from 'pg';
const { Pool } = pgPkg;

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('Adding dividendHistory column...');
    await pool.query('ALTER TABLE "Stock" ADD COLUMN IF NOT EXISTS "dividendHistory" JSONB;');
    console.log('Column added successfully!');
  } catch (err) {
    console.error('Error adding column:', err);
  } finally {
    pool.end();
  }
}
run();
