import React from 'react';
import { motion } from 'framer-motion';
import { Compass, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface NotFoundProps {
  onBack: () => void;
}

export const NotFound: React.FC<NotFoundProps> = ({ onBack }) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 md:p-12 shadow-2xl shadow-slate-200/50 dark:shadow-none text-center relative overflow-hidden"
      >
        {/* Subtle background decoration */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-slate-100 dark:bg-slate-800 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-slate-100 dark:bg-slate-800 rounded-full blur-3xl opacity-50 pointer-events-none" />

        <div className="relative z-10">
          <div className="w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-800 rounded-[1.5rem] flex items-center justify-center mb-8 rotate-3">
            <Compass className="w-10 h-10 text-slate-800 dark:text-slate-200" />
          </div>

          <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">
            404
          </h1>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            {t('notfound.title', 'Ruta Desconocida')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-10">
            {t('notfound.description', 'El módulo o página que buscas no existe en tu configuración actual o no tienes los permisos necesarios para acceder (RBAC).')}
          </p>

          <button
            onClick={onBack}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-2xl text-sm font-bold shadow-sm transition-all active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('notfound.back', 'Volver a la Base')}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
