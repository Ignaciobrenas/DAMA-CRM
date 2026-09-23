import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  Users,
  Lock,
  Key,
  Check,
  Save,
  Paintbrush,
  Image,
  RotateCcw,
  Sparkles,
  UserPlus,
  X,
  AlertCircle,
  History,
  Activity,
  FileText,
  Volume2,
  VolumeX,
  Sliders,
  PanelLeft,
  User as UserIcon,
  Layers,
  Bell,
} from 'lucide-react';
import { soundService } from '../services/sound';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useBranding } from '../context/BrandingContext';
import { useToast } from '../context/ToastContext';
import { checkPasswordStrength, isValidEmail } from '../utils/validators';

const ALL_SIDEBAR_ITEMS = [
  { route: '/', label: 'Panel de Control (Dashboard)' },
  { route: '/pipeline', label: 'Embudo de Ventas (Pipeline)' },
  { route: '/agile', label: 'Planificador Ágil (Sprints/Tareas)' },
  { route: '/contacts', label: 'Contactos y Clientes' },
  { route: '/companies', label: 'Empresas y Cuentas' },
  { route: '/invoicing', label: 'Facturación y Presupuestos' },
  { route: '/inventory', label: 'Catálogo de Inventario UnoPIM' },
  { route: '/workflows', label: 'Automatizaciones & Triggers' },
  { route: '/omnichannel', label: 'Centro Omnicanal y Chat' },
  { route: '/reports', label: 'Informes BI y Analítica' },
  { route: '/portal', label: 'Portal del Cliente' },
];

export const Settings: React.FC = () => {
  const { t } = useLanguage();
  const { user, updatePreferences, updateProfile } = useAuth();
  const toast = useToast();
  const { branding, updateBranding, resetBranding } = useBranding();
  const [brandForm, setBrandForm] = useState(branding);
  const [brandSaved, setBrandSaved] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(user?.twoFactorEnabled || false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [rolePermissions, setRolePermissions] = useState<Array<{ resource: string; action: string }>>([]);

  // User Profile state
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // User Preferences state
  const [soundEnabled, setSoundEnabled] = useState(user?.preferences?.soundEnabled ?? true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(user?.preferences?.sidebarCollapsed ?? false);
  const [sidebarPinnedItems, setSidebarPinnedItems] = useState<string[]>(
    user?.preferences?.sidebarPinnedItems || ALL_SIDEBAR_ITEMS.map((i) => i.route)
  );

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileAvatar(user.avatar || '');
      setSoundEnabled(user.preferences?.soundEnabled ?? true);
      setSidebarCollapsed(user.preferences?.sidebarCollapsed ?? false);
      if (user.preferences?.sidebarPinnedItems) {
        setSidebarPinnedItems(user.preferences.sidebarPinnedItems);
      }
    }
  }, [user]);

  // User creation modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '', roleId: '' });
  const [userModalError, setUserModalError] = useState('');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  const resources = [
    { id: 'companies', label: 'Empresas' },
    { id: 'contacts', label: 'Contactos' },
    { id: 'deals', label: 'Ventas (Deals)' },
    { id: 'projects', label: 'Proyectos Ágiles' },
    { id: 'tasks', label: 'Tareas' },
    { id: 'invoices', label: 'Facturas' },
    { id: 'quotes', label: 'Presupuestos' },
    { id: 'inventory', label: 'Inventario UnoPIM' },
    { id: 'workflows', label: 'Automatizaciones' },
    { id: 'omnichannel', label: 'Omnicanal WhatsApp' },
    { id: 'users', label: 'Usuarios y Roles' },
  ];

  const actions = [
    { id: 'read', label: 'Lectura' },
    { id: 'create', label: 'Crear' },
    { id: 'update', label: 'Modificar' },
    { id: 'delete', label: 'Eliminar' },
    { id: 'manage', label: 'Total (Admin)' },
  ];

  const loadData = async () => {
    const [resRoles, resUsers, resAudit] = await Promise.all([
      apiRequest('/users/roles'),
      apiRequest('/users'),
      apiRequest('/users/audit-logs'),
    ]);

    if (resRoles.success && resRoles.data) {
      setRoles(resRoles.data);
      if (resRoles.data.length > 0 && !selectedRoleId) {
        setSelectedRoleId(resRoles.data[0].id);
        setRolePermissions(resRoles.data[0].permissions || []);
      }
    }

    if (resUsers.success && resUsers.data) {
      setUsers(resUsers.data);
    }

    if (resAudit.success && resAudit.data) {
      setAuditLogs(resAudit.data);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectRole = (roleId: string) => {
    setSelectedRoleId(roleId);
    const found = roles.find((r) => r.id === roleId);
    if (found) {
      setRolePermissions(found.permissions || []);
    }
  };

  const togglePermission = (resource: string, action: string) => {
    const exists = rolePermissions.some((p) => p.resource === resource && p.action === action);
    if (exists) {
      setRolePermissions(rolePermissions.filter((p) => !(p.resource === resource && p.action === action)));
    } else {
      setRolePermissions([...rolePermissions, { resource, action }]);
    }
  };

  const handleSaveMatrix = async () => {
    if (!selectedRoleId) return;
    setStatusMessage('Guardando matriz de permisos RBAC en PostgreSQL...');

    const res = await apiRequest(`/users/roles/${selectedRoleId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions: rolePermissions }),
    });

    if (res.success) {
      setStatusMessage('✅ Matriz RBAC actualizada con éxito en la base de datos');
      toast.success('Permisos RBAC Guardados', 'La matriz de seguridad se sincronizó correctamente.');
      loadData();
      setTimeout(() => setStatusMessage(''), 3000);
    } else {
      toast.error('Error al guardar matriz', res.message || 'No se pudieron actualizar los permisos');
    }
  };

  const handleToggle2FA = async () => {
    const nextState = !twoFactorEnabled;
    const res = await apiRequest('/auth/toggle-2fa', {
      method: 'POST',
      body: JSON.stringify({ enable: nextState }),
    });

    if (res.success) {
      setTwoFactorEnabled(nextState);
      setStatusMessage(res.message || 'Estado 2FA actualizado');
      if (nextState) {
        toast.success('Seguridad 2FA Activada', 'Tu cuenta ahora requiere verificación en dos pasos.');
      } else {
        toast.info('Seguridad 2FA Desactivada', 'Se ha deshabilitado el doble factor de autenticación.');
      }
      loadData();
      setTimeout(() => setStatusMessage(''), 3000);
    } else {
      toast.error('Error al actualizar 2FA', res.message || 'Operación no permitida');
    }
  };

  const pwdCheck = checkPasswordStrength(newUserForm.password);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserModalError('');

    if (!newUserForm.name || !newUserForm.email || !newUserForm.password || !newUserForm.roleId) {
      setUserModalError('Todos los campos con asterisco (*) son obligatorios.');
      return;
    }

    if (!isValidEmail(newUserForm.email)) {
      setUserModalError('Por favor, introduce una dirección de correo electrónico válida.');
      return;
    }

    if (!pwdCheck.isValid) {
      setUserModalError('La contraseña no cumple con todos los requisitos de seguridad requeridos.');
      return;
    }

    setIsSubmittingUser(true);
    const res = await apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(newUserForm),
    });
    setIsSubmittingUser(false);

    if (res.success) {
      setIsUserModalOpen(false);
      const createdEmail = newUserForm.email;
      setNewUserForm({ name: '', email: '', password: '', roleId: roles[0]?.id || '' });
      setStatusMessage('¡Usuario corporativo creado con éxito!');
      toast.success('Usuario Registrado', `Se ha creado la cuenta corporativa para ${createdEmail}.`);
      await loadData();
      setTimeout(() => setStatusMessage(''), 4000);
    } else {
      setUserModalError(res.message || 'Error al registrar el usuario');
      toast.error('Error al crear usuario', res.message);
    }
  };

  const handleToggleSound = async () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    if (nextVal) {
      soundService.setMuted(false);
      soundService.playMessageChime();
    } else {
      soundService.setMuted(true);
    }
    const ok = await updatePreferences({ soundEnabled: nextVal });
    if (ok) {
      toast.success('Preferencia guardada', nextVal ? 'Efectos de sonido activados' : 'Efectos de sonido silenciados');
    }
  };

  const handleTestSound = () => {
    soundService.setMuted(false);
    soundService.playMessageChime();
    setTimeout(() => {
      soundService.playSuccessChime();
    }, 450);
    toast.info('Reproduciendo sonido amigable', 'Escuchando campana binaural de notificación.');
  };

  const handleToggleSidebarCollapsed = async () => {
    const nextVal = !sidebarCollapsed;
    setSidebarCollapsed(nextVal);
    const ok = await updatePreferences({ sidebarCollapsed: nextVal });
    if (ok) {
      toast.success(
        'Preferencia guardada',
        nextVal ? 'Barra lateral minimizada por defecto' : 'Barra lateral expandida por defecto'
      );
    }
  };

  const handleTogglePinnedItem = async (route: string) => {
    let nextItems: string[];
    if (sidebarPinnedItems.includes(route)) {
      if (sidebarPinnedItems.length <= 1) {
        toast.warning('Aviso', 'Debe mantenerse al menos un acceso directo visible.');
        return;
      }
      nextItems = sidebarPinnedItems.filter((r) => r !== route);
    } else {
      nextItems = [...sidebarPinnedItems, route];
    }
    setSidebarPinnedItems(nextItems);
    const ok = await updatePreferences({ sidebarPinnedItems: nextItems });
    if (ok) {
      toast.success('Barra lateral actualizada', 'Accesos directos guardados en tu perfil.');
    }
  };

  const handleSelectAllPinned = async (selectAll: boolean) => {
    const nextItems = selectAll ? ALL_SIDEBAR_ITEMS.map((i) => i.route) : ['/'];
    setSidebarPinnedItems(nextItems);
    await updatePreferences({ sidebarPinnedItems: nextItems });
    toast.success('Barra lateral actualizada', selectAll ? 'Todos los accesos activados' : 'Solo Dashboard activado');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    const ok = await updateProfile({
      name: profileName,
      avatar: profileAvatar,
    });
    setIsSavingProfile(false);
    if (ok) {
      toast.success('Perfil Actualizado', 'Nombre y avatar guardados en la base de datos.');
    } else {
      toast.error('Error al guardar', 'No se ha podido actualizar tu perfil.');
    }
  };

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
          {t('settings')}
        </h1>
        <p className="text-xs text-gray-500 dark:text-slate-400">
          Control de Acceso Basado en Roles Dinámicos (RBAC), Seguridad 2FA, Preferencias y Usuarios
        </p>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-700 dark:text-blue-300">
          {statusMessage}
        </div>
      )}

      {/* User Profile & Personal Preferences Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Mi Perfil y Preferencias de Usuario</h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Guardado en Base de Datos
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Personaliza tu avatar, nombre, efectos sonoros amigables y accesos de la barra lateral (leftbar)
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Section 1: User Profile Customization */}
          <div className="bg-gray-50/60 dark:bg-slate-800/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <UserIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xs font-bold text-gray-900 dark:text-white">Personalización del Perfil</h3>
              </div>

              <div className="flex items-center space-x-3 mb-4">
                <div className="relative">
                  {profileAvatar ? (
                    <img
                      src={profileAvatar}
                      alt={profileName || 'Usuario'}
                      className="w-12 h-12 rounded-full object-cover border-2 border-blue-500 shadow-xs bg-white"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-base flex items-center justify-center border-2 border-blue-500">
                      {(profileName || user?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-gray-900 dark:text-white">{user?.name}</div>
                  <div className="text-[11px] text-gray-500 dark:text-slate-400">{user?.email}</div>
                  <span className="inline-block mt-0.5 px-2 py-0.2 rounded-full text-[9px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                    {user?.role || 'USUARIO'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Tu nombre y apellidos"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    URL o Imagen del Avatar
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
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              disabled={isSavingProfile}
              onClick={handleSaveProfile}
              className="w-full inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingProfile ? 'Guardando...' : 'Guardar Perfil'}</span>
            </motion.button>
          </div>

          {/* Section 2: Sound & Notifications */}
          <div className="bg-gray-50/60 dark:bg-slate-800/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-gray-900 dark:text-white">Sonido y Notificaciones Amigables</h3>
              </div>

              <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
                Campanadas binaurales sintetizadas para mensajes de WhatsApp, menciones y acciones del CRM.
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
                  <div className="flex items-center space-x-2.5">
                    {soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-gray-400" />
                    )}
                    <div>
                      <div className="text-xs font-semibold text-gray-900 dark:text-white">
                        {soundEnabled ? 'Sonidos Activados' : 'Sonidos Deshabilitados'}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {soundEnabled ? 'Chimes activos en notificaciones y chat' : 'Todo silenciado'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleSound}
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

                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 space-y-2">
                  <div className="text-xs font-semibold text-gray-900 dark:text-white">Probar Efectos Sonoros</div>
                  <div className="text-[11px] text-gray-500 dark:text-slate-400">
                    Comprueba cómo suena la campana amigable en tus altavoces:
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleTestSound}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Reproducir Campanada de Prueba</span>
                  </motion.button>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-gray-500 dark:text-slate-400 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-gray-100 dark:border-slate-800">
              💡 También puedes silenciar o activar el sonido rápidamente desde el icono de altavoz en la barra superior.
            </div>
          </div>

          {/* Section 3: Leftbar & Navigation Customization */}
          <div className="bg-gray-50/60 dark:bg-slate-800/40 p-4 rounded-xl border border-gray-100 dark:border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <PanelLeft className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-xs font-bold text-gray-900 dark:text-white">Personalizar Barra Lateral (Leftbar)</h3>
              </div>

              {/* Sidebar Collapse Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 mb-3">
                <div>
                  <div className="text-xs font-semibold text-gray-900 dark:text-white">
                    Modo Minimizado / Oculto
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {sidebarCollapsed ? 'Barra lateral contraída (solo iconos)' : 'Barra lateral expandida completa'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleSidebarCollapsed}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    sidebarCollapsed ? 'bg-purple-600' : 'bg-gray-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      sidebarCollapsed ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Pinned Endpoints Checklist */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-700 dark:text-slate-300">
                    Endpoints / Módulos Visibles:
                  </span>
                  <div className="flex items-center space-x-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => handleSelectAllPinned(true)}
                      className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                    >
                      Todos
                    </button>
                    <span className="text-gray-300 dark:text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={() => handleSelectAllPinned(false)}
                      className="text-gray-500 hover:text-gray-800 dark:hover:text-slate-200"
                    >
                      Mínimo
                    </button>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1 bg-white dark:bg-slate-900 p-2 rounded-lg border border-gray-200 dark:border-slate-700 scrollbar-thin">
                  {ALL_SIDEBAR_ITEMS.map((item) => {
                    const isChecked = sidebarPinnedItems.includes(item.route);
                    return (
                      <label
                        key={item.route}
                        className="flex items-center space-x-2 p-1 rounded hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePinnedItem(item.route)}
                          className="w-3.5 h-3.5 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer"
                        />
                        <span
                          className={`text-[11px] ${
                            isChecked ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-400 dark:text-slate-500'
                          }`}
                        >
                          {item.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-gray-500 dark:text-slate-400 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-gray-100 dark:border-slate-800">
              🔒 El acceso a Configuración permanece siempre disponible para evitar bloqueos accidentales.
            </div>
          </div>
        </div>
      </div>

      {/* White-label Branding & Customization Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
              style={{ backgroundColor: brandForm.primaryColor }}
            >
              <Paintbrush className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Identidad de Marca & Logo Corporativo</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Personaliza los colores, logo y curvatura de bordes para adaptar DAMA-CRM a la imagen de tu empresa
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => {
                resetBranding();
                toast.info('Identidad Restablecida', 'Se han restaurado los estilos por defecto.');
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => {
                updateBranding(brandForm);
                setBrandSaved(true);
                toast.success('Identidad Corporativa Guardada', 'Los colores, logo y bordes se han aplicado al CRM.');
                setTimeout(() => setBrandSaved(false), 3000);
              }}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 text-xs font-semibold text-white rounded-xl shadow-xs transition-opacity hover:opacity-90"
              style={{ backgroundColor: brandForm.primaryColor }}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{brandSaved ? '¡Guardado!' : 'Guardar Marca'}</span>
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Col 1: Nombre & Logo */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Nombre de la Empresa
              </label>
              <input
                type="text"
                value={brandForm.companyName}
                onChange={(e) => setBrandForm({ ...brandForm, companyName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                URL o Archivo del Logo
              </label>
              <input
                type="text"
                placeholder="https://ejemplo.com/logo.png"
                value={brandForm.logoUrl}
                onChange={(e) => setBrandForm({ ...brandForm, logoUrl: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none mb-2"
              />
              <label className="inline-flex items-center space-x-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                <Image className="w-3.5 h-3.5" />
                <span>Subir archivo de imagen local</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        setBrandForm({ ...brandForm, logoUrl: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {/* Col 2: Color Corporativo & Redondeo */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Color Primario Corporativo
              </label>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="color"
                  value={brandForm.primaryColor}
                  onChange={(e) => setBrandForm({ ...brandForm, primaryColor: e.target.value })}
                  className="w-9 h-9 rounded-lg border border-gray-200 dark:border-slate-700 cursor-pointer p-0.5 bg-white"
                />
                <span className="font-mono text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase">
                  {brandForm.primaryColor}
                </span>
              </div>

              {/* Quick Palettes */}
              <div className="flex items-center space-x-2">
                {[
                  { name: 'Azul Real', hex: '#2563EB' },
                  { name: 'Verde Esmeralda', hex: '#059669' },
                  { name: 'Púrpura Tech', hex: '#7C3AED' },
                  { name: 'Naranja Pro', hex: '#EA580C' },
                  { name: 'Rojo Carmín', hex: '#DC2626' },
                  { name: 'Cian Océano', hex: '#0891B2' },
                ].map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    title={color.name}
                    onClick={() => setBrandForm({ ...brandForm, primaryColor: color.hex })}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                      brandForm.primaryColor === color.hex ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Curvatura de Bordes (Bordes redondeados en todo)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'sm', label: 'Suave (8px)' },
                  { id: 'md', label: 'Moderno (14px)' },
                  { id: 'lg', label: 'Extra (20px)' },
                  { id: 'full', label: 'Curvado (28px)' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setBrandForm({ ...brandForm, borderRadius: r.id as any })}
                    className={`py-1.5 px-2.5 text-xs font-semibold rounded-xl border transition-all text-center ${
                      brandForm.borderRadius === r.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                        : 'border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Col 3: Vista Previa en Vivo */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/60 space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1 mb-2">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Vista Previa en Vivo</span>
              </span>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 space-y-2.5 shadow-xs">
                <div className="flex items-center space-x-2">
                  {brandForm.logoUrl ? (
                    <img src={brandForm.logoUrl} alt="Logo" className="w-6 h-6 rounded object-contain" />
                  ) : (
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center text-white"
                      style={{ backgroundColor: brandForm.primaryColor }}
                    >
                      <Shield className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <span className="font-bold text-xs text-gray-900 dark:text-white truncate">
                    {brandForm.companyName}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ backgroundColor: `${brandForm.primaryColor}20`, color: brandForm.primaryColor }}
                  >
                    Etiqueta Activa
                  </span>
                  <span className="text-[11px] text-gray-500">12 Oportunidades</span>
                </div>

                <button
                  type="button"
                  style={{ backgroundColor: brandForm.primaryColor }}
                  className="w-full py-1.5 text-xs font-semibold text-white rounded-lg shadow-xs"
                >
                  Botón de Acción
                </button>
              </div>
            </div>

            <p className="text-[10px] text-gray-400 text-center">
              Los cambios se aplican al instante en el Navbar, Menú y Pantalla de Inicio.
            </p>
          </div>
        </div>
      </div>

      {/* Security: 2FA Toggle Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-900 dark:text-white">Doble Factor de Autenticación (2FA OTP)</h3>
            <p className="text-[11px] text-gray-500 dark:text-slate-400">
              Envía un código de 6 dígitos mediante Nodemailer a tu correo electrónico en cada inicio de sesión
            </p>
          </div>
        </div>

        <button
          onClick={handleToggle2FA}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            twoFactorEnabled
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-300'
          }`}
        >
          {twoFactorEnabled ? '2FA Activado (Protegido)' : 'Activar 2FA'}
        </button>
      </div>

      {/* Dynamic RBAC Matrix Editor */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Matriz Dinámica de Permisos (RBAC)</h2>
              <p className="text-[11px] text-gray-500">Configuración cruzada granular en PostgreSQL</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={selectedRoleId}
              onChange={(e) => handleSelectRole(e.target.value)}
              className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white font-semibold"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  Rol: {r.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleSaveMatrix}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Matriz</span>
            </button>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
            <thead className="bg-gray-50 dark:bg-slate-800/60 text-[11px] font-semibold text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-2.5">Módulo / Recurso</th>
                {actions.map((act) => (
                  <th key={act.id} className="px-4 py-2.5 text-center">
                    {act.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
              {resources.map((res) => (
                <tr key={res.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 font-semibold text-gray-900 dark:text-white">
                    {res.label}
                  </td>
                  {actions.map((act) => {
                    const isChecked = rolePermissions.some(
                      (p) => p.resource === res.id && p.action === act.id
                    );
                    const isAdmin = selectedRole?.name === 'ADMIN';

                    return (
                      <td key={act.id} className="px-4 py-2.5 text-center">
                        <input
                          type="checkbox"
                          disabled={isAdmin}
                          checked={isAdmin || isChecked}
                          onChange={() => togglePermission(res.id, act.id)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Management */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-500" />
            <h2 className="text-xs font-bold text-gray-900 dark:text-white">Cuentas de Usuarios Corporativos</h2>
          </div>
          <button
            onClick={() => {
              setNewUserForm({ name: '', email: '', password: '', roleId: roles[0]?.id || '' });
              setUserModalError('');
              setIsUserModalOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Nuevo Usuario</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
            <thead className="bg-gray-50 dark:bg-slate-800/60 text-[11px] font-semibold text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-2.5">Nombre</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Rol Asignado</th>
                <th className="px-4 py-2.5">2FA</th>
                <th className="px-4 py-2.5 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 font-bold text-gray-900 dark:text-white">{u.name}</td>
                  <td className="px-4 py-2.5 text-gray-600 dark:text-slate-300">{u.email}</td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {u.twoFactorEnabled ? (
                      <span className="text-emerald-600 font-semibold text-[11px]">Activado</span>
                    ) : (
                      <span className="text-gray-400 text-[11px]">Desactivado</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                      Activo
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registro de Auditoría y Trazabilidad de Seguridad */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xs font-bold text-gray-900 dark:text-white">Registro de Auditoría & Trazabilidad de Seguridad</h2>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300">
            {auditLogs.length} eventos registrados
          </span>
        </div>

        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
            <thead className="bg-gray-50 dark:bg-slate-800/60 text-[11px] font-semibold text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800 sticky top-0">
              <tr>
                <th className="px-4 py-2.5">Acción</th>
                <th className="px-4 py-2.5">Recurso / Entidad</th>
                <th className="px-4 py-2.5">Usuario Responsable</th>
                <th className="px-4 py-2.5">Dirección IP</th>
                <th className="px-4 py-2.5 text-right">Fecha y Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400 dark:text-slate-500">
                    No hay registros de auditoría aún.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.action === 'LOGIN' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' :
                        log.action === '2FA_VERIFIED' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' :
                        log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' :
                        log.action === 'DELETE' ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">
                      {log.resource || 'SYSTEM'} {log.resourceId ? `(#${log.resourceId.slice(0, 8)})` : ''}
                    </td>
                    <td className="px-4 py-2.5">
                      {log.user ? `${log.user.name} (${log.user.email})` : 'Sistema Automático'}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[10px] text-gray-500 dark:text-slate-400">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[11px] text-gray-400 dark:text-slate-500">
                      {new Date(log.createdAt).toLocaleString('es-ES')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Alta de Nuevo Usuario con Validación Estricta */}
      <AnimatePresence>
        {isUserModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Alta de Nuevo Usuario Corporativo</h3>
                    <p className="text-[11px] text-gray-500">Valida formato de email y contraseña segura</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {userModalError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center space-x-2 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{userModalError}</span>
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Nombre Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    placeholder="Ej. Ana Belén García"
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Correo Electrónico <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    placeholder="usuario@tuempresa.com"
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                  {newUserForm.email && !isValidEmail(newUserForm.email) && (
                    <p className="mt-1 text-[11px] text-red-500">
                      Introduce un formato de correo válido (ej. usuario@dominio.com)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Rol de Acceso <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={newUserForm.roleId}
                    onChange={(e) => setNewUserForm({ ...newUserForm, roleId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 font-semibold"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} - {r.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300">
                      Contraseña de Acceso <span className="text-red-500">*</span>
                    </label>
                    {newUserForm.password && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pwdCheck.colorClass}`}>
                        {pwdCheck.label} ({pwdCheck.score}/5)
                      </span>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    placeholder="Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo"
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />

                  {/* Checklist Dinámico de Requisitos de Contraseña */}
                  <div className="mt-2.5 p-3 rounded-lg bg-gray-50 dark:bg-slate-800/40 border border-gray-200/80 dark:border-slate-700/80 space-y-1.5">
                    <div className="text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">
                      Requisitos de Seguridad de Contraseña:
                    </div>
                    {pwdCheck.rules.map((rule) => (
                      <div
                        key={rule.id}
                        className={`flex items-center space-x-1.5 text-[11px] transition-colors ${
                          rule.passed
                            ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                            : 'text-gray-400 dark:text-slate-500'
                        }`}
                      >
                        <Check className={`w-3.5 h-3.5 shrink-0 ${rule.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-300 dark:text-slate-600'}`} />
                        <span>{rule.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsUserModalOpen(false)}
                    className="px-3 py-2 text-xs font-semibold text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingUser || !pwdCheck.isValid || !isValidEmail(newUserForm.email) || !newUserForm.name}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-opacity disabled:opacity-50"
                  >
                    <span>{isSubmittingUser ? 'Registrando...' : 'Crear Usuario'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
