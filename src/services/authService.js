import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  sendSignInLinkToEmail, isSignInWithEmailLink,
  signInWithEmailLink, signOut, onAuthStateChanged,
} from 'firebase/auth';
import { app, isFirebaseConfigured } from './firebaseConfig';

let auth = null;
let googleProvider = null;

if (isFirebaseConfigured) {
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });
}

// URL para onde o link de login vai redirecionar
const ACTION_CODE_SETTINGS = {
  url: `${window.location.origin}/auth/confirm`,
  handleCodeInApp: true,
};

export async function loginWithGoogle() {
  if (!auth) throw new Error('Firebase não configurado. Configure o .env.local.');
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function sendEmailOTP(email) {
  if (!auth) throw new Error('Firebase não configurado. Configure o .env.local.');
  await sendSignInLinkToEmail(auth, email, ACTION_CODE_SETTINGS);
  localStorage.setItem('emailForSignIn', email);
}

export async function confirmEmailLink(link) {
  if (!auth) throw new Error('Firebase não configurado.');
  const email = localStorage.getItem('emailForSignIn');
  if (!email || !isSignInWithEmailLink(auth, link)) {
    throw new Error('Link inválido ou expirado.');
  }
  const result = await signInWithEmailLink(auth, email, link);
  localStorage.removeItem('emailForSignIn');
  return result.user;
}

export async function logout() {
  if (!auth) return;
  await signOut(auth);
}

export function onAuthChange(cb) {
  if (!auth) {
    // Se Firebase não está configurado, callback com null (sem usuário)
    cb(null);
    return () => {}; // retorna unsubscribe vazio
  }
  return onAuthStateChanged(auth, cb);
}

export { auth };
