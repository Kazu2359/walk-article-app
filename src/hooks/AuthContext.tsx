import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  authenticateWithApple,
  clearStoredAccessToken,
  getStoredAccessToken,
  setStoredAccessToken,
} from '../services/api';

interface AuthContextValue {
  accessToken: string | null;
  isLoading: boolean;
  signInWithApple: (
    identityToken: string,
    fullName?: { givenName?: string | null; familyName?: string | null },
  ) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getStoredAccessToken()
      .then(setAccessToken)
      .finally(() => setIsLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      isLoading,
      signInWithApple: async (identityToken, fullName) => {
        const result = await authenticateWithApple(identityToken, fullName);
        await setStoredAccessToken(result.accessToken);
        setAccessToken(result.accessToken);
      },
      signOut: async () => {
        await clearStoredAccessToken();
        setAccessToken(null);
      },
    }),
    [accessToken, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthはAuthProviderの内側で使用してください');
  }
  return context;
}
