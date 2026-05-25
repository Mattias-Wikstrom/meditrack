import React, { useState, useEffect } from 'react';
import { Button } from './Button';

const API = 'http://localhost:4000/api';

interface Actor {
  id: string;
  role: string;
}

interface LoginPageProps {
  role: string;
  onLogin: (token: string) => void;
}

export function LoginPage({ role, onLogin }: LoginPageProps) {
  const [actors, setActors] = useState<Actor[]>([]);
  const [actorId, setActorId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${API}/actors?role=${role}`)
      .then((r) => r.json())
      .then((data: Actor[]) => {
        setActors(data);
        if (data.length > 0) setActorId(data[0].id);
      })
      .catch(() => setError('Failed to load users'));
  }, [role]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorId, password }),
      });
      const body = await res.json() as { token?: string; error?: string };
      if (!res.ok) throw new Error(body.error ?? 'Login failed');
      onLogin(body.token!);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-slate-800">MediTrack</h1>
          <p className="text-slate-500 text-sm mt-1">{role} sign in</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">User</label>
            <select
              value={actorId}
              onChange={(e) => setActorId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
              required
            >
              {actors.map((a) => (
                <option key={a.id} value={a.id}>{a.id}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Button type="submit" disabled={submitting || !actorId} className="w-full">
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
}
