import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { app, isFirebaseConfigured } from './firebaseConfig';
import * as XLSX from 'xlsx';

let firestore = null;

if (isFirebaseConfigured) {
  firestore = getFirestore(app);
}

// ── CRUD Local (usando localStorage como fallback simplificado) ────
// Se você quiser IndexedDB nativo depois, usaremos Dexie.
export async function getCarteirasLocal() {
  const data = localStorage.getItem('carteiras');
  return data ? JSON.parse(data) : [];
}

export async function saveCarteiraLocal(carteira) {
  const data = await getCarteirasLocal();
  const exists = data.findIndex(c => c.id === carteira.id);
  if (exists >= 0) data[exists] = { ...carteira, atualizadaEm: new Date().toISOString() };
  else data.push({ ...carteira, atualizadaEm: new Date().toISOString() });
  localStorage.setItem('carteiras', JSON.stringify(data));
}

// ── CRUD Firestore (Pro) ──────────────────────────────────────

export async function getCarteirasFirestore(uid) {
  if (!firestore) throw new Error('Firestore não configurado.');
  const snap = await getDoc(doc(firestore, 'users', uid, 'carteiras', 'data'));
  return snap.exists() ? snap.data().carteiras : [];
}

export async function saveCarteiraFirestore(uid, carteira) {
  if (!firestore) return; // silenciosamente ignora se não configurado
  const ref = doc(firestore, 'users', uid, 'carteiras', 'data');
  await setDoc(ref, { carteiras: arrayUnion(carteira) }, { merge: true });
}

// ── Cálculo de Performance ────────────────────────────────────

export function calcPerformancePosicao(posicao, cotacaoAtual, variacaoDia) {
  const { quantidade, precoMedio } = posicao;
  const valorAtual = cotacaoAtual * quantidade;
  const valorInvestido = precoMedio * quantidade;
  const lucroTotal = valorAtual - valorInvestido;
  const lucroPercTotal = ((cotacaoAtual / precoMedio) - 1) * 100;
  const variacaoHojeBrl = variacaoDia ? (variacaoDia / 100) * valorAtual : 0;

  return {
    ...posicao,
    cotacaoAtual,
    variacaoDia,
    valorAtual,
    valorInvestido,
    lucroTotal,
    lucroPercTotal,
    variacaoHojeBrl,
  };
}

// ── Parser do arquivo Excel da B3 ────────────────────────────

export function parseB3Excel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheetNames = ['Posição', 'Posicao', 'Sheet1', workbook.SheetNames[0]];
        let sheet = null;
        for (const name of sheetNames) {
          if (workbook.Sheets[name]) {
            sheet = workbook.Sheets[name];
            break;
          }
        }
        if (!sheet) sheet = workbook.Sheets[workbook.SheetNames[0]];

        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(rows.length, 20); i++) {
          const row = rows[i].map(c => String(c || '').toLowerCase());
          if (row.some(c => c.includes('código') || c.includes('produto') || c.includes('ticker'))) {
            headerRowIndex = i;
            break;
          }
        }
        if (headerRowIndex === -1) throw new Error('Formato do arquivo não reconhecido.');

        const headers = rows[headerRowIndex].map(h => String(h || '').toLowerCase().trim());
        const codigoIdx = headers.findIndex(h => h.includes('código') || h.includes('ticker') || h.includes('codigo'));
        const qtdIdx = headers.findIndex(h => h.includes('qtd') || h.includes('quantidade'));
        const precoIdx = headers.findIndex(h => h.includes('preço') || h.includes('valor unit'));

        const posicoes = [];
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          const ticker = String(row[codigoIdx] || '').trim().toUpperCase();
          if (!ticker || ticker.length < 4) continue;

          const quantidade = parseFloat(String(row[qtdIdx] || '0').replace(/\./g, '').replace(',', '.')) || 0;
          const preco = parseFloat(String(row[precoIdx] || '0').replace(/[R$\s.]/g, '').replace(',', '.')) || 0;

          if (quantidade > 0) {
            posicoes.push({ ticker, quantidade, precoMedio: preco });
          }
        }

        resolve(posicoes);
      } catch (err) {
        reject(new Error('Erro ao ler o arquivo: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
    reader.readAsArrayBuffer(file);
  });
}
