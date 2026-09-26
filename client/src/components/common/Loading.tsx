import React from 'react';
import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: string;
  label?: string;
}

import { useLanguage } from '../../context/LanguageContext';

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  color = 'currentColor',
  label,
}) => {
  let loadingText = 'Cargando';
  try {
    const lang = useLanguage();
    if (lang && lang.t) loadingText = lang.t('loading', 'Cargando');
  } catch {
    // LanguageProvider not available yet
  }

  const sizeClasses = {
    xs: 'w-3 h-3 border-[1.5px]',
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-[2.5px]',
    xl: 'w-12 h-12 border-3',
  };

  return (
    <div className={clsx('inline-flex items-center space-x-2', className)}>
      <div
        className={clsx(
          'rounded-full animate-spin border-t-transparent',
          sizeClasses[size]
        )}
        style={{ borderColor: `${color} transparent transparent transparent`, borderTopColor: color }}
        role="status"
        aria-label={loadingText}
      />
      {label && <span className="text-xs font-medium text-gray-500 dark:text-slate-400">{label}</span>}
    </div>
  );
};

export const PulseLogo: React.FC<{ size?: number; className?: string }> = ({
  size = 64,
  className = '',
}) => {
  return (
    <div className={clsx('relative inline-flex items-center justify-center', className)}>
      {/* Outer ambient glow ripple */}
      <div
        className="absolute inset-0 rounded-2xl bg-blue-500/20 dark:bg-blue-500/30 animate-ping opacity-75"
        style={{ width: size, height: size }}
      />
      {/* Concentric pulsing aura */}
      <div
        className="absolute rounded-2xl bg-gradient-to-tr from-blue-600/30 to-indigo-500/20 blur-md animate-pulse"
        style={{ width: size * 1.2, height: size * 1.2 }}
      />
      {/* Logo container */}
      <div
        className="relative z-10 rounded-2xl overflow-hidden shadow-lg border border-blue-200/50 dark:border-blue-700/50 bg-white dark:bg-slate-900 flex items-center justify-center transition-transform hover:scale-105"
        style={{ width: size, height: size }}
      >
        <img
          src="/assets/logos/dama-symbol-dark.svg"
          alt="DAMA"
          className="w-4/5 h-4/5 object-contain filter drop-shadow-xs dark:hidden"
        />
        <img
          src="/assets/logos/dama-symbol-white.svg"
          alt="DAMA"
          className="w-4/5 h-4/5 object-contain filter drop-shadow-xs hidden dark:block"
        />
      </div>
    </div>
  );
};

export const LoadingScreen: React.FC<{
  title?: string;
  message?: string;
  progress?: number;
}> = ({
  title = 'DAMA-CRM',
  message,
  progress,
}) => {
  let displayMessage = message;
  let syncLabel = 'Sincronizando Sistema Modular';
  try {
    const lang = useLanguage();
    if (lang && lang.t) {
      if (!displayMessage) displayMessage = lang.t('loading.workspaceDefault', 'Cargando espacio de trabajo empresarial...');
      syncLabel = lang.t('loading.syncModularSystem', 'Sincronizando Sistema Modular');
    }
  } catch {
    if (!displayMessage) displayMessage = 'Cargando espacio de trabajo empresarial...';
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-50/95 dark:bg-slate-950/95 backdrop-blur-md transition-all">
      <div className="flex flex-col items-center max-w-sm px-6 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <PulseLogo size={80} />

        <div className="space-y-1.5">
          <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
            {title}
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
            {displayMessage}
          </p>
        </div>

        {/* Shimmering Progress Bar */}
        <div className="w-48 h-1.5 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden relative shadow-inner">
          {progress !== undefined ? (
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          ) : (
            <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-400 to-blue-600 rounded-full w-2/5 animate-[shimmer_1.5s_infinite_linear] absolute left-0" />
          )}
        </div>

        <div className="text-[10px] tracking-wider uppercase text-blue-600 dark:text-blue-400 font-semibold flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
          <span>{syncLabel}</span>
        </div>
      </div>
    </div>
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={clsx(
      'p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 animate-pulse space-y-3',
      className
    )}
  >
    <div className="flex items-center justify-between">
      <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded-md w-1/3" />
      <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-slate-800" />
    </div>
    <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded-lg w-1/2" />
    <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded-md w-3/4" />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4,
}) => (
  <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4 space-y-3 animate-pulse">
    <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
      <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded-md w-1/4" />
      <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded-xl w-24" />
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex items-center space-x-4 py-2 border-b border-gray-50 dark:border-slate-800/40 last:border-none">
        {Array.from({ length: cols }).map((_, c) => (
          <div
            key={c}
            className="h-3.5 bg-gray-200 dark:bg-slate-800 rounded-md flex-1"
            style={{ width: `${100 / cols}%` }}
          />
        ))}
      </div>
    ))}
  </div>
);

export const LoadingButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    isLoading?: boolean;
    loadingText?: string;
    variant?: 'primary' | 'secondary' | 'danger';
  }
> = ({
  children,
  isLoading = false,
  loadingText,
  variant = 'primary',
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-xl text-xs px-4 py-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs',
    secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-xs',
  };

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={clsx(baseClasses, variants[variant], className)}
    >
      {isLoading ? (
        <span className="flex items-center space-x-2">
          <LoadingSpinner size="sm" color="white" />
          <span>{loadingText || children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
