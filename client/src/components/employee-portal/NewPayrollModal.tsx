import React, { useState, useEffect } from 'react';
import { FileText, Calculator, X, DollarSign, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';

interface EmployeeOption {
  id: string;
  jobTitle?: string;
  salary?: number;
  user?: {
    name: string;
    email: string;
  };
}

interface NewPayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewPayrollModal: React.FC<NewPayrollModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const toast = useToast();
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentDate = new Date();
  const [employeeId, setEmployeeId] = useState('');
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [baseSalary, setBaseSalary] = useState<number>(0);
  const [bonuses, setBonuses] = useState<number>(0);
  const [deductions, setDeductions] = useState<number>(0);
  const [status, setStatus] = useState<string>('ISSUED');

  useEffect(() => {
    if (!isOpen) return;
    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const res = await apiRequest('/employees');
        if (res.success && res.data) {
          setEmployees(res.data);
          if (res.data.length > 0 && !employeeId) {
            setEmployeeId(res.data[0].id);
            if (res.data[0].salary) {
              const monthlyBase = Number((res.data[0].salary / 12).toFixed(2));
              setBaseSalary(monthlyBase);
              setDeductions(Number((monthlyBase * 0.19).toFixed(2))); // ~19% standard deduction (IRPF + SS)
            }
          }
        }
      } catch {
        toast.error(t('payrolls.fetchEmployeesError'));
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, [isOpen]);

  const handleEmployeeChange = (eId: string) => {
    setEmployeeId(eId);
    const emp = employees.find((e) => e.id === eId);
    if (emp && emp.salary) {
      const monthlyBase = Number((emp.salary / 12).toFixed(2));
      setBaseSalary(monthlyBase);
      setDeductions(Number((monthlyBase * 0.19).toFixed(2)));
    }
  };

  const grossSalary = Number(baseSalary) + Number(bonuses);
  const netSalary = Math.max(0, grossSalary - Number(deductions));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      toast.error(t('payrolls.selectEmployeeError'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiRequest('/employees/payrolls', {
        method: 'POST',
        body: JSON.stringify({
          employeeId,
          month: Number(month),
          year: Number(year),
          baseSalary: Number(baseSalary),
          bonuses: Number(bonuses),
          deductions: Number(deductions),
          status,
        }),
      });

      if (res.success) {
        toast.success(t('payrolls.createSuccess'));
        onSuccess();
        onClose();
      } else {
        toast.error(res.message || t('payrolls.createError'));
      }
    } catch {
      toast.error(t('payrolls.createError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                {t('payrolls.issuePayrollTitle')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {t('payrolls.issuePayrollSubtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              {t('payrolls.employeeLabel')}
            </label>
            <select
              value={employeeId}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              className="w-full text-xs rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.user?.name || 'Empleado'} - {emp.jobTitle || 'Puesto'} ({emp.user?.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {t('payrolls.monthLabel')}
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full text-xs rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {t('payrolls.yearLabel')}
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full text-xs rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {t('payrolls.baseSalaryLabel')} (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={baseSalary}
                onChange={(e) => setBaseSalary(Number(e.target.value))}
                className="w-full text-xs rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {t('payrolls.bonusesLabel')} (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={bonuses}
                onChange={(e) => setBonuses(Number(e.target.value))}
                className="w-full text-xs rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {t('payrolls.deductionsLabel')} (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={deductions}
                onChange={(e) => setDeductions(Number(e.target.value))}
                className="w-full text-xs rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Real-time Calculation Summary Box */}
          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 block">
                {t('payrolls.netCalculated')}
              </span>
              <span className="text-xs text-gray-500">
                {t('payrolls.gross')}: €{grossSalary.toFixed(2)} - {t('payrolls.deductions')}: €{Number(deductions).toFixed(2)}
              </span>
            </div>
            <div className="text-right font-mono text-lg font-black text-emerald-600 dark:text-emerald-400">
              €{netSalary.toFixed(2)}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              {t('status')}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full text-xs rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="DRAFT">{t('payrolls.statusDraft')}</option>
              <option value="ISSUED">{t('payrolls.statusIssued')}</option>
              <option value="PAID">{t('payrolls.statusPaid')}</option>
            </select>
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? t('loading') : t('payrolls.issuePayrollButton')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
