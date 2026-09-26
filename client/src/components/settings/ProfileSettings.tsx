import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User as UserIcon,
  Save,
  Volume2,
  VolumeX,
  PanelLeft,
  KeyRound,
  Shield,
  Bell,
  Image,
  CheckCircle2,
  Eye,
  EyeOff,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { apiRequest } from '../../services/api';
import { checkPasswordStrength } from '../../utils/validators';

const AVAILABLE_MODULE_ROUTES = [
  { path: '/', label: 'Dashboard General' },
  { path: '/employee-portal', label: 'Portal del Empleado' },
  { path: '/pipeline', label: 'Pipeline de Ventas' },
  { path: '/agile', label: 'Proyectos Ágiles & Planner' },
  { path: '/contacts', label: 'Contactos y Clientes' },
  { path: '/companies', label: 'Empresas & Cuentas' },
  { path: '/invoicing', label: 'Facturación & Cobros' },
  { path: '/inventory', label: 'Inventario UnoPIM' },
  { path: '/tickets', label: 'Mesa de Ayuda (Tickets)' },
  { path: '/expenses', label: 'Gastos & Viáticos' },
  { path: '/workflows', label: 'Automatizaciones' },
  { path: '/omnichannel', label: 'Omnicanal WhatsApp' },
  { path: '/integrations', label: 'Integraciones' },
  { path: '/reports', label: 'Informes & Analítica' },
];

const DASHBOARD_WIDGET_OPTIONS = [
  { id: 'kpis', label: 'Métricas KPI Principales' },
  { id: 'pipeline_chart', label: 'Gráfico de Oportunidades y Ventas' },
  { id: 'recent_activities', label: 'Registro de Actividades Recientes' },
  { id: 'top_deals', label: 'Operaciones Destacadas' },
  { id: 'quick_actions', label: 'Acciones Rápidas del CRM' },
];

export const ProfileSettings: React.FC = () => {
  const { user, updateProfile, updatePreferences } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();

  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Notification & Sounds
  const [soundEnabled, setSoundEnabled] = useState(user?.preferences?.soundEnabled ?? true);
  const [emailNotifications, setEmailNotifications] = useState(user?.preferences?.emailNotifications ?? true);

  // Sidebar Preferences
  const [sidebarCollapsed, setSidebarCollapsed] = useState(user?.preferences?.sidebarCollapsed ?? false);
  const [pinnedItems, setPinnedItems] = useState<string[]>(
    user?.preferences?.sidebarPinnedItems || AVAILABLE_MODULE_ROUTES.map((r) => r.path)
  );

  // Dashboard widgets
  const [dashboardWidgets, setDashboardWidgets] = useState<string[]>(
    user?.preferences?.dashboardWidgets || DASHBOARD_WIDGET_OPTIONS.map((w) => w.id)
  );

  const pwdCheck = checkPasswordStrength(newPassword);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      toast.warning('Campo requerido', 'El nombre de usuario no puede estar vacío.');
      return;
    }

    setIsSavingProfile(true);
    const success = await updateProfile({
      name: profileName.trim(),
      avatar: profileAvatar.trim(),
    });
    setIsSavingProfile(false);

    if (success) {
      toast.success('Perfil Actualizado', 'Tu información personal ha sido guardada en la base de datos.');
    } else {
      toast.error('Error al guardar', 'No se ha podido actualizar tu perfil.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword) {
      toast.warning('Datos requeridos', 'Por favor ingresa la contraseña actual y la nueva.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Error de coincidencia', 'La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    if (!pwdCheck.isValid) {
      toast.error('Contraseña débil', 'La nueva contraseña debe cumplir con los criterios de seguridad.');
      return;
    }

    setIsChangingPassword(true);
    const res = await apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setIsChangingPassword(false);

    if (res.success) {
      toast.success('Contraseña Actualizada', 'Tu contraseña de acceso ha sido cambiada correctamente.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error('Error al cambiar contraseña', res.message || 'Verifica tu contraseña actual.');
    }
  };

  const handleToggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    updatePreferences({ soundEnabled: enabled });
    toast.info('Preferencia Guardada', enabled ? 'Sonidos del CRM activados' : 'Sonidos desactivados');
  };

  const handleToggleEmailNotifs = (enabled: boolean) => {
    setEmailNotifications(enabled);
    updatePreferences({ emailNotifications: enabled });
    toast.info('Preferencia Guardada', enabled ? 'Notificaciones por email activadas' : 'Notificaciones por email silenciadas');
  };

  const handleToggleSidebarCollapsed = () => {
    const nextState = !sidebarCollapsed;
    setSidebarCollapsed(nextState);
    updatePreferences({ sidebarCollapsed: nextState });
  };

  const handleTogglePinned = (path: string) => {
    let next: string[];
    if (pinnedItems.includes(path)) {
      if (pinnedItems.length <= 1) {
        toast.warning('Mínimo requerido', 'Debes mantener al menos un módulo anclado.');
        return;
      }
      next = pinnedItems.filter((p) => p !== path);
    } else {
      next = [...pinnedItems, path];
    }
    setPinnedItems(next);
    updatePreferences({ sidebarPinnedItems: next });
  };

  const handleToggleWidget = (widgetId: string) => {
    let next: string[];
    if (dashboardWidgets.includes(widgetId)) {
      if (dashboardWidgets.length <= 1) {
        toast.warning('Mínimo requerido', 'Debes mantener al menos un widget en el Dashboard.');
        return;
      }
      next = dashboardWidgets.filter((w) => w !== widgetId);
    } else {
      next = [...dashboardWidgets, widgetId];
    }
    setDashboardWidgets(next);
    updatePreferences({ dashboardWidgets: next });
  };

  const playChimeSample = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880.0, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch {
      // AudioContext fallback
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  {t('settings.userProfileSection', 'Mi Perfil & Preferencias de Cuenta')}
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Sincronizado en BD
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {t('settings.profileDesc', 'Actualiza tus datos de usuario, contraseña, notificaciones y elementos visibles.')}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: User Profile Info */}
          <div className="bg-gray-50/60 dark:bg-slate-800/40 p-5 rounded-xl border border-gray-100 dark:border-slate-800 flex flex-col justify-between space-y-4">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-slate-700">
                <UserIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xs font-bold text-gray-900 dark:text-white">
                  {t('settings.profileCustomization', 'Datos del Usuario')}
                </h3>
              </div>

              <div className="flex items-center space-x-3">
                <div className="relative shrink-0">
                  {profileAvatar ? (
                    <img
                      src={profileAvatar}
                      alt={profileName || 'Usuario'}
                      className="w-14 h-14 rounded-full object-cover border-2 border-blue-500 shadow-xs bg-white"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-lg flex items-center justify-center border-2 border-blue-500">
                      {(profileName || user?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="text-xs overflow-hidden">
                  <div className="font-bold text-gray-900 dark:text-white truncate">{user?.name}</div>
                  <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate">{user?.email}</div>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                    Rol: {user?.role || 'USUARIO'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Avatar / Foto de Perfil
                </label>
                <input
                  type="text"
                  value={profileAvatar}
                  onChange={(e) => setProfileAvatar(e.target.value)}
                  placeholder="https://ejemplo.com/avatar.png"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 mb-1.5"
                />
                <label className="inline-flex items-center space-x-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                  <Image className="w-3.5 h-3.5" />
                  <span>Subir imagen desde equipo local</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          setProfileAvatar(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingProfile ? 'Guardando...' : 'Guardar Datos de Perfil'}</span>
              </button>
            </form>
          </div>

          {/* Card 2: Password Change */}
          <div className="bg-gray-50/60 dark:bg-slate-800/40 p-5 rounded-xl border border-gray-100 dark:border-slate-800 flex flex-col justify-between space-y-4">
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-slate-700">
                <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-gray-900 dark:text-white">Cambio de Contraseña</h3>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres, mayúscula, número"
                    className="w-full pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {newPassword && (
                <div className="text-[10px] space-y-1 p-2 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
                  {pwdCheck.rules.map((r) => (
                    <div key={r.id} className="flex items-center space-x-1.5">
                      <span className={r.passed ? 'text-emerald-500 font-bold' : 'text-gray-400'}>
                        {r.passed ? '✓' : '○'} {r.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={isChangingPassword || !currentPassword || !newPassword}
                className="w-full inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{isChangingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}</span>
              </button>
            </form>
          </div>

          {/* Card 3: Sounds & Notification Alerts */}
          <div className="bg-gray-50/60 dark:bg-slate-800/40 p-5 rounded-xl border border-gray-100 dark:border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-slate-700">
                <Bell className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-xs font-bold text-gray-900 dark:text-white">
                  {t('settings.soundAndFriendlyNotifs', 'Sonidos & Notificaciones')}
                </h3>
              </div>

              {/* Sound Toggle */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-xs font-bold text-gray-900 dark:text-white">Efectos de Audio</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleSound(!soundEnabled)}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      soundEnabled ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        soundEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-slate-400">
                  Campanadas armónicas para alertas, menciones y mensajes entrantes de WhatsApp.
                </p>
                {soundEnabled && (
                  <button
                    type="button"
                    onClick={playChimeSample}
                    className="mt-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Probar sonido de prueba</span>
                  </button>
                )}
              </div>

              {/* Email Notifications Toggle */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-gray-900 dark:text-white">Alertas por Correo</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleEmailNotifs(!emailNotifications)}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      emailNotifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        emailNotifications ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-slate-400">
                  Envío de resúmenes de tareas asignadas y avisos de seguridad.
                </p>
              </div>
            </div>

            <div className="text-[10px] text-gray-400 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-gray-100 dark:border-slate-800">
              💡 Todas tus preferencias de usuario se aplican al instante y quedan guardadas en tu cuenta.
            </div>
          </div>
        </div>

        {/* Lower Row: Sidebar Customization & Dashboard Widgets */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100 dark:border-slate-800">
          {/* Sidebar Items */}
          <div className="p-5 bg-gray-50/60 dark:bg-slate-800/40 rounded-xl border border-gray-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <PanelLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xs font-bold text-gray-900 dark:text-white">
                  {t('settings.customizeSidebar', 'Personalización de Barra Lateral')}
                </h3>
              </div>

              <button
                type="button"
                onClick={handleToggleSidebarCollapsed}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {sidebarCollapsed ? 'Modo Expandido' : 'Modo Minimizado'}
              </button>
            </div>

            <p className="text-[11px] text-gray-500 dark:text-slate-400">
              Selecciona qué accesos directos deseas mantener visibles en el menú lateral:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {AVAILABLE_MODULE_ROUTES.map((item) => {
                const isPinned = pinnedItems.includes(item.path);
                return (
                  <label
                    key={item.path}
                    className={`flex items-center space-x-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                      isPinned
                        ? 'border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 font-semibold'
                        : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={() => handleTogglePinned(item.path)}
                      className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="truncate">{item.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Dashboard Widgets */}
          <div className="p-5 bg-gray-50/60 dark:bg-slate-800/40 rounded-xl border border-gray-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center space-x-2">
              <LayoutDashboard className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-xs font-bold text-gray-900 dark:text-white">
                Widgets del Dashboard Principal
              </h3>
            </div>

            <p className="text-[11px] text-gray-500 dark:text-slate-400">
              Elige los bloques informativos visibles al iniciar sesión en el CRM:
            </p>

            <div className="space-y-2">
              {DASHBOARD_WIDGET_OPTIONS.map((widget) => {
                const isChecked = dashboardWidgets.includes(widget.id);
                return (
                  <label
                    key={widget.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                      isChecked
                        ? 'border-amber-500/40 bg-amber-50/40 dark:bg-amber-950/20 text-amber-950 dark:text-amber-300 font-semibold'
                        : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400'
                    }`}
                  >
                    <span>{widget.label}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleWidget(widget.id)}
                      className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
