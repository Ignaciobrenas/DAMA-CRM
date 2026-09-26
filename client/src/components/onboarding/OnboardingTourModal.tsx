import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Building2,
  Clock,
  Briefcase,
  Kanban,
  Receipt,
  Headphones,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Sliders,
  ArrowRight,
  Sparkle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useModules } from '../../context/ModulesContext';

interface OnboardingTourModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  forceOpen?: boolean;
}

export const OnboardingTourModal: React.FC<OnboardingTourModalProps> = ({
  isOpen: propIsOpen,
  onClose,
  forceOpen = false,
}) => {
  const { user, updatePreferences } = useAuth();
  const { t } = useLanguage();
  const { isModuleEnabled, isCompanyAdmin } = useModules();

  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Determine modal visibility
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return;
    }

    if (propIsOpen !== undefined) {
      setIsOpen(propIsOpen);
      return;
    }

    // Auto-open on first login if tour has not been dismissed
    const tourDismissed = localStorage.getItem('dama_crm_tour_dismissed');
    if (user && !tourDismissed && user.preferences?.onboardingCompleted !== true) {
      setIsOpen(true);
    }
  }, [user, propIsOpen, forceOpen]);

  const handleClose = (markCompleted = true) => {
    setIsOpen(false);
    localStorage.setItem('dama_crm_tour_dismissed', 'true');
    if (markCompleted) {
      updatePreferences({ onboardingCompleted: true });
    }
    if (onClose) onClose();
  };

  const handleFinish = () => {
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#072053', '#2563EB', '#60A5FA', '#10B981', '#F59E0B'],
      });
    } catch {}
    handleClose(true);
  };

  if (!isOpen || !user) return null;

  const roleUpper = (user.role || 'USUARIO').toUpperCase();

  // Friendly role descriptions and custom capabilities fully localized
  const getRoleCapabilities = () => {
    if (roleUpper === 'ADMIN' || user.email === 'ignaciobrenas@gmail.com' || user.email === 'admin@dama-crm.local') {
      return {
        badge: t('tour.roleSuperAdminBadge'),
        color: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800',
        summary: t('tour.roleSuperAdminSummary'),
        bullets: [
          t('tour.roleSuperAdminBullet1'),
          t('tour.roleSuperAdminBullet2'),
          t('tour.roleSuperAdminBullet3'),
          t('tour.roleSuperAdminBullet4'),
        ],
      };
    }

    if (isCompanyAdmin || roleUpper === 'COMPANY_ADMIN' || roleUpper === 'GERENTE' || roleUpper === 'DIRECTOR') {
      return {
        badge: t('tour.roleAdminBadge'),
        color: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800',
        summary: t('tour.roleAdminSummary'),
        bullets: [
          t('tour.roleAdminBullet1'),
          t('tour.roleAdminBullet2'),
          t('tour.roleAdminBullet3'),
          t('tour.roleAdminBullet4'),
        ],
      };
    }

    if (roleUpper === 'SALES' || roleUpper === 'COMERCIAL') {
      return {
        badge: t('tour.roleSalesBadge'),
        color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800',
        summary: t('tour.roleSalesSummary'),
        bullets: [
          t('tour.roleSalesBullet1'),
          t('tour.roleSalesBullet2'),
          t('tour.roleSalesBullet3'),
          t('tour.roleSalesBullet4'),
        ],
      };
    }

    if (roleUpper === 'TECH' || roleUpper === 'TECNICO' || roleUpper === 'DEVELOPER') {
      return {
        badge: t('tour.roleTechBadge'),
        color: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-800',
        summary: t('tour.roleTechSummary'),
        bullets: [
          t('tour.roleTechBullet1'),
          t('tour.roleTechBullet2'),
          t('tour.roleTechBullet3'),
          t('tour.roleTechBullet4'),
        ],
      };
    }

    // Default Employee
    return {
      badge: t('tour.roleEmployeeBadge'),
      color: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 border-cyan-300 dark:border-cyan-800',
      summary: t('tour.roleEmployeeSummary'),
      bullets: [
        t('tour.roleEmployeeBullet1'),
        t('tour.roleEmployeeBullet2'),
        t('tour.roleEmployeeBullet3'),
        t('tour.roleEmployeeBullet4'),
      ],
    };
  };

  const roleInfo = getRoleCapabilities();

  // Active Modules preview list
  const activeModulesList = [
    { id: 'portalEmpleado', name: t('modules.portalEmpleadoTitle'), icon: Clock, desc: t('modules.portalEmpleadoDesc') },
    { id: 'pipeline', name: t('modules.pipelineTitle'), icon: Briefcase, desc: t('modules.pipelineDesc') },
    { id: 'agile', name: t('modules.agileTitle'), icon: Kanban, desc: t('modules.agileDesc') },
    { id: 'invoicing', name: t('modules.invoicingTitle'), icon: Receipt, desc: t('modules.invoicingDesc') },
    { id: 'tickets', name: t('modules.ticketsTitle'), icon: Headphones, desc: t('modules.ticketsDesc') },
    { id: 'companies', name: t('modules.companiesTitle'), icon: Building2, desc: t('modules.companiesDesc') },
  ].filter((m) => isModuleEnabled(m.id as any));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Top Banner / Progress Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 p-4">
              <button
                type="button"
                onClick={() => handleClose(false)}
                className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                title={t('tour.closeTour')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-2 text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{t('tour.guideBadge')}</span>
            </div>

            <h2 className="text-lg sm:text-xl font-black text-white">
              {step === 1 && t('tour.welcomeTitle').replace('{name}', user.name.split(' ')[0])}
              {step === 2 && t('tour.permissionsTitle')}
              {step === 3 && t('tour.featuresTitle')}
            </h2>

            <p className="text-xs text-blue-100 mt-1 max-w-md">
              {step === 1 && t('tour.welcomeSubtitle')}
              {step === 2 && t('tour.permissionsSubtitle').replace('{role}', user.role || 'USUARIO')}
              {step === 3 && t('tour.featuresSubtitle')}
            </p>

            {/* Step Pills */}
            <div className="flex items-center space-x-2 mt-4">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    step === s ? 'w-8 bg-white' : 'w-2 bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {/* Step 1: Welcome & Overview */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-gray-900 dark:text-white">
                      {t('tour.activeAccount')}: <span className="text-blue-600 dark:text-blue-400">{user.email}</span>
                    </div>
                    <div className="text-gray-500 dark:text-slate-400 leading-relaxed">
                      {t('tour.roleAssignedDesc').replace('{role}', user.role || 'USUARIO')}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 space-y-1">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-900 dark:text-white">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>{t('tour.clockInCardTitle')}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-tight">
                      {t('tour.clockInCardDesc')}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 space-y-1">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-900 dark:text-white">
                      <Sliders className="w-4 h-4 text-purple-600" />
                      <span>{t('tour.zoomCardTitle')}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-tight">
                      {t('tour.zoomCardDesc')}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Role & Permissions Breakdown */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{t('tour.assignedAccessLevel')}:</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border shadow-xs ${roleInfo.color}`}>
                    {roleInfo.badge}
                  </span>
                </div>

                <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                  {roleInfo.summary}
                </p>

                <div className="space-y-2 p-4 rounded-2xl bg-gray-50/80 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    {t('tour.allowedActions')}
                  </span>
                  {roleInfo.bullets.map((bullet, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-xs text-gray-700 dark:text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-gray-400 dark:text-slate-400 text-center">
                  {t('tour.morePermissionsHint')}
                </p>
              </motion.div>
            )}

            {/* Step 3: Available Features & Tips */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white block mb-2">
                    {t('tour.activeModulesTitle')}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                    {activeModulesList.map((mod) => {
                      const Icon = mod.icon;
                      return (
                        <div
                          key={mod.id}
                          className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center space-x-2.5 shadow-xs"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="text-xs overflow-hidden">
                            <div className="font-bold text-gray-900 dark:text-white truncate">{mod.name}</div>
                            <div className="text-[10px] text-gray-500 dark:text-slate-400 truncate">{mod.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-300 flex items-center space-x-2.5">
                  <Sparkle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    {t('tour.commandMenuTip')}
                  </span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-4 bg-gray-50 dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            {/* Skip Button */}
            <button
              type="button"
              onClick={() => handleClose(true)}
              className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              {t('tour.skipButton')}
            </button>

            {/* Stepper Buttons */}
            <div className="flex items-center space-x-2">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>{t('tour.prevButton')}</span>
                </button>
              )}

              {step < totalSteps ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  <span>{t('tour.nextButton')}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinish}
                  className="inline-flex items-center space-x-1.5 px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  <span>{t('tour.startButton')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
