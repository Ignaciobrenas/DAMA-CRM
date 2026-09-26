import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

interface AgingReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentRecorded: () => void;
}

export const AgingReportModal: React.FC<AgingReportModalProps> = ({
  isOpen,
  onClose,
  onPaymentRecorded,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Partial payment inline state
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payNotes, setPayNotes] = useState('');
  const [paying, setPaying] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/invoices/aging/report');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      toast.error(t('dunning.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReport();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRecordPayment = async (invoiceId: string) => {
    if (payAmount === '' || payAmount <= 0) {
      toast.error(t('dunning.enterValidAmount'));
      return;
    }

    setPaying(true);
    try {
      const res = await api.post(`/invoices/${invoiceId}/payments`, {
        amount: payAmount,
        notes: payNotes,
      });

      if (res.data?.success) {
        toast.success(res.data.message);
        setSelectedInvoiceId(null);
        setPayAmount('');
        setPayNotes('');
        fetchReport();
        onPaymentRecorded();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('dunning.paymentError'));
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              📊 {t('dunning.agingReportTitle')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('dunning.agingReportSubtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              {t('common.loading')}
            </div>
          ) : data ? (
            <>
              {/* Aging Buckets KPI Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                    {t('dunning.bucketCurrent')}
                  </span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                    {data.summary.current.toFixed(2)} €
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 block">
                    1 - 30 {t('dunning.days')}
                  </span>
                  <span className="text-lg font-bold text-amber-700 dark:text-amber-400 mt-1 block">
                    {data.summary.days1_30.toFixed(2)} €
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40">
                  <span className="text-[11px] font-semibold text-orange-700 dark:text-orange-400 block">
                    31 - 60 {t('dunning.days')}
                  </span>
                  <span className="text-lg font-bold text-orange-700 dark:text-orange-400 mt-1 block">
                    {data.summary.days31_60.toFixed(2)} €
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
                  <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 block">
                    61 - 90 {t('dunning.days')}
                  </span>
                  <span className="text-lg font-bold text-rose-700 dark:text-rose-400 mt-1 block">
                    {data.summary.days61_90.toFixed(2)} €
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-900">
                  <span className="text-[11px] font-semibold text-red-700 dark:text-red-400 block">
                    &gt; 90 {t('dunning.days')}
                  </span>
                  <span className="text-lg font-bold text-red-600 dark:text-red-400 mt-1 block">
                    {data.summary.days90Plus.toFixed(2)} €
                  </span>
                </div>
              </div>

              {/* Invoices with Overdue Balances */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t('dunning.overdueInvoicesTitle')} ({data.invoices.length})
                </h4>

                {data.invoices.length === 0 ? (
                  <p className="text-sm text-slate-400 py-6 text-center">
                    🎉 {t('dunning.noOverdueInvoices')}
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                    {data.invoices.map((inv: any) => {
                      const isSelected = selectedInvoiceId === inv.id;

                      return (
                        <div key={inv.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                                  {inv.invoiceNumber}
                                </span>
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                  {inv.clientName}
                                </span>
                                {inv.daysOverdue > 0 && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400">
                                    {inv.daysOverdue} {t('dunning.daysOverdue')}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 mt-1">
                                {t('dunning.total')}: {inv.total.toFixed(2)} € • {t('dunning.paid')}: {inv.paidAmount.toFixed(2)} €
                              </div>
                            </div>

                            <div className="text-right flex items-center gap-3">
                              <div>
                                <span className="text-xs text-slate-400 block">{t('dunning.pendingBalance')}</span>
                                <span className="text-base font-bold text-slate-900 dark:text-white">
                                  {inv.remainingBalance.toFixed(2)} €
                                </span>
                              </div>

                              <button
                                onClick={() => {
                                  setSelectedInvoiceId(isSelected ? null : inv.id);
                                  setPayAmount(inv.remainingBalance);
                                }}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 transition"
                              >
                                {isSelected ? t('common.cancel') : '+ ' + t('dunning.recordPayment')}
                              </button>
                            </div>
                          </div>

                          {/* Inline Payment Form */}
                          {isSelected && (
                            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 animate-slide-down">
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={inv.remainingBalance}
                                value={payAmount}
                                onChange={(e) => setPayAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                placeholder="0.00"
                                className="w-32 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold outline-none"
                              />
                              <input
                                type="text"
                                value={payNotes}
                                onChange={(e) => setPayNotes(e.target.value)}
                                placeholder={t('dunning.paymentNotesPlaceholder')}
                                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none"
                              />
                              <button
                                onClick={() => handleRecordPayment(inv.id)}
                                disabled={paying}
                                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50"
                              >
                                {paying ? t('common.saving') : t('dunning.savePayment')}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
