import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Search,
  ArrowUpDown,
  Edit2,
  Trash2,
  Lock,
  X,
  Save,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { apiRequest } from '../../services/api';
import { checkPasswordStrength, isValidEmail } from '../../utils/validators';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  roleId: string;
  isActive: boolean;
  twoFactorEnabled?: boolean;
  customPermissions?: Array<{ resource: string; action: string }>;
  createdAt: string;
}

interface RoleItem {
  id: string;
  name: string;
}

const RESOURCES = [
  { id: 'companies', label: 'Empresas' },
  { id: 'contacts', label: 'Contactos' },
  { id: 'deals', label: 'Ventas (Deals)' },
  { id: 'projects', label: 'Proyectos Ágiles' },
  { id: 'tasks', label: 'Tareas' },
  { id: 'invoices', label: 'Facturas' },
  { id: 'inventory', label: 'Inventario' },
  { id: 'workflows', label: 'Automatizaciones' },
  { id: 'omnichannel', label: 'Omnicanal' },
  { id: 'tickets', label: 'Tickets' },
  { id: 'expenses', label: 'Gastos' },
  { id: 'portalEmpleado', label: 'Portal Empleado' },
  { id: 'users', label: 'Usuarios' },
];

const ACTIONS = [
  { id: 'read', label: 'Lectura' },
  { id: 'create', label: 'Crear' },
  { id: 'update', label: 'Modificar' },
  { id: 'delete', label: 'Eliminar' },
  { id: 'manage', label: 'Total' },
];

export const UsersSettings: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [userSort, setUserSort] = useState<'name_asc' | 'name_desc' | 'email_asc' | 'role' | 'recent'>('name_asc');

  // Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '', roleId: '' });
  const [userModalError, setUserModalError] = useState('');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Edit Modal
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserForm, setEditUserForm] = useState({ name: '', email: '', roleId: '', password: '', isActive: true });
  const [editUserCustomPermissions, setEditUserCustomPermissions] = useState<Array<{ resource: string; action: string }>>([]);
  const [editUserModalError, setEditUserModalError] = useState('');
  const [isSubmittingEditUser, setIsSubmittingEditUser] = useState(false);

  // Delete Modal
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const loadData = async () => {
    const [resUsers, resRoles] = await Promise.all([
      apiRequest('/users'),
      apiRequest('/users/roles'),
    ]);

    if (resUsers.success && resUsers.data) setUsers(resUsers.data);
    if (resRoles.success && resRoles.data) setRoles(resRoles.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const newPwdCheck = checkPasswordStrength(newUserForm.password);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserModalError('');

    if (!newUserForm.name || !newUserForm.email || !newUserForm.password || !newUserForm.roleId) {
      setUserModalError('Todos los campos con asterisco (*) son obligatorios.');
      return;
    }

    if (!isValidEmail(newUserForm.email)) {
      setUserModalError('Introduce un correo electrónico válido.');
      return;
    }

    if (!newPwdCheck.isValid) {
      setUserModalError('La contraseña no cumple los requisitos de seguridad.');
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
      setNewUserForm({ name: '', email: '', password: '', roleId: roles[0]?.id || '' });
      toast.success('Usuario Creado', `La cuenta para ${newUserForm.name} ha sido creada correctamente.`);
      loadData();
    } else {
      setUserModalError(res.message || 'Error al crear usuario.');
    }
  };

  const openEditUserModal = (targetUser: UserItem) => {
    setEditingUserId(targetUser.id);
    setEditUserForm({
      name: targetUser.name,
      email: targetUser.email,
      roleId: targetUser.roleId || roles.find((r) => r.name === targetUser.role)?.id || '',
      password: '',
      isActive: targetUser.isActive,
    });
    setEditUserCustomPermissions(targetUser.customPermissions || []);
    setEditUserModalError('');
    setIsEditUserModalOpen(true);
  };

  const toggleEditUserPermission = (resource: string, action: string) => {
    const exists = editUserCustomPermissions.some((p) => p.resource === resource && p.action === action);
    if (exists) {
      setEditUserCustomPermissions(editUserCustomPermissions.filter((p) => !(p.resource === resource && p.action === action)));
    } else {
      setEditUserCustomPermissions([...editUserCustomPermissions, { resource, action }]);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    setEditUserModalError('');

    if (!editUserForm.name.trim() || !editUserForm.email.trim()) {
      setEditUserModalError('El nombre y el correo electrónico son obligatorios.');
      return;
    }

    if (!isValidEmail(editUserForm.email)) {
      setEditUserModalError('Introduce una dirección de correo válida.');
      return;
    }

    if (editUserForm.password && editUserForm.password.length < 6) {
      setEditUserModalError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsSubmittingEditUser(true);
    const payload: any = {
      name: editUserForm.name.trim(),
      email: editUserForm.email.trim(),
      roleId: editUserForm.roleId,
      isActive: editUserForm.isActive,
      customPermissions: editUserCustomPermissions,
    };
    if (editUserForm.password && editUserForm.password.trim()) {
      payload.password = editUserForm.password.trim();
    }

    const res = await apiRequest(`/users/${editingUserId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    setIsSubmittingEditUser(false);

    if (res.success) {
      setIsEditUserModalOpen(false);
      setEditingUserId(null);
      toast.success('Usuario Actualizado', 'Los datos y permisos del usuario se guardaron con éxito.');
      loadData();
    } else {
      setEditUserModalError(res.message || 'Error al actualizar usuario.');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);

    const res = await apiRequest(`/users/${userToDelete.id}`, {
      method: 'DELETE',
    });
    setIsDeletingUser(false);

    if (res.success) {
      toast.success('Usuario Eliminado', `La cuenta de ${userToDelete.name} ha sido eliminada.`);
      setUserToDelete(null);
      loadData();
    } else {
      toast.error('Error al eliminar', res.message || 'No se pudo eliminar el usuario.');
    }
  };

  const filteredUsers = users
    .filter((u) => {
      const matchSearch =
        !userSearch ||
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchRole = !userRoleFilter || u.role === userRoleFilter;
      const matchStatus =
        !userStatusFilter ||
        (userStatusFilter === 'active' && u.isActive) ||
        (userStatusFilter === 'inactive' && !u.isActive);
      return matchSearch && matchRole && matchStatus;
    })
    .sort((a, b) => {
      if (userSort === 'name_asc') return a.name.localeCompare(b.name);
      if (userSort === 'name_desc') return b.name.localeCompare(a.name);
      if (userSort === 'email_asc') return a.email.localeCompare(b.email);
      if (userSort === 'role') return a.role.localeCompare(b.role);
      if (userSort === 'recent') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs space-y-4 p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              {t('settings.corporateAccounts', 'Cuentas de Usuarios & Miembros de Empresa')}
            </h2>
            <p className="text-[11px] text-gray-500">
              {t('settings.corporateAccountsDesc', 'Gestiona las credenciales, roles asignados y accesos individuales.')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setNewUserForm({ name: '', email: '', password: '', roleId: roles[0]?.id || '' });
            setUserModalError('');
            setIsUserModalOpen(true);
          }}
          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors shrink-0"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>{t('settings.newUserBtn', 'Nuevo Usuario')}</span>
        </button>
      </div>

      {/* Filter and Sorting Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder={t('settings.searchUserPlaceholder', 'Buscar por nombre o email...')}
              className="w-full pl-8 pr-2.5 py-1 text-xs bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Filter by Role */}
          <select
            value={userRoleFilter}
            onChange={(e) => setUserRoleFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">{t('settings.allRoles', 'Todos los Roles')}</option>
            {roles.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Filter by Status */}
          <select
            value={userStatusFilter}
            onChange={(e) => setUserStatusFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">{t('settings.allStatuses', 'Todos los Estados')}</option>
            <option value="active">{t('settings.onlyActiveUsers', 'Solo Activos')}</option>
            <option value="inactive">{t('settings.onlyDisabledUsers', 'Solo Desactivados')}</option>
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
          <select
            value={userSort}
            onChange={(e) => setUserSort(e.target.value as any)}
            className="px-2.5 py-1 text-xs bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="name_asc">{t('settings.sortNameAsc', 'Nombre (A-Z)')}</option>
            <option value="name_desc">{t('settings.sortNameDesc', 'Nombre (Z-A)')}</option>
            <option value="email_asc">{t('settings.sortEmailAsc', 'Email (A-Z)')}</option>
            <option value="role">{t('settings.sortRole', 'Rol')}</option>
            <option value="recent">{t('settings.sortRecent', 'Más Recientes')}</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-800">
        <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
          <thead className="bg-gray-50 dark:bg-slate-800/60 text-[11px] font-semibold text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-2.5">{t('settings.userNameCol', 'Usuario')}</th>
              <th className="px-4 py-2.5">{t('settings.userEmailCol', 'Correo Electrónico')}</th>
              <th className="px-4 py-2.5">{t('settings.userRoleCol', 'Rol Asignado')}</th>
              <th className="px-4 py-2.5">2FA</th>
              <th className="px-4 py-2.5">{t('settings.userStatusCol', 'Estado')}</th>
              <th className="px-4 py-2.5 text-right">{t('settings.userActionsCol', 'Acciones')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400 dark:text-slate-500">
                  No se encontraron usuarios con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const hasCustom = u.customPermissions && u.customPermissions.length > 0;
                const isCurrent = user?.id === u.id;

                return (
                  <tr key={u.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 font-bold text-gray-900 dark:text-white">
                      <div className="flex items-center space-x-1.5">
                        <span>{u.name}</span>
                        {isCurrent && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded font-normal">
                            Tú
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 dark:text-slate-300">{u.email}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                          {u.role}
                        </span>
                        {hasCustom && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            +{u.customPermissions?.length || 0} custom
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      {u.twoFactorEnabled ? (
                        <span className="text-emerald-600 font-semibold text-[11px]">Protegido</span>
                      ) : (
                        <span className="text-gray-400 text-[11px]">Inactivo</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {u.isActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                          Activo
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400">
                          Desactivado
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => openEditUserModal(u)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded text-[11px] font-semibold transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Editar</span>
                        </button>
                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => setUserToDelete(u)}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: New User */}
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
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      {t('settings.newUserModalTitle', 'Alta de Nuevo Usuario Corporativo')}
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      {t('settings.newUserModalDesc', 'Crea credenciales con validación de seguridad estricta')}
                    </p>
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
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center space-x-2 text-red-600 dark:text-red-400 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{userModalError}</span>
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    placeholder="Ej. Laura Gómez"
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    placeholder="laura.gomez@empresa.com"
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Rol Asignado *
                  </label>
                  <select
                    value={newUserForm.roleId}
                    onChange={(e) => setNewUserForm({ ...newUserForm, roleId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Contraseña Temporal *
                  </label>
                  <input
                    type="password"
                    required
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
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
                    disabled={isSubmittingUser}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-opacity disabled:opacity-50"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{isSubmittingUser ? 'Creando...' : 'Crear Usuario'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Edit User */}
      <AnimatePresence>
        {isEditUserModalOpen && (
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
              className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Editar Usuario y Permisos Específicos
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Modifica datos de cuenta y asigna permisos personalizados directos
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditUserModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {editUserModalError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center space-x-2 text-red-600 dark:text-red-400 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{editUserModalError}</span>
                </div>
              )}

              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={editUserForm.name}
                      onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      required
                      value={editUserForm.email}
                      onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                      Rol Asignado
                    </label>
                    <select
                      value={editUserForm.roleId}
                      onChange={(e) => setEditUserForm({ ...editUserForm, roleId: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                      Estado de la Cuenta
                    </label>
                    <select
                      value={editUserForm.isActive ? 'active' : 'inactive'}
                      onChange={(e) => setEditUserForm({ ...editUserForm, isActive: e.target.value === 'active' })}
                      className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="active">Activo (Permite acceso)</option>
                      <option value="inactive">Desactivado (Bloqueado)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Nueva Contraseña (Opcional)
                  </label>
                  <input
                    type="password"
                    value={editUserForm.password}
                    onChange={(e) => setEditUserForm({ ...editUserForm, password: e.target.value })}
                    placeholder="Dejar en blanco para mantener la contraseña actual"
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Custom Permissions Matrix */}
                <div className="pt-2 border-t border-gray-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      Permisos Específicos Adicionales (Custom Overrides)
                    </span>
                    <span className="text-[10px] text-purple-600 font-semibold">
                      +{editUserCustomPermissions.length} permisos directos
                    </span>
                  </div>

                  <div className="overflow-x-auto max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
                      <thead className="bg-gray-50 dark:bg-slate-800/60 text-[10px] font-semibold text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800 sticky top-0">
                        <tr>
                          <th className="px-3 py-1.5">Módulo</th>
                          {ACTIONS.map((act) => (
                            <th key={act.id} className="px-2 py-1.5 text-center">
                              {act.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
                        {RESOURCES.map((res) => (
                          <tr key={res.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40">
                            <td className="px-3 py-1.5 font-semibold text-gray-900 dark:text-white">{res.label}</td>
                            {ACTIONS.map((act) => {
                              const isChecked = editUserCustomPermissions.some(
                                (p) => p.resource === res.id && p.action === act.id
                              );
                              return (
                                <td key={act.id} className="px-2 py-1.5 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleEditUserPermission(res.id, act.id)}
                                    className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
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

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditUserModalOpen(false)}
                    className="px-3 py-2 text-xs font-semibold text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEditUser}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-opacity disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSubmittingEditUser ? 'Guardando...' : 'Guardar Cambios'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Delete Confirmation */}
      <AnimatePresence>
        {userToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-800 p-6 space-y-4"
            >
              <div className="flex items-center space-x-3 text-red-600 dark:text-red-400">
                <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/60">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    {t('settings.deleteUserModalTitle', 'Eliminar Cuenta de Usuario')}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {t('settings.deleteUserModalDesc', 'Esta acción no se puede deshacer')}
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-600 dark:text-slate-300">
                ¿Estás seguro de que deseas eliminar permanentemente a{' '}
                <strong className="text-gray-900 dark:text-white">{userToDelete.name}</strong> ({userToDelete.email})?
              </p>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isDeletingUser}
                  onClick={handleDeleteUser}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {isDeletingUser ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
