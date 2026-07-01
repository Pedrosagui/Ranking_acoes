import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange } from '../services/authService';
import { getOrCreateUser, getUserProfile, isPlanActive } from '../services/firestoreService';
import { isFirebaseConfigured } from '../services/firebaseConfig';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(undefined); // undefined = loading
  const [userProfile, setUserProfile] = useState(null);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Firebase não configurado - bypass do login, funciona sem autenticação
      console.warn('[Auth] Firebase não configurado. Operando sem autenticação.');
      setFirebaseUser({ email: 'local@dev', uid: 'local-dev', displayName: 'Modo Local' });
      setUserProfile({ plano: 'pro', planValidUntil: 'lifetime' });
      setIsPro(true);
      return;
    }

    const unsub = onAuthChange(async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const profile = await getOrCreateUser(fbUser);
          setUserProfile(profile);
          setIsPro(isPlanActive(profile));
        } catch (e) {
          console.error('[Auth] Erro ao buscar perfil:', e);
          setUserProfile(null);
          setIsPro(false);
        }
      } else {
        setUserProfile(null);
        setIsPro(false);
      }
    });
    return unsub;
  }, []);

  const refreshProfile = async () => {
    if (!firebaseUser || !isFirebaseConfigured) return;
    try {
      const profile = await getUserProfile(firebaseUser.uid);
      setUserProfile(profile);
      setIsPro(isPlanActive(profile));
    } catch (e) {
      console.error('[Auth] Erro ao atualizar perfil:', e);
    }
  };

  return (
    <AuthContext.Provider value={{
      firebaseUser,
      userProfile,
      isPro,
      isLoading: firebaseUser === undefined,
      isLoggedIn: !!firebaseUser,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
