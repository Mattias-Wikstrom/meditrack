// Can be used as a '/me' page in all the apps
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
    <div className="max-w-sm">
      {onCancel && (
        <BackButton onClick={onCancel} className="mb-4 inline-block" />
      )}
      <h1 className="text-xl font-semibold text-slate-800 mb-6">My Account</h1>
      <Card className="p-6">
        <div className="mb-6 space-y-1">
          <p className="text-sm text-slate-500">
            Signed in as <span className="font-medium text-slate-700">{actorId}</span>
          </p>
          <p className="text-sm text-slate-500">
            Role: <span className="font-medium text-slate-700">{role}</span>
          </p>
          {wardUnitName && (
            <p className="text-sm text-slate-500">
              Ward unit: <span className="font-medium text-slate-700">{wardUnitName}</span>
            </p>
          )}
        </div>
        {success ? (
          <p className="text-green-600 text-sm">Password changed successfully.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Current password</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                required
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                required
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                required
                autoComplete="new-password"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Saving…' : 'Change password'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
