import React, { createContext, useCallback, useContext, useState } from 'react';

interface AuthState {
  token: string | null;
  actorId: string | null;
  role: string | null;
  wardUnitId: string | null;
}

interface AuthContextValue extends AuthState {
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'meditrack_token';

const LOGGED_OUT: AuthState = { token: null, actorId: null, role: null, wardUnitId: null };

function decodeTokenPayload(token: string): { actorId: string; role: string; wardUnitId: string | null; exp?: number } | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64)) as unknown;
    if (
      typeof payload !== 'object' ||
      payload === null ||
      !('actorId' in payload) ||
      !('role' in payload) ||
      typeof (payload as Record<string, unknown>).actorId !== 'string' ||
      typeof (payload as Record<string, unknown>).role !== 'string'
    ) return null;
    const p = payload as Record<string, unknown>;
    return {
      actorId: p.actorId as string,
      role: p.role as string,
      wardUnitId: typeof p.wardUnitId === 'string' ? p.wardUnitId : null,
      exp: typeof p.exp === 'number' ? p.exp : undefined,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) return LOGGED_OUT;
    const decoded = decodeTokenPayload(token);
    if (!decoded) return LOGGED_OUT;
    // Discard token that already expired while the tab was closed.
    if (decoded.exp !== undefined && Date.now() >= decoded.exp * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return LOGGED_OUT;
    }
    return { token, actorId: decoded.actorId, role: decoded.role, wardUnitId: decoded.wardUnitId };
  });

  const login = useCallback((token: string) => {
    const decoded = decodeTokenPayload(token);
    if (!decoded) return;
    localStorage.setItem(STORAGE_KEY, token);
    setState({ token, actorId: decoded.actorId, role: decoded.role, wardUnitId: decoded.wardUnitId });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(LOGGED_OUT);
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
