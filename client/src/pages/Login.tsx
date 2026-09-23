import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Globe,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useBranding } from '../context/BrandingContext';
import { useTheme } from '../context/ThemeContext';
import { SUPPORTED_LANGUAGES, Language } from '../i18n';

export const Login: React.FC = () => {
  const { login, verify2FA } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { branding } = useBranding();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [logoLoadError, setLogoLoadError] = useState(false);

  // 2FA state
  const [require2FA, setRequire2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Por favor, introduce tu correo electrónico y contraseña.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(email, password);
      setIsLoading(false);

      if (res.require2FA && res.tempToken) {
        setRequire2FA(true);
        setTempToken(res.tempToken);
      } else if (!res.success) {
        setErrorMessage(res.message || 'Credenciales no válidas. Revisa el correo o la contraseña.');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Error de comunicación con el servidor. Revisa tu conexión.');
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await verify2FA(tempToken, otpCode);
      setIsLoading(false);

      if (!res.success) {
        setErrorMessage(res.message || 'Código de 6 dígitos inválido o expirado.');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Error al verificar el código de seguridad.');
    }
  };

  const setDemoCredentials = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setErrorMessage('');
  };

  // Determine whether to show custom edited logo
  const hasCustomLogo = Boolean(branding.logoUrl && !logoLoadError);

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Decorative Background Lighting Gradients */}
      <div
        className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: branding.primaryColor }}
      />
      <div
        className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ backgroundColor: branding.primaryColor }}
      />

      {/* Top Bar with Language and Theme Toggles */}
      <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
        {/* Language selector */}
        <div className="relative group">
          <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-gray-200 dark:border-slate-800 text-xs font-semibold text-gray-700 dark:text-slate-200 shadow-xs cursor-pointer">
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent border-none text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="dark:bg-slate-900 text-gray-900 dark:text-white">
                  {l.nativeName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 shadow-xs hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10 bg-white dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 p-8 sm:p-9"
      >
        {/* Company Header & Brand Identity */}
        <div className="text-center mb-7">
          <div className="inline-flex flex-col items-center justify-center mb-4">
            {hasCustomLogo ? (
              <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-800/90 shadow-md border border-gray-100 dark:border-slate-700/80 flex items-center justify-center max-w-[220px] max-h-20 transition-all hover:scale-105 duration-200">
                <img
                  src={branding.logoUrl}
                  alt={branding.companyName}
                  onError={() => setLogoLoadError(true)}
                  className="max-h-16 max-w-full object-contain rounded-xl"
                />
              </div>
            ) : (
              <div
                className="w-16 h-16 rounded-2xl text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                style={{
                  backgroundColor: branding.primaryColor,
                  boxShadow: `0 10px 25px -5px ${branding.primaryColor}55`,
                }}
              >
                <Shield className="w-8 h-8" />
              </div>
            )}
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            {branding.companyName || 'DAMA-CRM'}
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 font-medium">
            Acceso seguro a la plataforma CRM & ERP modular
          </p>
        </div>

        {/* Error Feedback Banner */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -6 }}
              className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start space-x-2.5 text-xs text-red-600 dark:text-red-400"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span className="font-medium">{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {!require2FA ? (
          /* Standard Login Form */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@dama-crm.local"
                  className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                backgroundColor: branding.primaryColor,
                boxShadow: `0 4px 14px 0 ${branding.primaryColor}40`,
              }}
              className="w-full mt-2 flex items-center justify-center space-x-2 py-2.5 px-4 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              <span>{isLoading ? 'Verificando credenciales...' : 'Iniciar Sesión'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* 2FA OTP Form */
          <form onSubmit={handle2FASubmit} className="space-y-4">
            <div className="text-center p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 mb-4">
              <CheckCircle2 className="w-7 h-7 text-blue-600 dark:text-blue-400 mx-auto mb-1.5" />
              <div className="text-xs font-bold text-gray-900 dark:text-white">{t('twoFactorTitle')}</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                {t('twoFactorSubtitle')}
              </div>
            </div>

            <div>
              <label className="block text-center text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">
                Código OTP de 6 Dígitos
              </label>
              <input
                type="text"
                maxLength={6}
                required
                autoFocus
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full text-center tracking-[0.5em] text-2xl font-mono py-2.5 bg-gray-50 dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || otpCode.length !== 6}
              style={{ backgroundColor: branding.primaryColor }}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-opacity hover:opacity-95 disabled:opacity-50"
            >
              <span>{isLoading ? 'Validando...' : t('verify')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRequire2FA(false);
                setOtpCode('');
              }}
              className="w-full text-center text-xs text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 py-1 transition-colors"
            >
              Volver al inicio de sesión
            </button>
          </form>
        )}

        {/* 1-Click Demo Access Credentials */}
        <div className="mt-7 pt-5 border-t border-gray-100 dark:border-slate-800">
          <div className="flex items-center justify-center space-x-1.5 text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Acceso Demo Rápido (1-Click)</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDemoCredentials('ignaciobrenas@gmail.com', '1')}
              className="px-2.5 py-1.5 text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 hover:text-blue-800 dark:hover:bg-blue-900/60 rounded-xl text-blue-700 dark:text-blue-300 transition-colors text-center border border-blue-200/80 dark:border-blue-800/60"
            >
              👑 Ignacio (Admin)
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('admin@dama-crm.local', 'Admin1234!')}
              className="px-2.5 py-1.5 text-[11px] font-medium bg-gray-50 dark:bg-slate-800/80 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700/80 rounded-xl text-gray-700 dark:text-slate-300 transition-colors border border-gray-200/60 dark:border-slate-700/60"
            >
              🛡️ Admin Demo
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('ventas@dama-crm.local', 'Ventas1234!')}
              className="px-2.5 py-1.5 text-[11px] font-medium bg-gray-50 dark:bg-slate-800/80 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700/80 rounded-xl text-gray-700 dark:text-slate-300 transition-colors border border-gray-200/60 dark:border-slate-700/60"
            >
              💼 Ventas
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('pm@dama-crm.local', 'Pm1234!')}
              className="px-2.5 py-1.5 text-[11px] font-medium bg-gray-50 dark:bg-slate-800/80 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700/80 rounded-xl text-gray-700 dark:text-slate-300 transition-colors border border-gray-200/60 dark:border-slate-700/60"
            >
              📋 Project Manager
            </button>
          </div>
        </div>

        {/* Security watermark footer */}
        <div className="mt-5 text-center">
          <p className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">
            DAMA-CRM • Autenticación Cifrada JWT & 2FA TOTP
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
