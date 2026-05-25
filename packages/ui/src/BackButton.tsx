import { ButtonHTMLAttributes } from 'react';

type BackButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: string;
};

export function BackButton({ label = 'Back', className = '', ...props }: BackButtonProps) {
  return (
    <button
      type="button"
      className={`text-slate-400 hover:text-slate-600 transition-colors text-sm ${className}`.trim()}
      {...props}
    >
      ← {label}
    </button>
  );
}
