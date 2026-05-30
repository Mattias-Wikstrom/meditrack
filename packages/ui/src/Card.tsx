// Used as a container panel throughout all the apps
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({ children, className = '', style }: CardProps) {
  return (
    <div className={`bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-sm ${className}`} style={style}>
      {children}
    </div>
  );
}
