import React, { useState, useEffect } from 'react';
import { Shield, ShieldCheck, Users, Lock, Key, Check, Save } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const Settings: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
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
