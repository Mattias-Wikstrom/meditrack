// Used for Back buttons in all the apps
import { ButtonHTMLAttributes } from 'react';

type BackButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: string;
};

export function BackButton({ label = 'Back', className = '', ...props }: BackButtonProps) {
  return (
    <button
      type="button"
      className={`text-[var(--muted)] hover:text-[var(--text)] transition-colors text-sm ${className}`.trim()}
      {...props}
    >
      ← {label}
    </button>
  );
}
