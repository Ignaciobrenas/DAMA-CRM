import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useBranding } from '../context/BrandingContext';

export const Login: React.FC = () => {
  const { login, verify2FA } = useAuth();
  const { t } = useLanguage();
  const { branding } = useBranding();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

    const res = await login(email, password);
    setIsLoading(false);

    if (res.require2FA && res.tempToken) {
      setRequire2FA(true);
      setTempToken(res.tempToken);
    } else if (!res.success) {
      setErrorMessage(res.message || 'Error en las credenciales');
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
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-800 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={branding.companyName}
              className="w-16 h-16 rounded-2xl object-contain mx-auto mb-4 p-1 bg-white dark:bg-slate-800 shadow-md border border-gray-100 dark:border-slate-800"
            />
          ) : (
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl text-white mb-4 shadow-md"
              style={{ backgroundColor: branding.primaryColor }}
            >
              <Shield className="w-7 h-7" />
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {branding.companyName}
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Plataforma Modular Self-Hosted para PYMES
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center space-x-2 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {!require2FA ? (
          /* Standard Login Form */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@dama-crm.local"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{ backgroundColor: branding.primaryColor }}
              className="w-full mt-2 flex items-center justify-center space-x-2 py-2.5 px-4 text-white text-xs font-semibold rounded-lg shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <span>{isLoading ? 'Verificando...' : 'Iniciar Sesión'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* 2FA OTP Form */
          <form onSubmit={handle2FASubmit} className="space-y-4">
            <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 mb-4">
              <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
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
                className="w-full text-center tracking-[0.5em] text-2xl font-mono py-2 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || otpCode.length !== 6}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <span>{isLoading ? 'Validando...' : t('verify')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRequire2FA(false);
                setOtpCode('');
              }}
              className="w-full text-center text-xs text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Volver al inicio de sesión
            </button>
          </form>
        )}

        {/* Quick Demo Access Pills */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2.5 text-center">
            Acceso Rápido Demo (1-Click)
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDemoCredentials('ignaciobrenas@gmail.com', '1')}
              className="px-2 py-1.5 text-[11px] font-medium bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/60 rounded-md text-blue-700 dark:text-blue-300 transition-colors text-center border border-blue-200 dark:border-blue-800/60"
            >
              👑 Ignacio (Admin)
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('admin@dama-crm.local', 'Admin1234!')}
              className="px-2 py-1.5 text-[11px] font-medium bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 rounded-md text-gray-700 dark:text-slate-300 transition-colors"
            >
              Admin Demo
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('ventas@dama-crm.local', 'Ventas1234!')}
              className="px-2 py-1.5 text-[11px] font-medium bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 rounded-md text-gray-700 dark:text-slate-300 transition-colors"
            >
              Ventas
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('pm@dama-crm.local', 'Pm1234!')}
              className="px-2 py-1.5 text-[11px] font-medium bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 rounded-md text-gray-700 dark:text-slate-300 transition-colors"
            >
              PM
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
