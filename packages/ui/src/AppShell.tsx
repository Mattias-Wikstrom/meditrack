// Used in App.tsx in all the apps
import React from 'react';

interface AppShellProps {
  appName: string;
  actorName: string;
  children: React.ReactNode;
  nav?: React.ReactNode;
  context?: string;
  onHome?: () => void;
  onProfile?: () => void;
  onLogout?: () => void;
}

export function AppShell({ appName, actorName, children, nav, context, onHome, onProfile, onLogout }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-accent shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onHome ? (
              <button onClick={onHome} className="text-white font-semibold text-lg tracking-tight hover:text-white/80 transition-colors">MediTrack</button>
            ) : (
              <span className="text-white font-semibold text-lg tracking-tight">MediTrack</span>
            )}
            <span className="text-white/50 text-sm">·</span>
            <span className="text-white/90 text-sm font-medium">{appName}</span>
          </div>
          <div className="flex items-center gap-4">
            {context && (
              <span className="text-white/60 text-sm">{context}</span>
            )}
            {onProfile ? (
              <button
                onClick={onProfile}
                aria-label={`My account (${actorName})`}
                className="text-white/70 text-sm hover:text-white transition-colors"
              >
                {actorName}
              </button>
            ) : (
              <span className="text-white/70 text-sm">{actorName}</span>
            )}
            {onLogout && (
              <button
                onClick={onLogout}
                className="text-white/50 text-xs hover:text-white/80 transition-colors"
              >
                Log out
              </button>
            )}
          </div>
        </div>
      </header>
      {nav && (
        <div className="border-b border-slate-200 bg-white">
          <div className="max-w-5xl mx-auto px-6">
            {nav}
          </div>
        </div>
      )}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
