import React, { useState, useEffect } from 'react';
import { X, PlusCircle } from 'lucide-react';
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
  const [receiptUrl, setReceiptUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Keyboard accessibility: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sub = typeof subtotal === 'number' ? subtotal : 0;
  const taxAmount = Number(((sub * taxRate) / 100).toFixed(2));
  const total = Number((sub + taxAmount).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim() || subtotal === '' || subtotal <= 0) {
      toast.error(t('expenses.requiredFields', 'El proveedor y el importe son obligatorios'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/expenses', {
        supplierName: supplierName.trim(),
        supplierTaxId: supplierTaxId.trim() || null,
        category,
        subtotal: sub,
        taxRate,
        issueDate,
        paymentMethod,
        status,
        notes: notes.trim() || null,
        receiptUrl: receiptUrl.trim() || null,
      });

      if (res.data?.success || res.success) {
        toast.success(t('expenses.expenseCreated', 'Gasto registrado correctamente'));
        onExpenseCreated();
        onClose();
        setSupplierName('');
        setSupplierTaxId('');
        setSubtotal('');
        setNotes('');
        setReceiptUrl('');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('expenses.createError', 'Error al registrar gasto'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 m-auto bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-expense-modal-title"
      data-testid="modal-new-expense"
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 id="new-expense-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
                {t('expenses.newExpense', 'Nuevo Gasto')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registra una factura recibida, cuota de IVA soportado y método de pago
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            data-testid="btn-close-modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="new-supplier-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('expenses.supplierName', 'Razón Social Proveedor')} *
              </label>
              <input
                id="new-supplier-name"
                data-testid="input-supplier-name"
                type="text"
                required
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="e.g. Hetzner Cloud GmbH"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="new-supplier-tax-id" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('expenses.supplierTaxId', 'NIF / CIF Proveedor')}
              </label>
              <input
                id="new-supplier-tax-id"
                data-testid="input-supplier-tax-id"
                type="text"
                value={supplierTaxId}
                onChange={(e) => setSupplierTaxId(e.target.value)}
                placeholder="e.g. DE814670600"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="new-expense-category" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('expenses.category', 'Categoría')}
              </label>
              <select
                id="new-expense-category"
                data-testid="select-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none cursor-pointer"
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
              <label htmlFor="new-expense-date" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('expenses.date', 'Fecha')}
              </label>
              <input
                id="new-expense-date"
                data-testid="input-issue-date"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Tax & Amounts calculation */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="new-expense-subtotal" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('expenses.subtotal', 'Base Imponible')} (€) *
              </label>
              <input
                id="new-expense-subtotal"
                data-testid="input-subtotal"
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
              <label htmlFor="new-expense-tax-rate" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                IVA (%)
              </label>
              <select
                id="new-expense-tax-rate"
                data-testid="select-tax-rate"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-semibold outline-none cursor-pointer"
              >
                <option value={21}>21% (General)</option>
                <option value={10}>10% (Reducido)</option>
                <option value={4}>4% (Superreducido)</option>
                <option value={0}>0% (Exento / Intracomunitario)</option>
              </select>
            </div>

            <div>
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('expenses.total', 'Total')} (€)
              </span>
              <div data-testid="display-total" className="px-3 py-2 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold flex items-center h-[38px]">
                {total.toFixed(2)} €
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="new-expense-payment-method" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('expenses.paymentMethod', 'Forma de Pago')}
              </label>
              <select
                id="new-expense-payment-method"
                data-testid="select-payment-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none cursor-pointer"
              >
                <option value="BANK_TRANSFER">{t('expenses.bankTransfer', 'Transferencia Bancaria')}</option>
                <option value="CREDIT_CARD">{t('expenses.creditCard', 'Tarjeta de Crédito / Débito')}</option>
                <option value="DIRECT_DEBIT">{t('expenses.directDebit', 'Domiciliación Bancaria')}</option>
                <option value="CASH">{t('expenses.cash', 'Efectivo / Caja')}</option>
              </select>
            </div>

            <div>
              <label htmlFor="new-expense-status" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('expenses.status', 'Estado de Pago')}
              </label>
              <select
                id="new-expense-status"
                data-testid="select-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none cursor-pointer"
              >
                <option value="PAID">{t('expenses.statusPaid', 'Pagado')}</option>
                <option value="PENDING">{t('expenses.statusPending', 'Pendiente')}</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="new-expense-notes" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('expenses.notes', 'Concepto / Notas')}
            </label>
            <input
              id="new-expense-notes"
              data-testid="input-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('expenses.notesPlaceholder', 'e.g. Servidores de staging y base de datos PostgreSQL')}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none"
            />
          </div>

          <div>
            <label htmlFor="new-expense-receipt-url" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Comprobante / URL Factura Recibida
            </label>
            <input
              id="new-expense-receipt-url"
              data-testid="input-receipt-url"
              type="url"
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              placeholder="https://ejemplo.com/factura-proveedor.pdf"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              data-testid="btn-cancel-expense"
              className="px-4 py-2 text-sm rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {t('common.cancel', 'Cancelar')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              data-testid="btn-save-expense"
              className="px-5 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 shadow-sm cursor-pointer"
            >
              {submitting ? t('common.saving', 'Guardando...') : t('expenses.saveExpense', 'Guardar Gasto')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
