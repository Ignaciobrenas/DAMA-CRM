import React, { useState, useEffect } from 'react';
import {
  FileText,
  DollarSign,
  Download,
  Plus,
  CheckCircle,
  Clock,
  Eye,
  X,
  Printer,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { NewPayrollModal } from './NewPayrollModal';

interface Payroll {
  id: string;
  employeeId: string;
  employee?: {
    id: string;
    jobTitle?: string;
    department?: string;
    dniNie?: string;
    ssNumber?: string;
    user?: {
      name: string;
      email: string;
    };
  };
  month: number;
  year: number;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  status: 'DRAFT' | 'ISSUED' | 'PAID';
  paymentDate?: string | null;
  createdAt: string;
}

export const PayrollsTab: React.FC<{ isManagerOrAdmin?: boolean }> = ({
  isManagerOrAdmin = false,
}) => {
  const { t } = useLanguage();
  const toast = useToast();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [viewingPayroll, setViewingPayroll] = useState<Payroll | null>(null);

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (yearFilter) params.year = yearFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await apiRequest('/employees/payrolls', { params });
      if (res.success && res.data) {
        setPayrolls(res.data);
      }
    } catch {
      toast.error(t('payrolls.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, [yearFilter, statusFilter]);

  const handleUpdateStatus = async (payrollId: string, newStatus: string) => {
    try {
      const res = await apiRequest(`/employees/payrolls/${payrollId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.success) {
        toast.success(t('payrolls.statusUpdated'));
        fetchPayrolls();
        if (viewingPayroll && viewingPayroll.id === payrollId) {
          setViewingPayroll({ ...viewingPayroll, status: newStatus as any });
        }
      } else {
        toast.error(res.message || t('payrolls.statusUpdateError'));
      }
    } catch {
      toast.error(t('payrolls.statusUpdateError'));
    }
  };

  // KPIs
  const totalNet = payrolls.reduce((acc, p) => acc + (p.netSalary || 0), 0);
  const totalGross = payrolls.reduce((acc, p) => acc + ((p.baseSalary || 0) + (p.bonuses || 0)), 0);
  const totalDeductions = payrolls.reduce((acc, p) => acc + (p.deductions || 0), 0);
  const latestPayroll = payrolls.length > 0 ? payrolls[0] : null;

  const monthNames = [
    t('months.january', 'Enero'),
    t('months.february', 'Febrero'),
    t('months.march', 'Marzo'),
    t('months.april', 'Abril'),
    t('months.may', 'Mayo'),
    t('months.june', 'Junio'),
    t('months.july', 'Julio'),
    t('months.august', 'Agosto'),
    t('months.september', 'Septiembre'),
    t('months.october', 'Octubre'),
    t('months.november', 'Noviembre'),
    t('months.december', 'Diciembre'),
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 inline-flex items-center space-x-1">
            <CheckCircle className="w-3 h-3" />
            <span>{t('payrolls.statusPaid')}</span>
          </span>
        );
      case 'ISSUED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 inline-flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{t('payrolls.statusIssued')}</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300">
            {t('payrolls.statusDraft')}
          </span>
        );
    }
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
              {t('payrolls.latestNetPayroll')}
            </span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="text-2xl font-black text-gray-900 dark:text-white">
              €{latestPayroll ? latestPayroll.netSalary.toFixed(2) : '0.00'}
            </span>
            {latestPayroll && (
              <span className="text-[11px] text-gray-400 font-medium">
                ({monthNames[latestPayroll.month - 1]} {latestPayroll.year})
              </span>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
              {t('payrolls.accumulatedGross')}
            </span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="text-2xl font-black text-gray-900 dark:text-white">
              €{totalGross.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
              {t('payrolls.totalDeductions')}
            </span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-600 dark:text-amber-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="text-2xl font-black text-gray-900 dark:text-white">
              €{totalDeductions.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
              {t('payrolls.totalNetReceived')}
            </span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/50 rounded-xl text-purple-600 dark:text-purple-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="text-2xl font-black text-gray-900 dark:text-white">
              €{totalNet.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Action and Filter bar */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(Number(e.target.value))}
            className="bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-gray-700 dark:text-slate-200 focus:outline-none"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-gray-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="">{t('payrolls.allStatuses')}</option>
            <option value="DRAFT">{t('payrolls.statusDraft')}</option>
            <option value="ISSUED">{t('payrolls.statusIssued')}</option>
            <option value="PAID">{t('payrolls.statusPaid')}</option>
          </select>
        </div>

        {isManagerOrAdmin && (
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t('payrolls.issuePayrollButton')}</span>
          </button>
        )}
      </div>

      {/* Payrolls Table */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center space-x-2">
            <span>{t('payrolls.tableTitle')}</span>
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 text-xs font-mono rounded-full">
              {payrolls.length}
            </span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/50 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                {isManagerOrAdmin && <th className="py-3 px-4">{t('payrolls.employeeCol')}</th>}
                <th className="py-3 px-4">{t('payrolls.periodCol')}</th>
                <th className="py-3 px-4">{t('payrolls.baseSalaryCol')}</th>
                <th className="py-3 px-4">{t('payrolls.bonusesCol')}</th>
                <th className="py-3 px-4">{t('payrolls.deductionsCol')}</th>
                <th className="py-3 px-4">{t('payrolls.netSalaryCol')}</th>
                <th className="py-3 px-4">{t('status')}</th>
                <th className="py-3 px-4 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={isManagerOrAdmin ? 8 : 7} className="py-8 text-center text-gray-400">
                    {t('loading')}
                  </td>
                </tr>
              ) : payrolls.length === 0 ? (
                <tr>
                  <td colSpan={isManagerOrAdmin ? 8 : 7} className="py-8 text-center text-gray-400">
                    {t('payrolls.noPayrollsFound')}
                  </td>
                </tr>
              ) : (
                payrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/75 dark:hover:bg-slate-800/40 transition">
                    {isManagerOrAdmin && (
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        {p.employee?.user?.name || 'Empleado'}
                      </td>
                    )}
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      {monthNames[p.month - 1]} {p.year}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-600 dark:text-slate-300">
                      €{p.baseSalary.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-600 dark:text-slate-300">
                      €{p.bonuses.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-mono text-rose-600 dark:text-rose-400">
                      -€{p.deductions.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      €{p.netSalary.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(p.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setViewingPayroll(p)}
                        className="p-1.5 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition inline-flex items-center space-x-1"
                        title={t('payrolls.viewReceipt')}
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-[11px] font-semibold">{t('payrolls.viewReceipt')}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Payroll Modal */}
      <NewPayrollModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={fetchPayrolls}
      />

      {/* Detailed Official Payslip / Recibo de Nómina Modal */}
      {viewingPayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">
                    {t('payrolls.receiptTitle')}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {monthNames[viewingPayroll.month - 1]} {viewingPayroll.year} • Ref: {viewingPayroll.id.slice(0, 8)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingPayroll(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recibo Oficial Structure */}
            <div className="mt-5 space-y-5 text-xs">
              {/* Company & Employee Identity Box */}
              <div className="grid grid-cols-2 gap-4 p-3.5 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    {t('payrolls.employerData')}
                  </span>
                  <p className="font-bold text-gray-900 dark:text-white">DAMA CRM Enterprise S.L.</p>
                  <p className="text-gray-500">CIF: B-99887766</p>
                  <p className="text-gray-500">CCC: 28/1234567/89</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    {t('payrolls.employeeData')}
                  </span>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {viewingPayroll.employee?.user?.name || 'Empleado'}
                  </p>
                  <p className="text-gray-500">
                    DNI/NIE: {viewingPayroll.employee?.dniNie || '***PROTEGIDO***'}
                  </p>
                  <p className="text-gray-500">
                    Nº Afiliación SS: {viewingPayroll.employee?.ssNumber || '***PROTEGIDO***'}
                  </p>
                  <p className="text-gray-500">
                    Puesto: {viewingPayroll.employee?.jobTitle || 'Desarrollador'}
                  </p>
                </div>
              </div>

              {/* Devengos (Accruals) */}
              <div>
                <h4 className="font-bold text-gray-800 dark:text-slate-200 mb-2 border-b border-gray-100 dark:border-slate-800 pb-1">
                  1. {t('payrolls.accrualsSection')}
                </h4>
                <div className="space-y-1.5 font-mono">
                  <div className="flex justify-between text-gray-600 dark:text-slate-300">
                    <span>{t('payrolls.baseSalaryLabel')}</span>
                    <span>€{viewingPayroll.baseSalary.toFixed(2)}</span>
                  </div>
                  {viewingPayroll.bonuses > 0 && (
                    <div className="flex justify-between text-gray-600 dark:text-slate-300">
                      <span>{t('payrolls.bonusesLabel')}</span>
                      <span>€{viewingPayroll.bonuses.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-gray-900 dark:text-white pt-1 border-t border-dashed border-gray-200 dark:border-slate-800">
                    <span>{t('payrolls.totalAccrued')}</span>
                    <span>€{(viewingPayroll.baseSalary + viewingPayroll.bonuses).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Deducciones (Deductions) */}
              <div>
                <h4 className="font-bold text-gray-800 dark:text-slate-200 mb-2 border-b border-gray-100 dark:border-slate-800 pb-1">
                  2. {t('payrolls.deductionsSection')}
                </h4>
                <div className="space-y-1.5 font-mono">
                  <div className="flex justify-between text-gray-600 dark:text-slate-300">
                    <span>{t('payrolls.irpfWithholding')}</span>
                    <span>-€{(viewingPayroll.deductions * 0.7).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-slate-300">
                    <span>{t('payrolls.socialSecurityContribution')}</span>
                    <span>-€{(viewingPayroll.deductions * 0.3).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-rose-600 dark:text-rose-400 pt-1 border-t border-dashed border-gray-200 dark:border-slate-800">
                    <span>{t('payrolls.totalDeductions')}</span>
                    <span>-€{viewingPayroll.deductions.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Líquido a percibir (Net Total) */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                    {t('payrolls.netToReceive')}
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-slate-400">
                    {t('payrolls.paymentMethodBankTransfer')}
                  </span>
                </div>
                <div className="font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  €{viewingPayroll.netSalary.toFixed(2)}
                </div>
              </div>

              {/* Admin status toggles */}
              {isManagerOrAdmin && (
                <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-slate-800">
                  <span className="font-semibold text-gray-700 dark:text-slate-300">
                    {t('payrolls.updateStatusLabel')}:
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleUpdateStatus(viewingPayroll.id, 'ISSUED')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        viewingPayroll.status === 'ISSUED'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300'
                      }`}
                    >
                      {t('payrolls.statusIssued')}
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(viewingPayroll.id, 'PAID')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        viewingPayroll.status === 'PAID'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300'
                      }`}
                    >
                      {t('payrolls.statusPaid')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-800">
              <div className="flex items-center space-x-1.5 text-[11px] text-gray-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>{t('payrolls.legallyValidElectronicPayslip')}</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={printReceipt}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-slate-200 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition flex items-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t('print')}</span>
                </button>
                <button
                  onClick={() => setViewingPayroll(null)}
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
                >
                  {t('close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
