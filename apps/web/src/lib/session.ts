import type { CurrentUserResponse } from '@aiaget/shared-types';

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  currentUser: CurrentUserResponse;
}

export interface LoginInput {
  tenantCode: string;
  email: string;
  password: string;
}

export const SESSION_STORAGE_KEY = 'aiaget.auth.session.v1';

export function createSessionFromLogin(input: {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  currentUser: CurrentUserResponse;
}): AuthSession {
  return {
    accessToken: input.accessToken,
    refreshToken: input.refreshToken,
    expiresAt: new Date(Date.now() + input.expiresIn * 1000).toISOString(),
    currentUser: input.currentUser,
  };
}

export function getStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as AuthSession;
  } catch {
    clearStoredSession();
    return null;
  }
}

export function saveStoredSession(session: AuthSession) {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function isAccessTokenFresh(session: AuthSession | null): session is AuthSession {
  if (!session?.accessToken || !session.expiresAt) {
    return false;
  }

  return new Date(session.expiresAt).getTime() > Date.now() + 30_000;
}

