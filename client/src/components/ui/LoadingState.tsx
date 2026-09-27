import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw } from 'lucide-react';

interface LoadingStateProps {
  title?: string;
  subtitle?: string;
  variant?: 'card' | 'fullscreen' | 'skeleton' | 'inline';
  rows?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  title = 'Cargando información...',
  subtitle = 'Sincronizando registros con la base de datos empresarial',
  variant = 'card',
  rows = 4,
}) => {
  if (variant === 'inline') {
    return (
      <div className="flex items-center space-x-2 py-3 text-xs text-gray-500 dark:text-slate-400">
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="font-medium">{title}</span>
      </div>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className="space-y-3 p-4 w-full animate-pulse">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-200 dark:bg-slate-800 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-gray-200 dark:bg-slate-800 rounded w-3/4" />
              <div className="h-2.5 bg-gray-100 dark:bg-slate-800/60 rounded w-1/2" />
            </div>
            <div className="w-16 h-6 bg-gray-100 dark:bg-slate-800 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center my-6 rounded-2xl bg-gradient-to-b from-blue-50/30 to-indigo-50/10 dark:from-slate-900/60 dark:to-slate-950/40 border border-blue-100 dark:border-slate-800/80 shadow-2xs">
      <div className="relative mb-4">
        {/* Glowing Orb Backdrop */}
        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
        
        {/* Animated Brand Loader Icon */}
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.08, 1],
          }}
          transition={{
            rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
            scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25"
        >
          <Sparkles className="w-7 h-7 animate-bounce-subtle" />
        </motion.div>
      </div>

      <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-gray-500 dark:text-slate-400 max-w-xs mt-1 leading-relaxed">
        {subtitle}
      </p>

      {/* Pulsing Progress Line */}
      <div className="w-36 h-1 bg-gray-200 dark:bg-slate-800 rounded-full mt-5 overflow-hidden">
        <div className="h-full bg-blue-600 dark:bg-blue-400 rounded-full w-1/2 animate-shimmer" />
      </div>
    </div>
  );
};
