import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'soft';
  size?: 'sm' | 'md';
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const variantCls = {
    primary: 'btn-primary',
    ghost:   'btn-ghost',
    danger:  'btn-danger',
    soft:    'btn-soft',
  }[variant];
  const sizeCls = size === 'sm' ? 'btn-sm' : '';
  const cls = ['btn', variantCls, sizeCls, className].filter(Boolean).join(' ');
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
