// src/services/firebaseConfig.js
// Configuração lazy do Firebase - só inicializa se as credenciais estiverem configuradas

import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Verifica se as credenciais reais foram configuradas
const hasValidConfig = firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'sua_api_key' && 
  firebaseConfig.projectId && 
  firebaseConfig.projectId !== 'seu_projeto';

let app = null;
try {
  if (hasValidConfig) {
    app = initializeApp(firebaseConfig);
  } else {
    console.warn('[Firebase] Credenciais não configuradas. Funcionalidades de login e Firestore estão desativadas. Configure o .env.local com credenciais válidas.');
  }
} catch (e) {
  console.error('[Firebase] Erro ao inicializar:', e);
}

export { app };
export const isFirebaseConfigured = !!app;
