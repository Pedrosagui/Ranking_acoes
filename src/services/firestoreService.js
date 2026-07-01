import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { app, isFirebaseConfigured } from './firebaseConfig';

let db = null;

if (isFirebaseConfigured) {
  db = getFirestore(app);
}

// ── Usuários ──────────────────────────────────────────────────

export async function getOrCreateUser(firebaseUser) {
  if (!db) return { plano: 'free', planValidUntil: null };
  const ref = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) return snap.data();

  const newUser = {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    nome: firebaseUser.displayName || firebaseUser.email,
    plano: 'free',                    // 'free' | 'pro'
    planValidUntil: null,             // ISO date string ou null (vitalício = 'lifetime')
    createdAt: serverTimestamp(),
    loginCount: 1,
  };

  await setDoc(ref, newUser);
  return newUser;
}

export async function getUserProfile(uid) {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

// ── Sistema de Cupons ─────────────────────────────────────────

export async function redeemCoupon(uid, code) {
  if (!db) throw new Error('Firebase não configurado.');
  const couponRef = doc(db, 'coupons', code.toUpperCase());
  const couponSnap = await getDoc(couponRef);

  if (!couponSnap.exists()) throw new Error('Cupom não encontrado.');

  const coupon = couponSnap.data();
  if (coupon.usedBy) throw new Error('Este cupom já foi utilizado.');

  // Marca o cupom como usado
  await updateDoc(couponRef, {
    usedBy: uid,
    usedAt: serverTimestamp(),
  });

  // Calcula a data de expiração do plano
  let planValidUntil;
  if (coupon.validDays === 'lifetime') {
    planValidUntil = 'lifetime';
  } else {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + coupon.validDays);
    planValidUntil = expiry.toISOString();
  }

  // Atualiza o plano do usuário
  await updateDoc(doc(db, 'users', uid), {
    plano: 'pro',
    planValidUntil,
  });

  return { validDays: coupon.validDays, planValidUntil };
}

export function isPlanActive(user) {
  if (!user || user.plano === 'free') return false;
  if (user.planValidUntil === 'lifetime') return true;
  if (!user.planValidUntil) return false;
  return new Date(user.planValidUntil) > new Date();
}

export { db };
