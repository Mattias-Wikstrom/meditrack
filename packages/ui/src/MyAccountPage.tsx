import React, { useState } from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { BackButton } from './BackButton';

const API = 'http://localhost:4000/api';

interface MyAccountPageProps {
  token: string;
  actorId: string;
  role: string;
  wardUnitName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MyAccountPage({ token, actorId, role, wardUnitName, onSuccess, onCancel }: MyAccountPageProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const body = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(body.error ?? 'Failed to change password');
      setSuccess(true);
      if (onSuccess) setTimeout(onSuccess, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="stack" style={{ maxWidth: 520 }}>
      {onCancel && <BackButton onClick={onCancel} />}
      <h1 className="h1">My Account</h1>
      <Card className="card-pad">
        <div style={{ marginBottom: 18, lineHeight: 1.9 }}>
          <div className="subtle">Signed in as <strong style={{ color: 'var(--ink)' }}>{actorId}</strong></div>
          <div className="subtle">Role · <strong style={{ color: 'var(--ink)' }}>{role}</strong></div>
          {wardUnitName && <div className="subtle">Ward unit · <strong style={{ color: 'var(--ink)' }}>{wardUnitName}</strong></div>}
        </div>
        {success ? (
          <p role="status" className="success-text">Password changed successfully.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="account-current-password" className="label">Current password</label>
              <input
                id="account-current-password"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="input"
                required
                autoComplete="current-password"
              />
            </div>
            <div className="field">
              <label htmlFor="account-new-password" className="label">New password</label>
              <input
                id="account-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input"
                required
                autoComplete="new-password"
              />
            </div>
            <div className="field">
              <label htmlFor="account-confirm-password" className="label">Confirm new password</label>
              <input
                id="account-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                required
                autoComplete="new-password"
              />
            </div>
            {error && <p role="alert" className="error-text" style={{ marginBottom: 14 }}>{error}</p>}
            <Button type="submit" disabled={submitting} className="btn-block">
              {submitting ? 'Saving…' : 'Change password'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
