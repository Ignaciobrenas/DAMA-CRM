import React, { useState } from 'react';
import { Ticket } from './TicketListTable';
import { useTranslation } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

interface TicketDetailDrawerProps {
  ticket: Ticket | null;
  onClose: () => void;
  onTicketUpdated: (updatedTicket: Ticket) => void;
}

export const TicketDetailDrawer: React.FC<TicketDetailDrawerProps> = ({
  ticket,
  onClose,
  onTicketUpdated,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);

  if (!ticket) return null;

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setSending(true);
    try {
      const res = await api.post(`/tickets/${ticket.id}/messages`, {
        message: replyMessage,
        isInternal,
      });

      if (res.data?.success) {
        toast.success(isInternal ? t('tickets.internalNoteSaved') : t('tickets.replySent'));
        setReplyMessage('');
        setIsInternal(false);

        // Fetch refreshed ticket
        const refRes = await api.get(`/tickets/${ticket.id}`);
        if (refRes.data?.success) {
          onTicketUpdated(refRes.data.data);
        }
      }
    } catch (err: any) {
      toast.error(t('tickets.sendError'));
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await api.patch(`/tickets/${ticket.id}`, { status: newStatus });
      if (res.data?.success) {
        toast.success(t('tickets.statusUpdated'));
        onTicketUpdated(res.data.data);
      }
    } catch (err) {
      toast.error(t('tickets.updateError'));
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    try {
      const res = await api.patch(`/tickets/${ticket.id}`, { priority: newPriority });
      if (res.data?.success) {
        toast.success(t('tickets.priorityUpdated'));
        onTicketUpdated(res.data.data);
      }
    } catch (err) {
      toast.error(t('tickets.updateError'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-slide-left">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                {ticket.ticketNumber}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {ticket.category}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {ticket.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {ticket.company?.name || (ticket.contact ? `${ticket.contact.firstName} ${ticket.contact.lastName}` : '')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Status & Priority Controls Toolbar */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/40 flex items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-500 dark:text-slate-400">{t('tickets.status')}:</span>
            <select
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium outline-none"
            >
              <option value="OPEN">{t('tickets.statusOpen')}</option>
              <option value="IN_PROGRESS">{t('tickets.statusInProgress')}</option>
              <option value="WAITING_CUSTOMER">{t('tickets.statusWaitingCustomer')}</option>
              <option value="RESOLVED">{t('tickets.statusResolved')}</option>
              <option value="CLOSED">{t('tickets.statusClosed')}</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-500 dark:text-slate-400">{t('tickets.priority')}:</span>
            <select
              value={ticket.priority}
              onChange={(e) => handlePriorityChange(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium outline-none"
            >
              <option value="LOW">{t('tickets.priorityLow')}</option>
              <option value="MEDIUM">{t('tickets.priorityMedium')}</option>
              <option value="HIGH">{t('tickets.priorityHigh')}</option>
              <option value="URGENT">{t('tickets.priorityUrgent')}</option>
            </select>
          </div>
        </div>

        {/* Conversation Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {/* Initial Ticket Description */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {ticket.contact ? `${ticket.contact.firstName} ${ticket.contact.lastName}` : t('tickets.customer')}
              </span>
              <span>{new Date(ticket.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>

          {/* Messages Timeline */}
          {ticket.messages && ticket.messages.map((msg) => {
            const isInternalNote = msg.isInternal;

            return (
              <div
                key={msg.id}
                className={`p-4 rounded-xl border transition ${
                  isInternalNote
                    ? 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/60 text-amber-950 dark:text-amber-100 shadow-xs'
                    : msg.senderType === 'AGENT'
                    ? 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 text-slate-900 dark:text-white ml-6'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white mr-6'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold">
                      {msg.senderName}
                    </span>
                    {isInternalNote && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                        🔒 {t('tickets.confidentialInternalNote')}
                      </span>
                    )}
                    {msg.senderType === 'AGENT' && !isInternalNote && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                        {t('tickets.agent')}
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 text-[11px]">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">
                  {msg.message}
                </p>
              </div>
            );
          })}
        </div>

        {/* Reply Box */}
        <form onSubmit={handleSendReply} className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
              />
              <span className={isInternal ? 'text-amber-600 dark:text-amber-400 font-bold' : ''}>
                🔒 {t('tickets.postAsInternalNote')}
              </span>
            </label>
          </div>

          <textarea
            required
            rows={3}
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            placeholder={
              isInternal
                ? t('tickets.internalNotePlaceholder')
                : t('tickets.publicReplyPlaceholder')
            }
            className={`w-full p-3 rounded-xl border text-sm outline-none transition ${
              isInternal
                ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 text-amber-950 dark:text-white focus:ring-2 focus:ring-amber-400'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500'
            }`}
          />

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={sending || !replyMessage.trim()}
              className={`px-4 py-2 text-sm font-semibold rounded-xl text-white transition disabled:opacity-50 shadow-sm ${
                isInternal
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {sending ? t('common.sending') : isInternal ? t('tickets.saveInternalNote') : t('tickets.sendReply')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
