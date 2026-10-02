import React from 'react';
import { clsx } from 'clsx';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-900 text-white hover:bg-slate-800',
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
  destructive: 'bg-red-500 text-white hover:bg-red-600',
  outline: 'border border-slate-300 text-slate-700 bg-transparent',
};

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'default', ...props }) => (
  <span
    className={clsx(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
      variantClasses[variant],
      className
    )}
    {...props}
  />
);
