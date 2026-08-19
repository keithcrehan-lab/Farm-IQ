import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { clearToken, getToken, setToken as persistToken } from '../api/client';
import { getMe, login as loginRequest, register as registerRequest } from '../api/auth';
import type { AuthUser } from '../api/auth';

interface AuthContextValue {
  user: AuthUser | null;
  /** True while the initial token check (or a login/register call) is in flight. */
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  // Lazy initial value, not a synchronous setState in the effect below: with
  // no stored token there's nothing to verify, so isLoading starts false.
  const [isLoading, setIsLoading] = useState(() => getToken() !== null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    // A stored token could be expired or revoked — confirm it against the API
    // rather than trusting its mere presence.
    getMe()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest(email, password);
    persistToken(result.accessToken);
    setUser(result.user);
  }, []);

  const register = useCallback(async (email: string, password: string, fullName?: string) => {
    const result = await registerRequest(email, password, fullName);
    persistToken(result.accessToken);
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
