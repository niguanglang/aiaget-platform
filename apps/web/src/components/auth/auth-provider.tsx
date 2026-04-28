'use client';

import type { CurrentUserResponse } from '@aiaget/shared-types';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getMe, loginRequest, logoutRequest, refreshRequest } from '@/lib/api-client';
import {
  clearStoredSession,
  createSessionFromLogin,
  getStoredSession,
  saveStoredSession,
  type AuthSession,
  type LoginInput,
} from '@/lib/session';

interface AuthContextValue {
  currentUser: CurrentUserResponse | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<AuthSession>;
  logout: () => Promise<void>;
  session: AuthSession | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapSession() {
      const storedSession = getStoredSession();

      if (!storedSession) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const currentUser = await getMe();
        const nextSession = {
          ...storedSession,
          currentUser,
        };

        saveStoredSession(nextSession);
        if (isMounted) {
          setSession(nextSession);
        }
      } catch {
        try {
          const refreshed = await refreshRequest(storedSession.refreshToken);
          const nextSession = createSessionFromLogin(refreshed);

          saveStoredSession(nextSession);
          if (isMounted) {
            setSession(nextSession);
          }
        } catch {
          clearStoredSession();
          if (isMounted) {
            setSession(null);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const loginResponse = await loginRequest(input);
    const nextSession = createSessionFromLogin(loginResponse);

    saveStoredSession(nextSession);
    setSession(nextSession);

    return nextSession;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getStoredSession()?.refreshToken;

    try {
      await logoutRequest(refreshToken);
    } finally {
      clearStoredSession();
      setSession(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      currentUser: session?.currentUser ?? null,
      isLoading,
      login,
      logout,
      session,
    }),
    [isLoading, login, logout, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}

