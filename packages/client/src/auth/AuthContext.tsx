import React, { createContext, useContext, useState } from 'react';

interface AuthState {
  token: string | null;
  actorId: string | null;
  role: string | null;
}

interface AuthContextValue extends AuthState {
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'meditrack_token';

function decodeTokenPayload(token: string): { actorId: string; role: string } | null {
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
    return {
      actorId: (payload as Record<string, string>).actorId,
      role: (payload as Record<string, string>).role,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) return { token: null, actorId: null, role: null };
    const decoded = decodeTokenPayload(token);
    if (!decoded) return { token: null, actorId: null, role: null };
    return { token, ...decoded };
  });

  function login(token: string) {
    const decoded = decodeTokenPayload(token);
    if (!decoded) return;
    localStorage.setItem(STORAGE_KEY, token);
    setState({ token, ...decoded });
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setState({ token: null, actorId: null, role: null });
  }

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
