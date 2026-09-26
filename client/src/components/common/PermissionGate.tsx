import React from 'react';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface PermissionGateProps {
  resource: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  resource,
  action,
  children,
  fallback,
}) => {
  const { hasPermission } = useAuth();

  if (hasPermission(resource, action)) {
    return <>{children}</>;
  }

  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  return null;
};

export const AccessDenied: React.FC<{
  resource: string;
  action?: string;
  onGoBack?: () => void;
}> = ({ resource, action = 'read', onGoBack }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
      <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center mb-4 shadow-sm">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-100/70 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-semibold mb-3">
        <Lock className="w-3 h-3" />
        <span>{t('accessDenied')}</span>
      </div>

      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {t('insufficientPermissions')}
      </h2>

      <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
        {t('insufficientPermissionsDescPrefix')}<strong className="text-gray-700 dark:text-slate-200">{user?.role || t('guest')}</strong>{t('insufficientPermissionsDescSuffix')} <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-800 rounded font-mono text-[11px] text-red-600 dark:text-red-400">{resource}:{action}</code>
      </p>

      <button
        onClick={onGoBack || (() => window.history.back())}
        className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 text-xs font-semibold shadow-xs transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{t('returnToDashboard')}</span>
      </button>
    </div>
  );
};
