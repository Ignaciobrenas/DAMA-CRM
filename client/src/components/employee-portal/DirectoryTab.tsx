import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Mail,
  Briefcase,
  Calendar,
  Building,
  Shield,
  Trash2,
  Edit2,
  CheckCircle,
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { NewEmployeeModal } from './NewEmployeeModal';

interface Employee {
  id: string;
  userId: string;
  tenantId: string;
  department?: string;
  jobTitle?: string;
  contractType?: string;
  salary?: number | null;
  dniNie?: string;
  hireDate?: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
  timeRecordsCount?: number;
}

export const DirectoryTab: React.FC<{ isManagerOrAdmin?: boolean }> = ({
  isManagerOrAdmin = false,
}) => {
  const { t } = useLanguage();
  const toast = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [contractFilter, setContractFilter] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (deptFilter) params.department = deptFilter;
      if (contractFilter) params.contractType = contractFilter;

      const res = await apiRequest('/employees', { params });
      if (res.success && res.data) {
        setEmployees(res.data);
      }
    } catch {
      toast.error(t('employees.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, deptFilter, contractFilter]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`${t('employees.confirmDelete')} ${name}?`)) return;
    try {
      const res = await apiRequest(`/employees/${id}`, { method: 'DELETE' });
      if (res.success) {
        toast.success(t('employees.deleteSuccess'));
        fetchEmployees();
      } else {
        toast.error(res.message || t('employees.deleteError'));
      }
    } catch {
      toast.error(t('employees.deleteError'));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
            {t('employees.statusActive')}
          </span>
        );
      case 'ON_LEAVE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
            {t('employees.statusOnLeave')}
          </span>
        );
      case 'TERMINATED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
            {t('employees.statusTerminated')}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Search and Filter bar */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('employees.searchPlaceholder')}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-gray-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="">{t('employees.allDepartments')}</option>
            <option value="Engineering">{t('employees.deptEngineering')}</option>
            <option value="Sales">{t('employees.deptSales')}</option>
            <option value="Marketing">{t('employees.deptMarketing')}</option>
            <option value="HR">{t('employees.deptHR')}</option>
            <option value="Finance">{t('employees.deptFinance')}</option>
            <option value="Operations">{t('employees.deptOperations')}</option>
          </select>

          <select
            value={contractFilter}
            onChange={(e) => setContractFilter(e.target.value)}
            className="bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-gray-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="">{t('employees.allContracts')}</option>
            <option value="INDEFINIDO">{t('employees.contractIndefinido')}</option>
            <option value="TEMPORAL">{t('employees.contractTemporal')}</option>
            <option value="PRACTICAS">{t('employees.contractPracticas')}</option>
            <option value="FREELANCE">{t('employees.contractFreelance')}</option>
          </select>
        </div>

        {isManagerOrAdmin && (
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t('employees.newEmployeeButton')}</span>
          </button>
        )}
      </div>

      {/* Directory Grid / Table */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center space-x-2">
            <span>{t('employees.directoryTitle')}</span>
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 text-xs font-mono rounded-full">
              {employees.length}
            </span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/50 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">{t('employees.colEmployee')}</th>
                <th className="py-3 px-4">{t('employees.colDepartment')}</th>
                <th className="py-3 px-4">{t('employees.colJobTitle')}</th>
                <th className="py-3 px-4">{t('employees.colContract')}</th>
                {isManagerOrAdmin && <th className="py-3 px-4">{t('employees.colSalary')}</th>}
                <th className="py-3 px-4">{t('employees.colHireDate')}</th>
                <th className="py-3 px-4">{t('status')}</th>
                {isManagerOrAdmin && <th className="py-3 px-4 text-right">{t('actions')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={isManagerOrAdmin ? 8 : 6} className="py-8 text-center text-gray-400">
                    {t('loading')}
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={isManagerOrAdmin ? 8 : 6} className="py-8 text-center text-gray-400">
                    {t('employees.noEmployeesFound')}
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50/75 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600/10 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                          {emp.user?.name?.charAt(0) || 'E'}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {emp.user?.name || 'Empleado'}
                          </div>
                          <div className="text-[11px] text-gray-400 flex items-center space-x-1">
                            <Mail className="w-3 h-3 inline" />
                            <span>{emp.user?.email || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-700 dark:text-slate-300">
                      {emp.department || 'General'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      {emp.jobTitle || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 rounded text-[11px] font-mono">
                        {emp.contractType || 'INDEFINIDO'}
                      </span>
                    </td>
                    {isManagerOrAdmin && (
                      <td className="py-3 px-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {emp.salary ? `€${emp.salary.toLocaleString()}/año` : '—'}
                      </td>
                    )}
                    <td className="py-3 px-4 text-gray-500 dark:text-slate-400">
                      {emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(emp.status)}</td>
                    {isManagerOrAdmin && (
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDelete(emp.id, emp.user?.name || 'Empleado')}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                          title={t('delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NewEmployeeModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={fetchEmployees}
      />
    </div>
  );
};
