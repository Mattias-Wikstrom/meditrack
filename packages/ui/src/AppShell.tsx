import React from 'react';

interface AppShellProps {
  appName: string;
  actorName: string;
  children: React.ReactNode;
}

export function AppShell({ appName, actorName, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-accent shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-lg tracking-tight">MediTrack</span>
            <span className="text-white/50 text-sm">·</span>
            <span className="text-white/90 text-sm font-medium">{appName}</span>
          </div>
          <span className="text-white/70 text-sm">{actorName}</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
