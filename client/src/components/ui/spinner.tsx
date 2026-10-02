import React from 'react';
import { clsx } from 'clsx';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Spinner: React.FC<SpinnerProps> = ({ className, ...props }) => (
  <div
    className={clsx('inline-block animate-spin rounded-full border-2 border-slate-200 border-t-slate-700 h-6 w-6', className)}
    role="status"
    aria-label="Cargando..."
    {...props}
  />
);
