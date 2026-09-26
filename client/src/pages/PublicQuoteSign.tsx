import React, { useState, useEffect } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { api } from '../services/api';
import { LoadingScreen } from '../components/common/Loading';
import { QuoteSignModal } from '../components/invoicing/QuoteSignModal';

export const PublicQuoteSign: React.FC = () => {
  const token = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : '';
  const { t } = useTranslation();
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSignModal, setShowSignModal] = useState(false);

  const fetchQuote = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.get(`/invoices/quotes/public/${token}`);
      if (res.data?.success) {
        setQuote(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('quotes.quoteNotFound'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, [token]);

  if (loading) {
    return <LoadingScreen message={t('common.loading')} />;
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <div className="p-8 max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl text-center">
          <span className="text-4xl block mb-3">⚠️</span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {t('quotes.invalidQuoteLink')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            {error || t('quotes.quoteNotFound')}
          </p>
        </div>
      </div>
    );
  }

  const isAccepted = quote.status === 'ACCEPTED' || Boolean(quote.signatureData);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        {/* Main Document Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
          {/* Header */}
          <div
            className="p-8 text-white relative overflow-hidden"
            style={{ backgroundColor: quote.branding?.primaryColor || '#072053' }}
          >
            <div className="flex items-start justify-between relative z-10 gap-4">
              <div>
                <span className="text-xs uppercase tracking-widest font-bold opacity-80 block mb-1">
                  {t('quotes.formalProposal')}
                </span>
                <h1 className="text-2xl sm:text-3xl font-black">
                  {quote.quoteNumber}
                </h1>
                <p className="text-sm opacity-90 mt-1">
                  {quote.branding?.companyName || 'DAMA Enterprise'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs opacity-75 block">{t('quotes.total')}</span>
                <span className="text-2xl sm:text-3xl font-black">
                  {quote.total.toFixed(2)} {quote.currency || '€'}
                </span>
              </div>
            </div>
          </div>

          {/* Client & Date Info */}
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/50 dark:bg-slate-800/20 text-sm">
            <div>
              <span className="text-xs font-bold uppercase text-slate-400 block mb-1">
                {t('quotes.issuedTo')}
              </span>
              <p className="font-bold text-slate-900 dark:text-white">
                {quote.company?.name || `${quote.contact?.firstName || ''} ${quote.contact?.lastName || ''}`.trim() || 'Cliente'}
              </p>
              {quote.contact?.email && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{quote.contact.email}</p>
              )}
            </div>

            <div>
              <span className="text-xs font-bold uppercase text-slate-400 block mb-1">
                {t('quotes.dates')}
              </span>
              <p className="text-slate-700 dark:text-slate-300">
                {t('quotes.issueDate')}: <strong>{new Date(quote.issueDate).toLocaleDateString()}</strong>
              </p>
              {quote.expiryDate && (
                <p className="text-slate-700 dark:text-slate-300">
                  {t('quotes.validUntil')}: <strong>{new Date(quote.expiryDate).toLocaleDateString()}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="p-8 space-y-6">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-xs uppercase font-semibold">
                  <th className="pb-3">{t('quotes.description')}</th>
                  <th className="pb-3 text-center">{t('quotes.qty')}</th>
                  <th className="pb-3 text-right">{t('quotes.unitPrice')}</th>
                  <th className="pb-3 text-right">{t('quotes.amount')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {quote.items?.map((item: any) => (
                  <tr key={item.id} className="py-3">
                    <td className="py-3.5 font-medium text-slate-900 dark:text-white">{item.description}</td>
                    <td className="py-3.5 text-center text-slate-600 dark:text-slate-300">{item.quantity}</td>
                    <td className="py-3.5 text-right text-slate-600 dark:text-slate-300">{item.unitPrice.toFixed(2)} €</td>
                    <td className="py-3.5 text-right font-bold text-slate-900 dark:text-white">{item.amount.toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals Breakdown */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex justify-end">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>{t('quotes.subtotal')}:</span>
                  <span className="font-semibold">{quote.subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>IVA ({quote.taxRate}%):</span>
                  <span className="font-semibold">{quote.taxAmount.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-2">
                  <span>{t('quotes.total')}:</span>
                  <span>{quote.total.toFixed(2)} {quote.currency || '€'}</span>
                </div>
              </div>
            </div>

            {quote.notes && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold block mb-1">{t('quotes.notes')}:</span>
                {quote.notes}
              </div>
            )}
          </div>

          {/* Signature Action Footer */}
          <div className="p-8 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800">
            {isAccepted ? (
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-center space-y-3">
                <span className="text-3xl block">✅</span>
                <h3 className="text-base font-bold text-emerald-800 dark:text-emerald-300">
                  {t('quotes.quoteAcceptedAndSigned')}
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  {t('quotes.signedBy')}: <strong>{quote.signedBy || 'Cliente'}</strong> • {new Date(quote.signedAt || quote.updatedAt).toLocaleString()}
                </p>
                {quote.signatureData && (
                  <div className="pt-2">
                    <img
                      src={quote.signatureData}
                      alt="Digital Signature"
                      className="h-16 mx-auto bg-white dark:bg-slate-800 rounded-lg p-2 border border-emerald-200 dark:border-emerald-800 shadow-xs"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {t('quotes.readyToAccept')}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('quotes.signOnlineDesc')}
                  </p>
                </div>
                <button
                  onClick={() => setShowSignModal(true)}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0 text-sm"
                >
                  ✍️ {t('quotes.signAndAcceptAction')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      <QuoteSignModal
        isOpen={showSignModal}
        onClose={() => setShowSignModal(false)}
        quoteId={quote.id}
        quoteNumber={quote.quoteNumber}
        total={quote.total}
        publicToken={quote.publicToken || token}
        onSignedSuccess={() => {
          fetchQuote();
        }}
      />
    </div>
  );
};

export default PublicQuoteSign;
