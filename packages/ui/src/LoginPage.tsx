import React, { useState, useEffect } from 'react';
import { Button } from './Button';

const API = 'http://localhost:4000/api';

interface Actor {
  id: string;
  role: string;
}

interface LoginPageProps {
  role: string;
  appName?: string;
  appRole?: string;
  onLogin: (token: string) => void;
}

export function LoginPage({ role, appName, appRole, onLogin }: LoginPageProps) {
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

  const displayName = appName ?? role;

  return (
    <div data-role={appRole} className="login-wrap">
      <div className="login-card">
        <div className="login-brand">
          <div className="logo">MediTrack</div>
          <div className="sub">{displayName} sign in</div>
        </div>
        <div className="card">
          <div className="login-accent" />
          <div className="card-pad">
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="login-user" className="label">User</label>
                <select
                  id="login-user"
                  value={actorId}
                  onChange={(e) => setActorId(e.target.value)}
                  className="select"
                  required
                >
                  {actors.map((a) => (
                    <option key={a.id} value={a.id}>{a.id}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="login-password" className="label">Password</label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  required
                  autoComplete="current-password"
                />
              </div>
              {error && <p role="alert" className="error-text" style={{ marginBottom: 14 }}>{error}</p>}
              <Button type="submit" disabled={submitting || !actorId} className="btn-block" style={{ marginTop: 4 }}>
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
