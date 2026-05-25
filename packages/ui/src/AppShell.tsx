import React from 'react';

interface AppShellProps {
  appName: string;
  actorName: string;
  children: React.ReactNode;
  onProfile?: () => void;
  onLogout?: () => void;
}

export function AppShell({ appName, actorName, children, onProfile, onLogout }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-accent shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-lg tracking-tight">MediTrack</span>
            <span className="text-white/50 text-sm">·</span>
            <span className="text-white/90 text-sm font-medium">{appName}</span>
          </div>
          <div className="flex items-center gap-4">
            {onProfile ? (
              <button
                onClick={onProfile}
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
      <main className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
