import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  History,
  Save,
  Search,
  CheckCircle2,
  Lock,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { apiRequest } from '../../services/api';

interface Role {
  id: string;
  name: string;
  isSystem?: boolean;
  permissions?: Array<{ resource: string; action: string }>;
}

interface AuditLog {
  id: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: string;
  createdAt: string;
  user?: { name: string; email: string };
}

export const SecuritySettings: React.FC = () => {
  const { t } = useLanguage();
  const toast = useToast();

  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [rolePermissions, setRolePermissions] = useState<Array<{ resource: string; action: string }>>([]);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [isSavingMatrix, setIsSavingMatrix] = useState(false);
  
  const [resources, setResources] = useState<Array<{id: string, label: string}>>([]);
  const [actions, setActions] = useState<Array<{id: string, label: string}>>([]);
  
  // Create Role Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [isDeletingRole, setIsDeletingRole] = useState(false);

  const loadData = async () => {
    const [resRoles, resAudit, resMe, resRbac] = await Promise.all([
      apiRequest('/users/roles'),
      apiRequest('/users/audit-logs'),
      apiRequest('/auth/me'),
      apiRequest('/users/rbac-resources'),
    ]);

    if (resRbac.success && resRbac.data) {
      setResources(resRbac.data.resources || []);
      setActions(resRbac.data.actions || []);
    }

    if (resRoles.success && resRoles.data) {
      setRoles(resRoles.data);
      if (resRoles.data.length > 0 && !selectedRoleId) {
        setSelectedRoleId(resRoles.data[0].id);
        setRolePermissions(resRoles.data[0].permissions || []);
      } else if (selectedRoleId) {
        const current = resRoles.data.find((r: Role) => r.id === selectedRoleId);
        if (current) setRolePermissions(current.permissions || []);
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
      toast.success('Permisos Guardados', 'La matriz se sincronizó correctamente.');
      loadData();
    } else {
      toast.error('Error al guardar', res.message);
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
      toast.success('2FA Actualizado', nextState ? 'Tu cuenta requiere código OTP.' : 'Doble factor deshabilitado.');
    } else {
      toast.error('Error al actualizar 2FA', res.message);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName) return;
    setIsCreatingRole(true);
    const res = await apiRequest('/users/roles', {
      method: 'POST',
      body: JSON.stringify({ name: newRoleName, description: newRoleDesc })
    });
    setIsCreatingRole(false);

    if (res.success) {
      toast.success('Rol Creado', `El rol ${newRoleName} se ha creado.`);
      setIsModalOpen(false);
      setNewRoleName('');
      setNewRoleDesc('');
      loadData();
      setSelectedRoleId(res.data.id);
    } else {
      toast.error('Error', res.message);
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRoleId || isDeletingRole) return;
    if (!window.confirm('¿Seguro que deseas eliminar este rol permanentemente?')) return;
    
    setIsDeletingRole(true);
    const res = await apiRequest(`/users/roles/${selectedRoleId}`, { method: 'DELETE' });
    setIsDeletingRole(false);

    if (res.success) {
      toast.success('Rol Eliminado', 'El rol ha sido borrado del sistema.');
      setSelectedRoleId('');
      loadData();
    } else {
      toast.error('Error', res.message);
    }
  };

  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const isAdmin = selectedRole?.name === 'ADMIN';
  const isSystemRole = selectedRole?.isSystem;

  const filteredLogs = auditLogs.filter((log) => {
    return !auditSearch || (log.action && log.action.toLowerCase().includes(auditSearch.toLowerCase())) ||
      (log.user?.name && log.user.name.toLowerCase().includes(auditSearch.toLowerCase()));
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 2FA Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-2xl ${twoFactorEnabled ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Autenticación de Dos Factores (2FA)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Añade una capa extra de seguridad usando una app autenticadora.</p>
          </div>
        </div>
        <button
          onClick={handleToggle2FA}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${twoFactorEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
        >
          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>

      {/* RBAC Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Matriz de Permisos (RBAC)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configura granularmente qué puede hacer cada rol en el CRM.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedRoleId}
              onChange={(e) => handleSelectRole(e.target.value)}
              className="pl-3 pr-8 py-2 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white appearance-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name} {r.isSystem ? '(Sistema)' : ''}</option>
              ))}
            </select>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Rol</span>
            </button>

            {!isSystemRole && selectedRoleId && (
              <button
                onClick={handleDeleteRole}
                disabled={isDeletingRole}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl transition-all active:scale-[0.98]"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Eliminar</span>
              </button>
            )}
            
            <button
              onClick={handleSaveMatrix}
              disabled={isSavingMatrix}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Matriz</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">Módulo / Recurso</th>
                {actions.map((act) => (
                  <th key={act.id} className="px-4 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400">
                    {act.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {resources.length === 0 ? (
                <tr><td colSpan={actions.length + 1} className="p-4 text-center text-xs text-slate-400">Cargando recursos...</td></tr>
              ) : resources.map((res) => (
                <tr key={res.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {res.label}
                  </td>
                  {actions.map((act) => {
                    const isChecked = rolePermissions.some((p) => p.resource === res.id && p.action === act.id);
                    const effectivelyChecked = isAdmin || isChecked;
                    return (
                      <td key={act.id} className="px-4 py-4 text-center">
                        <button
                          type="button"
                          disabled={isAdmin}
                          onClick={() => togglePermission(res.id, act.id)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            effectivelyChecked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                          } ${isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              effectivelyChecked ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
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
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mt-6">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <History className="w-5 h-5 text-slate-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Registro de Auditoría</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Historial inmutable de acciones en el sistema.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar en logs..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto max-h-80 overflow-y-auto hide-scrollbar">
          <table className="w-full text-left text-xs min-w-[500px]">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold sticky top-0 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3 whitespace-nowrap">Acción</th>
                <th className="px-6 py-3 whitespace-nowrap">Usuario</th>
                <th className="px-6 py-3 whitespace-nowrap text-right">Fecha & Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400">Sin resultados</td></tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">{log.action}</td>
                    <td className="px-6 py-3 text-slate-500">{log.user?.name || log.user?.email || 'Sistema'}</td>
                    <td className="px-6 py-3 text-slate-400 text-right">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Role Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Crear Nuevo Rol</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateRole} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nombre del Rol</label>
                  <input
                    required
                    type="text"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="Ej. Director Comercial"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Descripción (Opcional)</label>
                  <input
                    type="text"
                    value={newRoleDesc}
                    onChange={(e) => setNewRoleDesc(e.target.value)}
                    placeholder="Acceso total a ventas y reportes"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingRole}
                    className="px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {isCreatingRole ? 'Guardando...' : 'Crear Rol'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
