import React, { useState, useEffect } from 'react';
import { Shield, ShieldCheck, Users, Lock, Key, Check, Save, Paintbrush, Image, RotateCcw, Sparkles } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useBranding } from '../context/BrandingContext';

export const Settings: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { branding, updateBranding, resetBranding } = useBranding();
  const [brandForm, setBrandForm] = useState(branding);
  const [brandSaved, setBrandSaved] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [users, setUsers] = useState<any[]>([]);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(user?.twoFactorEnabled || false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [rolePermissions, setRolePermissions] = useState<Array<{ resource: string; action: string }>>([]);

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
    const [resRoles, resUsers] = await Promise.all([
      apiRequest('/users/roles'),
      apiRequest('/users'),
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
      loadData();
      setTimeout(() => setStatusMessage(''), 3000);
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
      setTimeout(() => setStatusMessage(''), 3000);
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
          Control de Acceso Basado en Roles Dinámicos (RBAC), Seguridad 2FA y Usuarios
        </p>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-700 dark:text-blue-300">
          {statusMessage}
        </div>
      )}

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
            <button
              type="button"
              onClick={resetBranding}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>
            <button
              type="button"
              onClick={() => {
                updateBranding(brandForm);
                setBrandSaved(true);
                setTimeout(() => setBrandSaved(false), 3000);
              }}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 text-xs font-semibold text-white rounded-xl shadow-xs transition-opacity hover:opacity-90"
              style={{ backgroundColor: brandForm.primaryColor }}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{brandSaved ? '¡Guardado!' : 'Guardar Marca'}</span>
            </button>
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
              <div className="pt-2">
                <div className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 mb-1.5">
                  Variantes Oficiales DAMA (1-Clic):
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBrandForm({ ...brandForm, logoUrl: '/assets/logos/dama-symbol-dark.svg' })}
                    className="p-1.5 text-[10px] font-medium bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg text-left truncate flex items-center space-x-1"
                  >
                    <img src="/assets/logos/dama-symbol-dark.svg" alt="DM" className="w-3.5 h-3.5 object-contain" />
                    <span className="truncate">Símbolo DM (Oscuro)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBrandForm({ ...brandForm, logoUrl: '/assets/logos/dama-symbol-light.svg' })}
                    className="p-1.5 text-[10px] font-medium bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg text-left truncate flex items-center space-x-1"
                  >
                    <img src="/assets/logos/dama-symbol-light.svg" alt="DM" className="w-3.5 h-3.5 object-contain" />
                    <span className="truncate">Símbolo DM (Claro)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBrandForm({ ...brandForm, logoUrl: '/assets/logos/dama-logo-dark.svg' })}
                    className="p-1.5 text-[10px] font-medium bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg text-left truncate flex items-center space-x-1"
                  >
                    <img src="/assets/logos/dama-logo-dark.svg" alt="DAMA" className="w-3.5 h-3.5 object-contain" />
                    <span className="truncate">Logo DAMA (Oscuro)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBrandForm({ ...brandForm, logoUrl: '/assets/logos/dama-logo-light.svg' })}
                    className="p-1.5 text-[10px] font-medium bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg text-left truncate flex items-center space-x-1"
                  >
                    <img src="/assets/logos/dama-logo-light.svg" alt="DAMA" className="w-3.5 h-3.5 object-contain" />
                    <span className="truncate">Logo DAMA (Blanco)</span>
                  </button>
                </div>
              </div>
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
    </div>
  );
};
