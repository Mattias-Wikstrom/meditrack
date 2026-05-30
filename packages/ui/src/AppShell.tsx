import React from 'react';

interface AppShellProps {
  appName: string;
  actorName: string;
  children: React.ReactNode;
  nav?: React.ReactNode;
  context?: string;
  role?: string;
  onHome?: () => void;
  onProfile?: () => void;
  onLogout?: () => void;
}

export function AppShell({ appName, actorName, children, nav, context, role, onHome, onProfile, onLogout }: AppShellProps) {
  return (
    <div data-role={role}>
      <div className="appbar">
        <div className="appbar-inner">
          <div className="brand" onClick={onHome} role={onHome ? 'button' : undefined} tabIndex={onHome ? 0 : undefined} onKeyDown={onHome ? (e) => e.key === 'Enter' && onHome() : undefined}>
            <span className="logo">MediTrack</span>
            <span className="dot">·</span>
            <span className="sub">{appName}</span>
          </div>
          <div className="appbar-right">
            {context && <span className="ward">{context}</span>}
            {onProfile ? (
              <button
                className="who"
                style={{ background: 'none', border: 'none', color: '#fff', fontFamily: 'inherit', fontSize: 14 }}
                onClick={onProfile}
                aria-label={`My account (${actorName})`}
              >
                {actorName}
              </button>
            ) : (
              <span className="who" style={{ cursor: 'default' }}>{actorName}</span>
            )}
            {onLogout && (
              <button
                className="logout"
                style={{ background: 'none', border: 'none', color: '#fff', fontFamily: 'inherit', fontSize: 14 }}
                onClick={onLogout}
              >
                Log out
              </button>
            )}
          </div>
        </div>
      </div>
      {nav && (
        <div className="tabbar">
          <div className="tabbar-inner">{nav}</div>
        </div>
      )}
      <div className="page">{children}</div>
    </div>
  );
}
