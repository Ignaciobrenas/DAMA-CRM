import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useBranding } from '../context/BrandingContext';
import { LoadingSpinner } from '../components/common/Loading';

interface LoginProps {
  onNavigatePrivacy?: () => void;
  onNavigatePortal?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigatePrivacy, onNavigatePortal }) => {
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
    setIsLoading(true);

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-200 dark:border-slate-800 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          {branding.logoUrl ? (
            <div className="relative inline-block mx-auto mb-4">
              <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-md" />
              <img
                src={branding.logoUrl}
                alt={branding.companyName}
                className="relative w-16 h-16 rounded-2xl object-contain mx-auto p-1.5 bg-white dark:bg-slate-800 shadow-md border border-gray-100 dark:border-slate-800"
              />
            </div>
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
          <div className="mb-6 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center space-x-2 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {!require2FA ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {t('email')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
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
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {t('password')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
        ) : (
          <form onSubmit={handle2FASubmit} className="space-y-4">
            <div className="text-center p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-700 dark:text-blue-300">
              <p className="font-semibold">Autenticación en Dos Pasos (2FA)</p>
              <p className="text-[11px] mt-0.5">
                Introduce el código temporal generado por tu aplicación autenticadora.
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
                  <span>Verificar Código</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setRequire2FA(false)}
              className="w-full text-center text-xs text-gray-500 hover:underline pt-2"
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
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDemoCredentials('admin@dama-crm.local', 'Admin1234!')}
              className="px-2 py-1.5 text-[11px] font-medium bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 rounded-xl text-gray-700 dark:text-slate-300 transition-colors"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('ventas@dama-crm.local', 'Ventas1234!')}
              className="px-2 py-1.5 text-[11px] font-medium bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 rounded-xl text-gray-700 dark:text-slate-300 transition-colors"
            >
              Ventas
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('pm@dama-crm.local', 'Pm1234!')}
              className="px-2 py-1.5 text-[11px] font-medium bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 rounded-xl text-gray-700 dark:text-slate-300 transition-colors"
            >
              PM
            </button>
          </div>
        </div>
      </div>

      {/* External Links */}
      <div className="mt-6 flex items-center space-x-6 text-xs text-gray-500 dark:text-slate-400">
        {onNavigatePortal && (
          <button
            onClick={onNavigatePortal}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center space-x-1"
          >
            <span>Portal de Clientes B2B</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
        {onNavigatePrivacy && (
          <button
            onClick={onNavigatePrivacy}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors underline"
          >
            Política de Privacidad & RGPD
          </button>
        )}
      </div>
    </div>
  );
};
