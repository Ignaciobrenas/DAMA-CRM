import React from 'react';
import { motion } from 'framer-motion';
import { ThinkingOrb } from 'thinking-orbs';

interface LoadingStateProps {
  title?: string;
  subtitle?: string;
  variant?: 'card' | 'fullscreen' | 'skeleton' | 'inline';
  rows?: number;
  orbState?: 'working' | 'searching' | 'solving' | 'listening' | 'connecting' | 'weaving' | 'composing' | 'breathing' | 'shaping';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  title = 'Cargando información...',
  subtitle = 'Sincronizando registros con la base de datos empresarial',
  variant = 'card',
  rows = 4,
  orbState = 'searching',
}) => {
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  if (variant === 'inline') {
    return (
      <div className="flex items-center space-x-2.5 py-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
        <ThinkingOrb state={orbState} size={20} theme={isDark ? 'dark' : 'light'} />
        <span className="font-semibold tracking-tight">{title}</span>
      </div>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className="space-y-3 p-4 w-full animate-pulse">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
              <div className="h-2.5 bg-slate-100 dark:bg-slate-800/60 rounded w-1/2" />
            </div>
            <div className="w-16 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-10 text-center my-6 rounded-3xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-xs backdrop-blur-md"
    >
      <div className="relative mb-5 flex items-center justify-center">
        {/* Glow halo */}
        <div className="absolute inset-0 bg-blue-500/15 dark:bg-blue-500/25 blur-2xl rounded-full" />
        
        <div className="relative z-10 p-2 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-md">
          <ThinkingOrb state={orbState} size={64} theme={isDark ? 'dark' : 'light'} />
        </div>
      </div>

      <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1.5 leading-relaxed font-normal">
        {subtitle}
      </p>

      {/* Shimmer line */}
      <div className="w-32 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mt-5 overflow-hidden">
        <div className="h-full bg-blue-600 rounded-full w-1/2 animate-shimmer" />
      </div>
    </motion.div>
  );
};

