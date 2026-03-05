'use client';

import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type UserRole = 'client' | 'advisor' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string | null;
  createdAt?: string;
}

interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const SESSION_TOKEN_KEY = 'auth_token';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>): JSX.Element {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
    }
    setToken(null);
    setUser(null);
    router.push('/');
  }, [router]);

  const loadCurrentUser = useCallback(async (storedToken: string) => {
    try {
      const currentUser = await api.get<AuthUser>('/auth/me', {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });
      setUser(currentUser);
      setToken(storedToken);
    } catch {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(SESSION_TOKEN_KEY);
      }
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    const storedToken = sessionStorage.getItem(SESSION_TOKEN_KEY);
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    void loadCurrentUser(storedToken);
  }, [loadCurrentUser]);

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    const authResponse = await api.post<AuthResponse>('/auth/login', { email, password });

    sessionStorage.setItem(SESSION_TOKEN_KEY, authResponse.accessToken);
    setToken(authResponse.accessToken);
    setUser(authResponse.user);

    return authResponse.user;
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isLoading,
    login,
    logout,
  }), [user, token, isLoading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider.');
  }

  return context;
}
