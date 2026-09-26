import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Globe,
  User,
  Building2,
  KeyRound,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useBranding } from '../context/BrandingContext';
import { SUPPORTED_LANGUAGES, Language } from '../i18n';
import { LoadingSpinner } from '../components/common/Loading';
import { apiRequest } from '../services/api';

interface LoginProps {
  onNavigatePrivacy?: () => void;
  onNavigatePortal?: () => void;
}

type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-password' | '2fa';

export const Login: React.FC<LoginProps> = ({ onNavigatePrivacy, onNavigatePortal }) => {
  const { login, register, verify2FA } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { branding, getLogo } = useBranding();

  // Mode state
  const [mode, setMode] = useState<AuthMode>('login');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Reset password states
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // 2FA state
  const [tempToken, setTempToken] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Status & Feedback states
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Clear messages when mode changes
  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Password strength calculation
  const calculatePasswordStrength = (pass: string): { score: number; label: string; color: string } => {
    if (!pass) return { score: 0, label: '', color: 'bg-gray-200 dark:bg-slate-700' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, label: t('passwordStrengthWeak'), color: 'bg-red-500' };
    if (score <= 3) return { score: 2, label: t('passwordStrengthMedium'), color: 'bg-amber-500' };
    return { score: 3, label: t('passwordStrengthStrong'), color: 'bg-emerald-500' };
  };

  const strength = calculatePasswordStrength(mode === 'reset-password' ? newPassword : password);

  // Handlers
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    const res = await login(email, password);
    setIsLoading(false);

    if (res.require2FA && res.tempToken) {
      setTempToken(res.tempToken);
      setMode('2fa');
    } else if (!res.success) {
      setErrorMessage(res.message || 'Error en las credenciales');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (password !== confirmPassword) {
      setErrorMessage(t('passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      setErrorMessage(t('passwordTooShort'));
      return;
    }

    setIsLoading(true);
    const res = await register(name, email, password, companyName);
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.message || 'Error al crear la cuenta');
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    const res = await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    setIsLoading(false);

    if (res.success) {
      setSuccessMessage(res.message || 'Código de recuperación enviado');
      setTimeout(() => {
        setMode('reset-password');
      }, 1500);
    } else {
      setErrorMessage(res.message || 'Error al procesar la solicitud');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (newPassword !== confirmPassword) {
      setErrorMessage(t('passwordMismatch'));
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage(t('passwordTooShort'));
      return;
    }

    setIsLoading(true);
    const res = await apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email,
        code: resetCode,
        newPassword,
      }),
    });
    setIsLoading(false);

    if (res.success) {
      setSuccessMessage(t('passwordResetSuccess'));
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        switchMode('login');
      }, 2000);
    } else {
      setErrorMessage(res.message || 'Código de recuperación inválido o caducado');
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const res = await verify2FA(tempToken, otpCode);
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.message || 'Código de 6 dígitos inválido');
    }
  };

  const setDemoCredentials = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    switchMode('login');
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Background Animated Glow Meshes */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/15 via-indigo-500/10 to-teal-400/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-gradient-to-br from-purple-600/10 via-pink-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Auth Card Container */}
      <div className="w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/80 dark:border-slate-800 p-6 sm:p-8 relative z-10 transition-all duration-300">
        
        {/* Top Controls: Language & Dark/Light Mode */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-slate-800/80">
          <div className="flex items-center space-x-1.5 text-xs text-gray-500 dark:text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold">{branding.companyName}</span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Language Selector */}
            <div className="relative flex items-center">
              <Globe className="w-3.5 h-3.5 text-gray-400 absolute left-2 pointer-events-none" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                aria-label={t('languageSelect')}
                className="pl-7 pr-2 py-1 text-[11px] font-medium bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="dark:bg-slate-900">
                    {l.nativeName}
                  </option>
                ))}
              </select>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label={t('themeToggle')}
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
              className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-slate-700" />
              )}
            </button>
          </div>
        </div>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="relative inline-block mx-auto mb-3">
            <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-md" />
            <img
              src={getLogo('vertical')}
              alt={branding.companyName}
              className="relative w-20 h-20 rounded-2xl object-contain mx-auto p-1.5 bg-white/90 dark:bg-slate-800/90 shadow-md border border-gray-100 dark:border-slate-800"
            />
          </div>

          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            {mode === 'login' && t('login')}
            {mode === 'register' && t('register')}
            {mode === 'forgot-password' && t('forgotPassword')}
            {mode === 'reset-password' && t('resetPassword')}
            {mode === '2fa' && t('twoFactorAuth')}
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {t('platformSubtitle')}
          </p>
        </div>

        {/* Mode Switcher Tabs for Login / Register */}
        {(mode === 'login' || mode === 'register') && (
          <div className="grid grid-cols-2 p-1 mb-5 bg-gray-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`py-1.5 rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-900'
              }`}
            >
              {t('login')}
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`py-1.5 rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-900'
              }`}
            >
              {t('register')}
            </button>
          </div>
        )}

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center space-x-2 text-xs text-red-600 dark:text-red-400 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center space-x-2 text-xs text-emerald-700 dark:text-emerald-300 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form 1: Login */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {t('email')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="admin@dama-crm.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                  {t('password')}
                </label>
                <button
                  type="button"
                  onClick={() => switchMode('forgot-password')}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {t('forgotPassword')}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white shadow-md transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 hover:opacity-95"
              style={{ backgroundColor: branding.primaryColor }}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <>
                  <span>{t('login')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Form 2: Register */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {t('fullName')}
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Carlos Mendoza"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {t('email')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="carlos@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {t('companyName')} (Opcional)
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Mi Empresa S.L."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {t('password')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength meter */}
              {password && (
                <div className="mt-1.5 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-500 dark:text-slate-400">Fortaleza:</span>
                    <span className="font-semibold text-gray-700 dark:text-slate-300">{strength.label}</span>
                  </div>
                  <div className="h-1 w-full bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden flex space-x-1">
                    <div className={`h-full flex-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-transparent'}`} />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {t('confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white shadow-md transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 hover:opacity-95"
              style={{ backgroundColor: branding.primaryColor }}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  <span>Creando tu cuenta...</span>
                </>
              ) : (
                <>
                  <span>{t('register')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Form 3: Forgot Password */}
        {mode === 'forgot-password' && (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-700 dark:text-blue-300">
              <p className="font-semibold">{t('forgotPassword')}</p>
              <p className="text-[11px] mt-0.5">
                Introduce el correo asociado a tu cuenta para enviarte un código de recuperación de 6 dígitos.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {t('email')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="usuario@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white shadow-md transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 hover:opacity-95"
              style={{ backgroundColor: branding.primaryColor }}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  <span>Enviando código...</span>
                </>
              ) : (
                <>
                  <span>{t('sendResetCode')}</span>
                  <KeyRound className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => switchMode('reset-password')}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Ya tengo un código
              </button>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-gray-500 hover:underline"
              >
                {t('backToLogin')}
              </button>
            </div>
          </form>
        )}

        {/* Form 4: Reset Password */}
        {mode === 'reset-password' && (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {t('email')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="usuario@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {t('resetCode')} (6 dígitos)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono tracking-widest bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {t('newPassword')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength meter */}
              {newPassword && (
                <div className="mt-1.5 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-500 dark:text-slate-400">Fortaleza:</span>
                    <span className="font-semibold text-gray-700 dark:text-slate-300">{strength.label}</span>
                  </div>
                  <div className="h-1 w-full bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden flex space-x-1">
                    <div className={`h-full flex-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-transparent'}`} />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {t('confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white shadow-md transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 hover:opacity-95"
              style={{ backgroundColor: branding.primaryColor }}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  <span>Actualizando contraseña...</span>
                </>
              ) : (
                <>
                  <span>{t('resetPassword')}</span>
                  <RotateCcw className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => switchMode('login')}
              className="w-full text-center text-xs text-gray-500 hover:underline pt-1"
            >
              {t('backToLogin')}
            </button>
          </form>
        )}

        {/* Form 5: 2FA OTP */}
        {mode === '2fa' && (
          <form onSubmit={handle2FASubmit} className="space-y-4 animate-in fade-in duration-200">
            <div className="text-center p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-700 dark:text-blue-300">
              <p className="font-semibold">{t('twoFactorAuth')}</p>
              <p className="text-[11px] mt-0.5">
                {t('twoFactorPrompt')}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1 text-center">
                Código de 6 dígitos
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full text-center tracking-widest text-lg font-mono py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white shadow-md transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 hover:opacity-95"
              style={{ backgroundColor: branding.primaryColor }}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  <span>Validando 2FA...</span>
                </>
              ) : (
                <>
                  <span>{t('verifyCode')}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => switchMode('login')}
              className="w-full text-center text-xs text-gray-500 hover:underline pt-2"
            >
              {t('backToLogin')}
            </button>
          </form>
        )}

        {/* Quick Demo Access Pills */}
        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-slate-800">
          <div className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2 text-center">
            {t('quickDemoAccess')}
          </div>
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setDemoCredentials('ignaciobrenas@gmail.com', '1')}
              className="px-2 py-1.5 text-[11px] font-medium bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-800/60 rounded-xl text-blue-700 dark:text-blue-300 transition-colors text-center truncate font-semibold"
            >
              Ignacio
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('admin@dama-crm.local', 'Admin1234!')}
              className="px-2 py-1.5 text-[11px] font-medium bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 rounded-xl text-gray-700 dark:text-slate-300 transition-colors text-center truncate"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('ventas@dama-crm.local', 'Ventas1234!')}
              className="px-2 py-1.5 text-[11px] font-medium bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 rounded-xl text-gray-700 dark:text-slate-300 transition-colors text-center truncate"
            >
              Ventas
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('pm@dama-crm.local', 'Pm1234!')}
              className="px-2 py-1.5 text-[11px] font-medium bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 rounded-xl text-gray-700 dark:text-slate-300 transition-colors text-center truncate"
            >
              PM
            </button>
          </div>
        </div>
      </div>

      {/* External Footer Links */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500 dark:text-slate-400 z-10">
        {onNavigatePortal && (
          <button
            onClick={onNavigatePortal}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center space-x-1"
          >
            <span>{t('clientPortalLink')}</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
        {onNavigatePrivacy && (
          <button
            onClick={onNavigatePrivacy}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors underline"
          >
            {t('privacyPolicy')}
          </button>
        )}
      </div>
    </div>
  );
};
