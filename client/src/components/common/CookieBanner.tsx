import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Cookie } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const CookieBanner: React.FC = () => {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('dama_cookie_consent');
    if (!consent) {
      // Small delay to not aggressive pop right on load
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('dama_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('dama_cookie_consent', 'declined');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 m-auto bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-8 max-w-md w-full relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6">
                <Cookie className="w-8 h-8 text-slate-600 dark:text-slate-400" />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                {t('cookies.title', 'Privacidad y Cookies (RGPD)')}
              </h3>
              
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                {t('cookies.description', 'Utilizamos cookies técnicas y analíticas para garantizar la seguridad de tus sesiones, mantener tus preferencias y cumplir con las normativas ISO 27001. No vendemos tus datos a terceros.')}
              </p>

              <div className="flex flex-col w-full gap-3">
                <button
                  onClick={handleAccept}
                  className="w-full px-6 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-sm font-bold rounded-xl shadow-sm transition-all active:scale-[0.98]"
                >
                  {t('cookies.accept', 'Aceptar Cookies Esenciales')}
                </button>
                <button
                  onClick={handleDecline}
                  className="w-full px-6 py-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-semibold rounded-xl border border-transparent transition-all"
                >
                  {t('cookies.decline', 'Rechazar Analíticas (Solo Funcionales)')}
                </button>
              </div>
              
              <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                <ShieldAlert className="w-3 h-3" />
                <span>ISO 27001 / RGPD COMPLIANT</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
