import React, { useState, useEffect } from 'react';
import {
  Lock,
  X,
  UserCheck,
  CheckCircle2,
  RotateCcw,
  Trash2,
  Send,
  Clock,
  AlertTriangle,
  User as UserIcon,
} from 'lucide-react';
import { Ticket } from './TicketListTable';
import { useTranslation } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

interface TicketDetailDrawerProps {
  ticket: Ticket | null;
  onClose: () => void;
  onTicketUpdated: (updatedTicket: Ticket) => void;
  onTicketDeleted?: (ticketId: string) => void;
}

export const TicketDetailDrawer: React.FC<TicketDetailDrawerProps> = ({
  ticket,
  onClose,
  onTicketUpdated,
  onTicketDeleted,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const { user, hasPermission } = useAuth();

  const [replyMessage, setReplyMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [agents, setAgents] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (ticket) {
      api.get('/users').then((res: any) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setAgents(res.data.data);
        } else if (res.success && Array.isArray(res.data)) {
          setAgents(res.data);
        } else if (Array.isArray(res)) {
          setAgents(res);
        }
      }).catch(() => {});
    }
  }, [ticket?.id]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteConfirm) setShowDeleteConfirm(false);
        else if (ticket) onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [ticket, showDeleteConfirm, onClose]);

  if (!ticket) return null;

  const canDelete = hasPermission('tickets', 'delete') || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyMessage.trim()) return;

    setSending(true);
    try {
      const res: any = await api.post(`/tickets/${ticket.id}/messages`, {
        message: replyMessage,
        isInternal,
      });

      if (res.success || res.data?.success) {
        toast.success(isInternal ? t('tickets.internalNoteSaved') : t('tickets.replySent'));
        setReplyMessage('');
        setIsInternal(false);

        // Fetch refreshed ticket
        const refRes: any = await api.get(`/tickets/${ticket.id}`);
        if (refRes.success && refRes.data) {
          onTicketUpdated(refRes.data);
        } else if (refRes.data?.success) {
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
      const res: any = await api.patch(`/tickets/${ticket.id}`, { status: newStatus });
      if (res.success || res.data?.success) {
        toast.success(t('tickets.statusUpdated'));
        // Fetch refreshed ticket to get system messages
        const refRes: any = await api.get(`/tickets/${ticket.id}`);
        if (refRes.success && refRes.data) {
          onTicketUpdated(refRes.data);
        } else if (refRes.data?.success) {
          onTicketUpdated(refRes.data.data);
        } else {
          onTicketUpdated(res.data?.data || res.data);
        }
      }
    } catch (err) {
      toast.error(t('tickets.updateError'));
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    try {
      const res: any = await api.patch(`/tickets/${ticket.id}`, { priority: newPriority });
      if (res.success || res.data?.success) {
        toast.success(t('tickets.priorityUpdated'));
        onTicketUpdated(res.data?.data || res.data);
      }
    } catch (err) {
      toast.error(t('tickets.updateError'));
    }
  };

  const handleAssigneeChange = async (newAssigneeId: string) => {
    try {
      const res: any = await api.patch(`/tickets/${ticket.id}`, {
        assignedToId: newAssigneeId ? newAssigneeId : null,
      });
      if (res.success || res.data?.success) {
        toast.success(t('tickets.assignedSuccess', 'Asignación actualizada'));
        const refRes: any = await api.get(`/tickets/${ticket.id}`);
        if (refRes.success && refRes.data) {
          onTicketUpdated(refRes.data);
        } else if (refRes.data?.success) {
          onTicketUpdated(refRes.data.data);
        } else {
          onTicketUpdated(res.data?.data || res.data);
        }
      }
    } catch (err) {
      toast.error(t('tickets.updateError'));
    }
  };

  const handleAssignToMe = () => {
    if (user?.id) {
      handleAssigneeChange(user.id);
    }
  };

  const handleDeleteTicket = async () => {
    setDeleting(true);
    try {
      const res: any = await api.delete(`/tickets/${ticket.id}`);
      if (res.success || res.data?.success) {
        toast.success(t('tickets.deletedSuccess', 'Ticket eliminado correctamente'));
        setShowDeleteConfirm(false);
        onClose();
        if (onTicketDeleted) {
          onTicketDeleted(ticket.id);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('tickets.deleteError', 'Error al eliminar ticket'));
    } finally {
      setDeleting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const getSlaIndicator = () => {
    if (!ticket.slaDueAt || ['RESOLVED', 'CLOSED'].includes(ticket.status)) {
      return null;
    }
    const diff = new Date(ticket.slaDueAt).getTime() - Date.now();
    const hours = Math.round(diff / (1000 * 3600));
    if (diff < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-md animate-pulse border border-red-200 dark:border-red-900">
          <Clock className="w-3 h-3" />
          {t('tickets.slaBreached')} ({Math.abs(hours)}h)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900">
        <Clock className="w-3 h-3" />
        {hours}h {t('tickets.remaining')}
      </span>
    );
  };

  const isAssignedToCurrentUser = user && ticket.assignedToId === user.id;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 m-auto bg-black/50 backdrop-blur-xs animate-fade-in"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Detalle del ticket ${ticket.ticketNumber}`}
          data-testid="ticket-detail-modal"
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl m-auto bg-white dark:bg-slate-900 max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                  {ticket.ticketNumber}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {ticket.category}
                </span>
                {getSlaIndicator()}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {ticket.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {ticket.company?.name || (ticket.contact ? `${ticket.contact.firstName} ${ticket.contact.lastName}` : '')}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {canDelete && (
                <button
                  type="button"
                  aria-label="Eliminar ticket"
                  onClick={() => setShowDeleteConfirm(true)}
                  title={t('tickets.deleteTicket')}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                aria-label="Cerrar detalle del ticket"
                data-testid="ticket-detail-close-btn"
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Action & Controls Toolbar */}
          <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/40 flex flex-wrap items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Status Select */}
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-slate-500 dark:text-slate-400">{t('tickets.status')}:</span>
                <select
                  aria-label="Estado del ticket"
                  data-testid="ticket-detail-status-select"
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

              {/* Priority Select */}
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-slate-500 dark:text-slate-400">{t('tickets.priority')}:</span>
                <select
                  aria-label="Prioridad del ticket"
                  data-testid="ticket-detail-priority-select"
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

            {/* Quick Status Buttons */}
            <div className="flex items-center gap-2">
              {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                <button
                  type="button"
                  data-testid="ticket-detail-resolve-btn"
                  onClick={() => handleStatusChange('RESOLVED')}
                  className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 font-semibold transition flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t('tickets.resolveAction')}</span>
                </button>
              )}
              {ticket.status === 'RESOLVED' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleStatusChange('CLOSED')}
                    className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 font-semibold transition"
                  >
                    {t('tickets.closeAction')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange('OPEN')}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 font-semibold transition flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t('tickets.reopenAction')}</span>
                  </button>
                </>
              )}
              {ticket.status === 'CLOSED' && (
                <button
                  type="button"
                  onClick={() => handleStatusChange('OPEN')}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 font-semibold transition flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t('tickets.reopenAction')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Assignee Toolbar */}
          <div className="px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>{t('tickets.assignedTo')}:</span>
              </span>
              <select
                aria-label="Agente asignado"
                value={ticket.assignedToId || ''}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium outline-none text-xs"
              >
                <option value="">{t('tickets.unassigned')}</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} {user && agent.id === user.id ? `(${t('tickets.assignedToYou')})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {user && !isAssignedToCurrentUser && (
              <button
                type="button"
                onClick={handleAssignToMe}
                className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 font-semibold transition flex items-center gap-1 text-xs"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{t('tickets.assignToMe')}</span>
              </button>
            )}
          </div>

          {/* Conversation Body */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {/* Initial Ticket Description */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {ticket.contact ? `${ticket.contact.firstName} ${ticket.contact.lastName}` : t('tickets.customer')}
                </span>
                <span>{new Date(ticket.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </p>
            </div>

            {/* Resolved Notice */}
            {ticket.resolvedAt && (
              <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900 flex items-center gap-2 text-xs text-teal-800 dark:text-teal-300">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>
                  <strong>{t('tickets.statusResolved')}:</strong> {new Date(ticket.resolvedAt).toLocaleString()}
                </span>
              </div>
            )}

            {/* Messages Timeline */}
            {ticket.messages && ticket.messages.map((msg) => {
              const isInternalNote = msg.isInternal;
              const isSystem = msg.senderType === 'SYSTEM';

              if (isSystem) {
                return (
                  <div key={msg.id} className="py-1 text-center">
                    <span className="inline-block px-3 py-1 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {msg.message}
                    </span>
                  </div>
                );
              }

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
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                          <Lock className="w-3 h-3" />
                          <span>{t('tickets.confidentialInternalNote')}</span>
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
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.message}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Reply Box */}
          <form onSubmit={handleSendReply} className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 select-none">
                <input
                  type="checkbox"
                  aria-label="Publicar como nota interna confidencial"
                  data-testid="ticket-detail-internal-checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                />
                <span className={`flex items-center gap-1 ${isInternal ? 'text-amber-600 dark:text-amber-400 font-bold' : ''}`}>
                  <Lock className="w-3 h-3" />
                  <span>{t('tickets.postAsInternalNote')}</span>
                </span>
              </label>

              <span className="text-[11px] text-slate-400 hidden sm:inline">
                {t('tickets.pressCtrlEnter')}
              </span>
            </div>

            <textarea
              required
              rows={3}
              aria-label="Mensaje de respuesta o nota interna"
              data-testid="ticket-detail-reply-input"
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              onKeyDown={handleKeyDown}
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
                data-testid="ticket-detail-send-btn"
                disabled={sending || !replyMessage.trim()}
                className={`px-4 py-2 text-sm font-semibold rounded-xl text-white transition disabled:opacity-50 shadow-sm flex items-center gap-1.5 ${
                  isInternal
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {sending
                    ? t('common.sending')
                    : isInternal
                    ? t('tickets.saveInternalNote')
                    : t('tickets.sendReply')}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal (Strictly Centered) */}
      {showDeleteConfirm && (
        <div
          onClick={() => setShowDeleteConfirm(false)}
          className="fixed inset-0 z-60 flex items-center justify-center p-4 m-auto bg-black/60 backdrop-blur-xs animate-fade-in"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirmar eliminación de ticket"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md m-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl animate-scale-up"
          >
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-3">
              <div className="p-2.5 rounded-full bg-red-100 dark:bg-red-950/60">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('tickets.deleteTicket')}
              </h4>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              {t('tickets.confirmDelete')}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {t('common.cancel', 'Cancelar')}
              </button>
              <button
                type="button"
                onClick={handleDeleteTicket}
                disabled={deleting}
                className="px-4 py-2 text-sm font-semibold rounded-xl text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition shadow-sm"
              >
                {deleting ? t('common.deleting', 'Eliminando...') : t('common.delete', 'Eliminar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
