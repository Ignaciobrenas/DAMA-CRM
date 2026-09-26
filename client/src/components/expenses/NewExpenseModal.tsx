import React, { useState } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

interface NewExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseCreated: () => void;
}

export const NewExpenseModal: React.FC<NewExpenseModalProps> = ({
  isOpen,
  onClose,
  onExpenseCreated,
}) => {
  const { t } = useTranslation();
  const toast = useToast();

  const [supplierName, setSupplierName] = useState('');
  const [supplierTaxId, setSupplierTaxId] = useState('');
  const [category, setCategory] = useState('SOFTWARE');
  const [subtotal, setSubtotal] = useState<number | ''>('');
  const [taxRate, setTaxRate] = useState(21);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [status, setStatus] = useState('PAID');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const sub = typeof subtotal === 'number' ? subtotal : 0;
  const taxAmount = Number(((sub * taxRate) / 100).toFixed(2));
  const total = Number((sub + taxAmount).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName || subtotal === '' || subtotal <= 0) {
      toast.error(t('expenses.requiredFields'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/expenses', {
        supplierName,
        supplierTaxId,
        category,
        subtotal: sub,
        taxRate,
        issueDate,
        paymentMethod,
        status,
        notes,
      });

      if (res.data?.success) {
        toast.success(t('expenses.expenseCreated'));
        onExpenseCreated();
        onClose();
        setSupplierName('');
        setSupplierTaxId('');
        setSubtotal('');
        setNotes('');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('expenses.createError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-scale-up">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {t('expenses.newExpense')}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('expenses.supplierName')} *
              </label>
              <input
                type="text"
                required
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="e.g. Hetzner Cloud GmbH"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('expenses.supplierTaxId')} (NIF / CIF)
              </label>
              <input
                type="text"
                value={supplierTaxId}
                onChange={(e) => setSupplierTaxId(e.target.value)}
                placeholder="e.g. DE814670600"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('expenses.category')}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none"
              >
                <option value="SOFTWARE">Software & Cloud</option>
                <option value="OPERATIONAL">Operaciones</option>
                <option value="MARKETING">Marketing & Publicidad</option>
                <option value="TRAVEL">Viajes & Dietas</option>
                <option value="OFFICE">Oficina & Suministros</option>
                <option value="UTILITIES">Suministros (Luz/Internet)</option>
                <option value="LEGAL">Asesoría Legal / Fiscal</option>
                <option value="OTHER">Otros Gastos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('expenses.date')}
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none"
              />
            </div>
          </div>

          {/* Tax & Amounts calculation */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('expenses.subtotal')} (€) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={subtotal}
                onChange={(e) => setSubtotal(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                IVA (%)
              </label>
              <select
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-semibold outline-none"
              >
                <option value={21}>21% (General)</option>
                <option value={10}>10% (Reducido)</option>
                <option value={4}>4% (Superreducido)</option>
                <option value={0}>0% (Exento / Intracomunitario)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('expenses.total')} (€)
              </label>
              <div className="px-3 py-2 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold">
                {total.toFixed(2)} €
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('expenses.paymentMethod')}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none"
              >
                <option value="BANK_TRANSFER">{t('expenses.bankTransfer')}</option>
                <option value="CREDIT_CARD">{t('expenses.creditCard')}</option>
                <option value="DIRECT_DEBIT">{t('expenses.directDebit')}</option>
                <option value="CASH">{t('expenses.cash')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('expenses.status')}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none"
              >
                <option value="PAID">{t('expenses.statusPaid')}</option>
                <option value="PENDING">{t('expenses.statusPending')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('expenses.notes')}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('expenses.notesPlaceholder')}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 shadow-sm"
            >
              {submitting ? t('common.saving') : t('expenses.saveExpense')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
