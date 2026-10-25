import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Cookie, Settings, Check, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const CookieBanner: React.FC = () => {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('dama_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('dama_cookie_consent', JSON.stringify({ technical: true, analytics: true, timestamp: new Date().toISOString() }));
    setIsVisible(false);
  };

  const handleRejectNonEssential = () => {
    localStorage.setItem('dama_cookie_consent', JSON.stringify({ technical: true, analytics: false, timestamp: new Date().toISOString() }));
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('dama_cookie_consent', JSON.stringify({ technical: true, analytics: analyticsEnabled, timestamp: new Date().toISOString() }));
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 m-auto pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="pointer-events-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-lg w-full relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500" />

            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4 border border-blue-100 dark:border-blue-900/50">
                <Cookie className="w-7 h-7" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {t('cookies.title', 'Configuración de Privacidad y Cookies')}
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                {t(
                  'cookies.description',
                  'En cumplimiento del Art. 22.2 de la LSSI-CE y la Guía de Cookies de la AEPD, le informamos de que utilizamos cookies técnicas necesarias para el funcionamiento seguro de la plataforma y cookies analíticas para mejorar su experiencia. Puede aceptar todas, rechazar las no esenciales o personalizar sus preferencias.'
                )}
              </p>

              {showConfig ? (
                <div className="w-full text-left bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 mb-6 border border-slate-200/80 dark:border-slate-700/60 space-y-4">
                  {/* Cookies Técnicas */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {t('cookies.technicalTitle', 'Cookies Técnicas y de Sesión')}
                        </span>
                        <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold px-1.5 py-0.5 rounded">
                          {t('cookies.required', 'Obligatorias')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {t('cookies.technicalDesc', 'Imprescindibles para autenticación segura (JWT), aislamiento multi-tenant y token anti-CSRF.')}
                      </p>
                    </div>
                    <div className="w-5 h-5 rounded bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Cookies Analíticas */}
                  <div className="flex items-start justify-between gap-3 pt-3 border-t border-slate-200/70 dark:border-slate-700/70">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {t('cookies.analyticsTitle', 'Cookies Analíticas y de Rendimiento')}
                        </span>
                        <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold px-1.5 py-0.5 rounded">
                          {t('cookies.optional', 'Opcionales')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {t('cookies.analyticsDesc', 'Métricas de navegación anónimas para optimizar tiempos de respuesta y ergonomía del CRM.')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                      className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 mt-0.5 ${
                        analyticsEnabled ? 'bg-blue-600 justify-end' : 'bg-slate-300 dark:bg-slate-600 justify-start'
                      }`}
                    >
                      <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Botones de acción con la misma prominencia visual (Guía AEPD 2024 / LSSI-CE) */}
              <div className="w-full flex flex-col gap-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                  <button
                    onClick={handleAcceptAll}
                    className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98] border border-blue-600 flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    {t('cookies.acceptAll', 'Aceptar Todas')}
                  </button>
                  <button
                    onClick={handleRejectNonEssential}
                    className="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98] border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    {t('cookies.rejectAll', 'Rechazar Opcionales')}
                  </button>
                </div>

                {showConfig ? (
                  <button
                    onClick={handleSavePreferences}
                    className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all"
                  >
                    {t('cookies.savePreferences', 'Guardar Configuración')}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowConfig(true)}
                    className="w-full px-4 py-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-xl border border-dashed border-slate-300 dark:border-slate-700 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    {t('cookies.customize', 'Personalizar Cookies')}
                  </button>
                )}
              </div>

              <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-mono uppercase tracking-wider">AEPD / LSSI-CE Art. 22.2 / RGPD</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
