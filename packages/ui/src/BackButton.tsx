import { ButtonHTMLAttributes } from 'react';

type BackButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: string;
};

export function BackButton({ label = 'Back', className = '', ...props }: BackButtonProps) {
  return (
    <button type="button" className={`backlink${className ? ' ' + className : ''}`} {...props}>
      ← {label}
    </button>
  );
}
