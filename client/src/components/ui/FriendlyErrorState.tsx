import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, HelpCircle, ArrowLeft } from 'lucide-react';

interface FriendlyErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onBack?: () => void;
  variant?: 'banner' | 'card' | 'inline';
}

export const FriendlyErrorState: React.FC<FriendlyErrorStateProps> = ({
  title = 'Ha ocurrido un pequeño contratiempo',
  message = 'No te preocupes, tus datos están a salvo. Puedes intentar recargar la información o verificar tu conexión.',
  onRetry,
  onBack,
  variant = 'card',
}) => {
  if (variant === 'banner') {
    return (
      <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2.5 text-rose-800 dark:text-rose-300">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span className="font-medium">{message}</span>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] shrink-0 transition"
          >
            Reintentar
          </button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 my-6 rounded-2xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-950/60 shadow-xs text-center flex flex-col items-center justify-center max-w-lg mx-auto"
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 shadow-sm">
        <AlertTriangle className="w-7 h-7 animate-bounce-subtle" />
      </div>

      <h3 className="text-base font-bold text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1.5 leading-relaxed max-w-md">
        {message}
      </p>

      <div className="flex items-center space-x-2.5 mt-6">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver</span>
          </button>
        )}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Volver a intentar</span>
          </button>
        )}
      </div>
    </motion.div>
  );
};
