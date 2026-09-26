import React from 'react';
import { useTranslation } from '../../context/LanguageContext';

export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  channel: string;
  contactId?: string;
  contact?: { id: string; firstName: string; lastName: string; email: string };
  companyId?: string;
  company?: { id: string; name: string };
  assignedToId?: string;
  assignedTo?: { id: string; name: string; email: string };
  slaDueAt?: string;
  firstResponseAt?: string;
  resolvedAt?: string;
  messages?: Array<{
    id: string;
    senderType: string;
    senderName: string;
    message: string;
    isInternal: boolean;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface TicketListTableProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
}

export const TicketListTable: React.FC<TicketListTableProps> = ({ tickets, onSelectTicket }) => {
  const { t } = useTranslation();

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900">{t('tickets.priorityUrgent')}</span>;
      case 'HIGH':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900">{t('tickets.priorityHigh')}</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900">{t('tickets.priorityMedium')}</span>;
      case 'LOW':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{t('tickets.priorityLow')}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">{t('tickets.statusOpen')}</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400">{t('tickets.statusInProgress')}</span>;
      case 'WAITING_CUSTOMER':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">{t('tickets.statusWaitingCustomer')}</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400">{t('tickets.statusResolved')}</span>;
      case 'CLOSED':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">{t('tickets.statusClosed')}</span>;
    }
  };

  const formatSla = (slaDueAt?: string, status?: string) => {
    if (!slaDueAt || ['RESOLVED', 'CLOSED'].includes(status || '')) {
      return <span className="text-slate-400 dark:text-slate-500 text-xs">-</span>;
    }
    const diff = new Date(slaDueAt).getTime() - Date.now();
    const hours = Math.round(diff / (1000 * 3600));
    if (diff < 0) {
      return <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded animate-pulse">{t('tickets.slaBreached')} ({Math.abs(hours)}h)</span>;
    }
    return <span className="text-xs font-medium text-amber-600 dark:text-amber-400">{hours}h {t('tickets.remaining')}</span>;
  };

  if (tickets.length === 0) {
    return (
      <div className="py-16 text-center text-slate-400 dark:text-slate-500">
        <p className="text-base">{t('tickets.noTicketsFound')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
            <th className="py-3.5 px-4">{t('tickets.ticketNumber')}</th>
            <th className="py-3.5 px-4">{t('tickets.title')}</th>
            <th className="py-3.5 px-4">{t('tickets.customer')}</th>
            <th className="py-3.5 px-4">{t('tickets.priority')}</th>
            <th className="py-3.5 px-4">{t('tickets.status')}</th>
            <th className="py-3.5 px-4">{t('tickets.slaDeadline')}</th>
            <th className="py-3.5 px-4">{t('tickets.assignedTo')}</th>
            <th className="py-3.5 px-4 text-right">{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {tickets.map((ticket) => (
            <tr
              key={ticket.id}
              onClick={() => onSelectTicket(ticket)}
              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition"
            >
              <td className="py-3 px-4 font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                {ticket.ticketNumber}
              </td>
              <td className="py-3 px-4 font-medium text-slate-900 dark:text-white max-w-xs truncate">
                {ticket.title}
              </td>
              <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                {ticket.company?.name || (ticket.contact ? `${ticket.contact.firstName} ${ticket.contact.lastName}` : '-')}
              </td>
              <td className="py-3 px-4">{getPriorityBadge(ticket.priority)}</td>
              <td className="py-3 px-4">{getStatusBadge(ticket.status)}</td>
              <td className="py-3 px-4">{formatSla(ticket.slaDueAt, ticket.status)}</td>
              <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-xs">
                {ticket.assignedTo?.name || <span className="text-slate-400">{t('tickets.unassigned')}</span>}
              </td>
              <td className="py-3 px-4 text-right">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTicket(ticket);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-900/50 transition"
                >
                  {t('tickets.viewChat')} →
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
