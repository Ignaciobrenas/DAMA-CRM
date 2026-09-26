import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  History,
  Save,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { apiRequest } from '../../services/api';

interface Role {
  id: string;
  name: string;
  permissions?: Array<{ resource: string; action: string }>;
}

interface AuditLog {
  id: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

const RESOURCES = [
  { id: 'companies', label: 'Empresas & Cuentas' },
  { id: 'contacts', label: 'Contactos & Clientes' },
  { id: 'deals', label: 'Ventas (Deals)' },
  { id: 'projects', label: 'Proyectos Ágiles' },
  { id: 'tasks', label: 'Tareas & Planificación' },
  { id: 'invoices', label: 'Facturación & Presupuestos' },
  { id: 'inventory', label: 'Inventario UnoPIM' },
  { id: 'workflows', label: 'Automatizaciones' },
  { id: 'omnichannel', label: 'Omnicanal WhatsApp' },
  { id: 'tickets', label: 'Mesa de Ayuda (Tickets)' },
  { id: 'expenses', label: 'Gastos & Viáticos' },
  { id: 'portalEmpleado', label: 'Portal del Empleado' },
  { id: 'users', label: 'Usuarios y Roles' },
];

const ACTIONS = [
  { id: 'read', label: 'Lectura' },
  { id: 'create', label: 'Crear' },
  { id: 'update', label: 'Modificar' },
  { id: 'delete', label: 'Eliminar' },
  { id: 'manage', label: 'Total (Admin)' },
];

export const SecuritySettings: React.FC = () => {
  const { t } = useLanguage();
  const toast = useToast();

  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [rolePermissions, setRolePermissions] = useState<Array<{ resource: string; action: string }>>([]);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [isSavingMatrix, setIsSavingMatrix] = useState(false);

  const loadData = async () => {
    const [resRoles, resAudit, resMe] = await Promise.all([
      apiRequest('/users/roles'),
      apiRequest('/users/audit-logs'),
      apiRequest('/auth/me'),
    ]);

    if (resRoles.success && resRoles.data) {
      setRoles(resRoles.data);
      if (resRoles.data.length > 0) {
        setSelectedRoleId(resRoles.data[0].id);
        setRolePermissions(resRoles.data[0].permissions || []);
      }
    }

    if (resAudit.success && resAudit.data) {
      setAuditLogs(resAudit.data);
    }

    if (resMe.success && resMe.data) {
      setTwoFactorEnabled(resMe.data.twoFactorEnabled || false);
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
    setIsSavingMatrix(true);

    const res = await apiRequest(`/users/roles/${selectedRoleId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions: rolePermissions }),
    });
    setIsSavingMatrix(false);

    if (res.success) {
      toast.success('Permisos RBAC Guardados', 'La matriz de seguridad se sincronizó correctamente en la base de datos.');
      loadData();
    } else {
      toast.error('Error al guardar matriz', res.message || 'No se pudieron actualizar los permisos.');
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
      if (nextState) {
        toast.success('Seguridad 2FA Activada', 'Tu cuenta ahora requiere código OTP por email.');
      } else {
        toast.info('Seguridad 2FA Desactivada', 'Se ha deshabilitado el doble factor.');
      }
      loadData();
    } else {
      toast.error('Error al actualizar 2FA', res.message || 'Operación no permitida');
    }
  };

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  const filteredLogs = auditLogs.filter((log) => {
    const matchSearch =
      !auditSearch ||
      (log.action && log.action.toLowerCase().includes(auditSearch.toLowerCase())) ||
      (log.resource && log.resource.toLowerCase().includes(auditSearch.toLowerCase())) ||
      (log.user?.name && log.user.name.toLowerCase().includes(auditSearch.toLowerCase())) ||
      (log.user?.email && log.user.email.toLowerCase().includes(auditSearch.toLowerCase()));
    const matchAction = !auditActionFilter || log.action === auditActionFilter;
    return matchSearch && matchAction;
  });

  return (
    <div className="space-y-6">
      {/* 2FA Toggle Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-900 dark:text-white">
              {t('settings.twoFactorOtp', 'Autenticación de Doble Factor (2FA OTP)')}
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-slate-400">
              Envía un código de 6 dígitos mediante servidor Nodemailer a tu correo electrónico en cada inicio de sesión.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggle2FA}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors shrink-0 ${
            twoFactorEnabled
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-700'
          }`}
        >
          {twoFactorEnabled ? '2FA Activado (Protegido)' : 'Activar 2FA'}
        </button>
      </div>

      {/* Dynamic RBAC Matrix Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                {t('settings.dynamicRbacMatrix', 'Matriz Dinámica de Roles y Permisos RBAC')}
              </h2>
              <p className="text-[11px] text-gray-500">
                {t('settings.dynamicRbacDesc', 'Asigna permisos granulares por recurso a cada rol del CRM.')}
              </p>
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
              type="button"
              onClick={handleSaveMatrix}
              disabled={isSavingMatrix}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingMatrix ? 'Guardando...' : t('settings.saveMatrix', 'Guardar Matriz')}</span>
            </button>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-800">
          <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
            <thead className="bg-gray-50 dark:bg-slate-800/60 text-[11px] font-semibold text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-2.5">{t('settings.moduleResource', 'Módulo / Recurso')}</th>
                {ACTIONS.map((act) => (
                  <th key={act.id} className="px-4 py-2.5 text-center">
                    {act.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
              {RESOURCES.map((res) => (
                <tr key={res.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 font-semibold text-gray-900 dark:text-white">
                    {res.label}
                  </td>
                  {ACTIONS.map((act) => {
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

      {/* Security Audit Logs */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xs font-bold text-gray-900 dark:text-white">
              {t('settings.securityAuditLog', 'Registro de Auditoría & Trazabilidad de Seguridad')}
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Buscar eventos..."
                className="pl-8 pr-2.5 py-1 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none"
              />
            </div>

            <select
              value={auditActionFilter}
              onChange={(e) => setAuditActionFilter(e.target.value)}
              className="px-2.5 py-1 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none"
            >
              <option value="">Todas las acciones</option>
              <option value="LOGIN">LOGIN</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="UPDATE_MODULES">UPDATE_MODULES</option>
              <option value="UPDATE_BRANDING">UPDATE_BRANDING</option>
            </select>

            <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 shrink-0">
              {filteredLogs.length} eventos
            </span>
          </div>
        </div>

        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
            <thead className="bg-gray-50 dark:bg-slate-800/60 text-[11px] font-semibold text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800 sticky top-0">
              <tr>
                <th className="px-4 py-2.5">{t('settings.auditActionCol', 'Acción')}</th>
                <th className="px-4 py-2.5">{t('settings.auditResourceCol', 'Recurso')}</th>
                <th className="px-4 py-2.5">{t('settings.auditUserCol', 'Usuario')}</th>
                <th className="px-4 py-2.5">{t('settings.auditIpCol', 'Dirección IP')}</th>
                <th className="px-4 py-2.5 text-right">{t('settings.auditDateCol', 'Fecha & Hora')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400 dark:text-slate-500">
                    No hay registros de auditoría que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.action === 'LOGIN'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                            : log.action === '2FA_VERIFIED'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                            : log.action === 'CREATE'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : log.action === 'DELETE'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
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
    </div>
  );
};
