import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Building2,
  Users,
  Plug,
  Rocket,
  Check,
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  Palette,
  Coins,
  Plus,
  Trash2,
  Mail,
  ShoppingBag,
  Zap,
  Globe,
  Database,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { useLanguage } from '../context/LanguageContext';
import { soundService } from '../services/sound';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { user, updatePreferences } = useAuth();
  const { branding, updateBranding, getLogo, isDarkMode } = useBranding();
  const { t } = useLanguage();

  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Step 1: Branding & Org
  const [companyName, setCompanyName] = useState(branding.companyName || 'Mi Empresa');
  const [currency, setCurrency] = useState('EUR');
  const [selectedColor, setSelectedColor] = useState(branding.primaryColor || '#072053');
  const [previewThemeDark, setPreviewThemeDark] = useState(isDarkMode);

  // Step 2: Role & Team
  const [userRole, setUserRole] = useState('Dirección General / CEO');
  const [inviteEmail, setInviteEmail] = useState('');
  const [teamInvites, setTeamInvites] = useState<string[]>([]);

  // Step 3: Ecosystem & Connectors
  const [enabledConnectors, setEnabledConnectors] = useState<Record<string, boolean>>({
    odoo: false,
    woocommerce: true,
    shopify: false,
    n8n: true,
    unopim: true,
    whatsapp: true,
  });

  // Step 4: Demo Data & Launch
  const [loadDemoData, setLoadDemoData] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);

  const colorPresets = [
    { name: 'DAMA Corporativo', hex: '#072053' },
    { name: 'Azul Real', hex: '#2563EB' },
    { name: 'Índigo Ejecutivo', hex: '#4F46E5' },
    { name: 'Esmeralda', hex: '#059669' },
    { name: 'Púrpura Imperial', hex: '#7C3AED' },
    { name: 'Carbón Elegante', hex: '#1E293B' },
  ];

  const handleAddInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteEmail && inviteEmail.includes('@') && !teamInvites.includes(inviteEmail)) {
      setTeamInvites([...teamInvites, inviteEmail.trim()]);
      setInviteEmail('');
      soundService.play('action');
    }
  };

  const handleRemoveInvite = (email: string) => {
    setTeamInvites(teamInvites.filter((item) => item !== email));
  };

  const toggleConnector = (key: string) => {
    setEnabledConnectors((prev) => ({ ...prev, [key]: !prev[key] }));
    soundService.play('action');
  };

  const triggerConfettiCelebration = () => {
    const end = Date.now() + 2.5 * 1000;
    const colors = ['#072053', '#2563EB', '#60A5FA', '#F59E0B', '#10B981'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  const handleFinish = async () => {
    setIsFinishing(true);
    soundService.play('success');
    triggerConfettiCelebration();

    try {
      // 1. Update branding
      await updateBranding({
        companyName: companyName.trim() || 'DAMA-CRM',
        primaryColor: selectedColor,
      });

      // 2. Mark onboarding as completed in user preferences
      await updatePreferences({
        onboardingCompleted: true,
      });

      setTimeout(() => {
        onComplete();
      }, 1800);
    } catch {
      onComplete();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={getLogo('symbol')}
            alt="DAMA Logo"
            className="h-8 w-auto object-contain"
          />
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {t('onboarding.setupWizard', 'Asistente de Bienvenida & Configuración')}
          </span>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step
                  ? 'w-8 bg-brand-color'
                  : s < step
                  ? 'w-2 bg-emerald-500'
                  : 'w-2 bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
          <span className="text-xs text-slate-500 font-medium ml-2">
            Paso {step} de {totalSteps}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 sm:p-10 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {/* STEP 1: ORGANIZACIÓN & MARCA */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-color/10 text-brand-color text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t('onboarding.step1Tag', 'Bienvenido a DAMA-CRM')}</span>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight">
                  {t('onboarding.step1Title', 'Personaliza la identidad de tu organización')}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {t('onboarding.step1Subtitle', 'Configura los datos base de tu empresa y observa en tiempo real cómo luce tu marca adaptable.')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Inputs */}
                <div className="space-y-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t('onboarding.companyName', 'Nombre de la Empresa u Organización')}
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Acme Global Inc."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-brand-color outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t('onboarding.currency', 'Moneda Principal del Negocio')}
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-brand-color outline-none"
                    >
                      <option value="EUR">EUR (€) - Euro Comercial</option>
                      <option value="USD">USD ($) - Dólar Estadounidense</option>
                      <option value="GBP">GBP (£) - Libra Esterlina</option>
                      <option value="MXN">MXN ($) - Peso Mexicano</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      {t('onboarding.primaryColor', 'Color Primario del Sistema')}
                    </label>
                    <div className="flex items-center gap-3">
                      {colorPresets.map((preset) => (
                        <button
                          key={preset.hex}
                          type="button"
                          onClick={() => {
                            setSelectedColor(preset.hex);
                            soundService.play('action');
                          }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${
                            selectedColor === preset.hex ? 'scale-110 ring-2 ring-offset-2 ring-slate-900 dark:ring-white' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: preset.hex }}
                          title={preset.name}
                        >
                          {selectedColor === preset.hex && <Check className="w-4 h-4 text-white stroke-[3]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Brand Theme Preview */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {t('onboarding.liveLogoPreview', 'Previsualización Adaptativa de Marca')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewThemeDark(!previewThemeDark)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:opacity-80 transition-opacity"
                    >
                      {previewThemeDark ? <Moon className="w-3.5 h-3.5 text-blue-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                      <span>{previewThemeDark ? 'Modo Oscuro' : 'Modo Claro'}</span>
                    </button>
                  </div>

                  <div
                    className={`rounded-2xl p-6 border transition-all duration-300 flex flex-col items-center justify-center min-h-[220px] text-center ${
                      previewThemeDark
                        ? 'bg-slate-900 border-slate-800 text-white shadow-xl'
                        : 'bg-white border-slate-200 text-slate-900 shadow-md'
                    }`}
                  >
                    <div className="mb-4 p-4 rounded-xl transition-all">
                      {/* Logo placeholder dynamically adapting to Dark and Light modes */}
                      <img
                        src={getLogo('full', previewThemeDark)}
                        alt="Brand Preview"
                        className="h-14 w-auto object-contain max-w-[200px]"
                      />
                    </div>
                    <h3 className="font-bold text-lg mb-1">{companyName || 'DAMA-CRM'}</h3>
                    <p className={`text-xs ${previewThemeDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {t('onboarding.adaptiveExplanation', 'El imagotipo DAMA se adapta automáticamente con contraste perfecto en fondos claros y oscuros.')}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: ROL & EQUIPO */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-color/10 text-brand-color text-xs font-semibold">
                  <Users className="w-3.5 h-3.5" />
                  <span>{t('onboarding.step2Tag', 'Colaboración & Permisos')}</span>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight">
                  {t('onboarding.step2Title', 'Tu rol y miembros de tu equipo')}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {t('onboarding.step2Subtitle', 'Invita a tus compañeros para colaborar en ventas, inventario, facturación y sprints.')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* User Role */}
                <div className="space-y-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('onboarding.selectYourRole', '¿Cuál es tu rol principal en la empresa?')}
                  </label>
                  <div className="space-y-2">
                    {[
                      'Dirección General / CEO',
                      'Responsable de Ventas & Pipeline',
                      'Operaciones & Logística / UnoPIM',
                      'Finanzas & Facturación',
                      'Ingeniería / Automatizaciones n8n',
                    ].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          setUserRole(role);
                          soundService.play('action');
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-between ${
                          userRole === role
                            ? 'bg-brand-color/10 border-brand-color text-brand-color'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>{role}</span>
                        {userRole === role && <Check className="w-4 h-4 text-brand-color" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Team Invites */}
                <div className="space-y-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                  <div className="space-y-4">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t('onboarding.inviteCoworkers', 'Invitar miembros a tu espacio')}
                    </label>
                    <form onSubmit={handleAddInvite} className="flex gap-2">
                      <div className="relative flex-1">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="companero@empresa.com"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-brand-color outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2.5 bg-brand-color text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Añadir</span>
                      </button>
                    </form>

                    {/* Invites list */}
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {teamInvites.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-4 text-center">
                          {t('onboarding.noInvitesYet', 'Aún no has añadido invitaciones (opcional).')}
                        </p>
                      ) : (
                        teamInvites.map((email) => (
                          <div
                            key={email}
                            className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs"
                          >
                            <span className="font-mono text-slate-700 dark:text-slate-300">{email}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveInvite(email)}
                              className="text-slate-400 hover:text-rose-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    {t('onboarding.inviteNote', 'Podrás gestionar roles finos y niveles de acceso RBAC en Configuración más adelante.')}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: ECOSISTEMA & CONECTORES */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-color/10 text-brand-color text-xs font-semibold">
                  <Plug className="w-3.5 h-3.5" />
                  <span>{t('onboarding.step3Tag', 'Ecosistema de Software')}</span>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight">
                  {t('onboarding.step3Title', 'Conecta tus herramientas de trabajo')}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {t('onboarding.step3Subtitle', 'Elige qué servicios sincronizarán datos con DAMA-CRM. Podrás configurarlos en detalle en cualquier momento.')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    id: 'odoo',
                    name: 'Odoo ERP',
                    desc: 'Sincroniza contactos, facturas y contabilidad.',
                    icon: Building2,
                  },
                  {
                    id: 'woocommerce',
                    name: 'WooCommerce',
                    desc: 'Importa clientes y pedidos online automáticamente.',
                    icon: ShoppingBag,
                  },
                  {
                    id: 'shopify',
                    name: 'Shopify',
                    desc: 'Webhooks criptográficos para tiendas de alto volumen.',
                    icon: Globe,
                  },
                  {
                    id: 'n8n',
                    name: 'n8n Workflows',
                    desc: 'Dispara y recibe flujos de automatización ilimitados.',
                    icon: Zap,
                  },
                  {
                    id: 'unopim',
                    name: 'UnoPIM PIM/Catálogo',
                    desc: 'Centraliza SKUs, stock y catálogo multicanal.',
                    icon: Database,
                  },
                  {
                    id: 'whatsapp',
                    name: 'WhatsApp Cloud',
                    desc: 'Bandeja omnicanal para atención y soporte 24/7.',
                    icon: ShieldCheck,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = enabledConnectors[item.id];

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleConnector(item.id)}
                      className={`cursor-pointer p-5 rounded-2xl border transition-all flex flex-col justify-between select-none ${
                        active
                          ? 'bg-brand-color/5 border-brand-color shadow-sm ring-1 ring-brand-color/30'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            active ? 'bg-brand-color text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                            active ? 'bg-brand-color border-brand-color text-white' : 'border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {active && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">{item.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 4: LANZAMIENTO */}
          {step === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 text-center max-w-xl mx-auto"
            >
              <div className="w-20 h-20 mx-auto rounded-3xl bg-brand-color/10 text-brand-color flex items-center justify-center">
                <Rocket className="w-10 h-10 animate-bounce" />
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight">
                  {t('onboarding.step4Title', '¡Todo listo para despegar!')}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {t(
                    'onboarding.step4Subtitle',
                    'Tu espacio de trabajo está configurado con seguridad militar, sincronización modular y tema adaptativo.'
                  )}
                </p>
              </div>

              {/* Demo Data Option */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-left space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {t('onboarding.loadDemoDataTitle', 'Cargar datos de demostración interactivos')}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {t('onboarding.loadDemoDataDesc', 'Incluye tratos en el pipeline, contactos de ejemplo y métricas de prueba.')}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={loadDemoData}
                      onChange={(e) => setLoadDemoData(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-color"></div>
                  </label>
                </div>
              </div>

              {/* Big Launch Button */}
              <button
                type="button"
                onClick={handleFinish}
                disabled={isFinishing}
                className="w-full py-4 px-6 bg-brand-color text-white font-bold rounded-2xl shadow-xl hover:opacity-95 transition-all flex items-center justify-center gap-3 text-base active:scale-98"
              >
                <span>{isFinishing ? 'Iniciando sesión...' : t('onboarding.enterWorkspace', 'Entrar a DAMA-CRM')}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Navigation */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (step > 1) {
              setStep(step - 1);
              soundService.play('action');
            }
          }}
          disabled={step === 1 || isFinishing}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            step === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{t('common.back', 'Atrás')}</span>
        </button>

        {step < totalSteps && (
          <button
            type="button"
            onClick={() => {
              setStep(step + 1);
              soundService.play('action');
            }}
            className="px-6 py-2.5 bg-brand-color text-white rounded-xl text-xs font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity active:scale-95 shadow-sm"
          >
            <span>{t('common.continue', 'Continuar')}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </footer>
    </div>
  );
};
