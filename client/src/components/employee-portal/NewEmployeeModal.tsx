import React, { useState, useEffect } from 'react';
import { UserPlus, X, Building, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

interface NewEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CompanyOption {
  id: string;
  name: string;
  tenantId?: string;
}

export const NewEmployeeModal: React.FC<NewEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const toast = useToast();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [jobTitle, setJobTitle] = useState('');
  const [contractType, setContractType] = useState('INDEFINIDO');
  const [salary, setSalary] = useState<number>(35000);
  const [dniNie, setDniNie] = useState('');
  const [ssNumber, setSsNumber] = useState('');
  const [iban, setIban] = useState('');
  const [hireDate, setHireDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedTenantId, setSelectedTenantId] = useState('');

  const isSuperAdmin = user?.role === 'ADMIN' || user?.email === 'ignaciobrenas@gmail.com' || user?.email === 'admin@dama-crm.local';

  useEffect(() => {
    if (!isOpen) return;
    const fetchCompanies = async () => {
      try {
        const res = await apiRequest('/companies');
        if (res.success && res.data) {
          setCompanies(res.data);
          if (res.data.length > 0 && !selectedTenantId) {
            setSelectedTenantId(res.data[0].id);
          }
        }
      } catch {
        // Ignored
      }
    };
    if (isSuperAdmin) {
      fetchCompanies();
    }
  }, [isOpen, isSuperAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !jobTitle.trim()) {
      toast.error(t('employees.validationError'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest('/employees', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          department: department.trim(),
          jobTitle: jobTitle.trim(),
          contractType,
          salary: Number(salary),
          dniNie: dniNie.trim() || undefined,
          ssNumber: ssNumber.trim() || undefined,
          iban: iban.trim() || undefined,
          hireDate: hireDate || undefined,
          tenantId: isSuperAdmin ? selectedTenantId || undefined : undefined,
        }),
      });

      if (res.success) {
        toast.success(t('employees.createSuccess'));
        onSuccess();
        onClose();
        // Reset form
        setName('');
        setEmail('');
        setJobTitle('');
        setDniNie('');
        setSsNumber('');
        setIban('');
      } else {
        toast.error(res.message || t('employees.createError'));
      }
    } catch {
      toast.error(t('employees.createError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                {t('employees.modalNewTitle')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {t('employees.modalNewSubtitle')}
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
          {/* God Mode SuperAdmin Tenant / Company Selector */}
          {isSuperAdmin && (
            <div className="p-3 bg-amber-500/10 border border-amber-300 dark:border-amber-800/60 rounded-xl">
              <label className="block text-xs font-bold text-amber-800 dark:text-amber-300 mb-1 flex items-center space-x-1">
                <Building className="w-3.5 h-3.5 mr-1" />
                <span>{t('employees.companyTenantSelect')} (God Mode)</span>
              </label>
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="w-full text-xs rounded-lg border border-amber-200 dark:border-amber-900/60 bg-white dark:bg-slate-900 p-2 text-gray-900 dark:text-white focus:outline-none"
              >
                <option value="">{t('employees.masterCompanyDefault')}</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {t('name')} *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ignacio Breñas"
                className="w-full text-xs rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {t('email')} *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="empleado@empresa.com"
                className="w-full text-xs rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {t('employees.departmentLabel')}
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-xs rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Engineering">{t('employees.deptEngineering')}</option>
                <option value="Sales">{t('employees.deptSales')}</option>
                <option value="Marketing">{t('employees.deptMarketing')}</option>
                <option value="HR">{t('employees.deptHR')}</option>
                <option value="Finance">{t('employees.deptFinance')}</option>
                <option value="Operations">{t('employees.deptOperations')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {t('employees.jobTitleLabel')} *
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Senior Engineer"
                className="w-full text-xs rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {t('employees.contractTypeLabel')}
              </label>
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                className="w-full text-xs rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="INDEFINIDO">{t('employees.contractIndefinido')}</option>
                <option value="TEMPORAL">{t('employees.contractTemporal')}</option>
                <option value="PRACTICAS">{t('employees.contractPracticas')}</option>
                <option value="FREELANCE">{t('employees.contractFreelance')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {t('employees.grossSalaryAnnual')} (€)
              </label>
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(Number(e.target.value))}
                className="w-full text-xs rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {t('employees.dniNieLabel')}
              </label>
              <input
                type="text"
                value={dniNie}
                onChange={(e) => setDniNie(e.target.value)}
                placeholder="12345678Z"
                className="w-full text-xs rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {t('employees.ssNumberLabel')}
              </label>
              <input
                type="text"
                value={ssNumber}
                onChange={(e) => setSsNumber(e.target.value)}
                placeholder="281234567890"
                className="w-full text-xs rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {t('employees.hireDateLabel')}
              </label>
              <input
                type="date"
                value={hireDate}
                onChange={(e) => setHireDate(e.target.value)}
                className="w-full text-xs rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              {t('employees.ibanLabel')}
            </label>
            <input
              type="text"
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              placeholder="ES91 2100 0418 4502 0005 1332"
              className="w-full text-xs rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
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
              className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? t('loading') : t('employees.saveEmployeeButton')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
