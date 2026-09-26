import React from 'react';
import { Ticket } from './TicketListTable';
import { useTranslation } from '../../context/LanguageContext';

interface TicketKanbanBoardProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onUpdateStatus: (ticketId: string, newStatus: string) => void;
}

const COLUMNS = [
  { key: 'OPEN', labelKey: 'tickets.statusOpen', border: 'border-emerald-500', bg: 'bg-emerald-500/10' },
  { key: 'IN_PROGRESS', labelKey: 'tickets.statusInProgress', border: 'border-indigo-500', bg: 'bg-indigo-500/10' },
  { key: 'WAITING_CUSTOMER', labelKey: 'tickets.statusWaitingCustomer', border: 'border-purple-500', bg: 'bg-purple-500/10' },
  { key: 'RESOLVED', labelKey: 'tickets.statusResolved', border: 'border-teal-500', bg: 'bg-teal-500/10' },
  { key: 'CLOSED', labelKey: 'tickets.statusClosed', border: 'border-slate-500', bg: 'bg-slate-500/10' },
];

export const TicketKanbanBoard: React.FC<TicketKanbanBoardProps> = ({
  tickets,
  onSelectTicket,
  onUpdateStatus,
}) => {
  const { t } = useTranslation();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, statusKey: string) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData('ticketId');
    if (ticketId) {
      onUpdateStatus(ticketId, statusKey);
    }
  };

  const handleDragStart = (e: React.DragEvent, ticketId: string) => {
    e.dataTransfer.setData('ticketId', ticketId);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const columnTickets = tickets.filter((t) => t.status === col.key);

        return (
          <div
            key={col.key}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.key)}
            className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-200 dark:border-slate-800 flex flex-col min-h-[500px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${col.border.replace('border', 'bg')}`} />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t(col.labelKey)}
                </span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-400">
                {columnTickets.length}
              </span>
            </div>

            {/* Tickets list */}
            <div className="space-y-3 flex-1">
              {columnTickets.map((ticket) => {
                const isUrgent = ticket.priority === 'URGENT';
                const isHigh = ticket.priority === 'HIGH';

                return (
                  <div
                    key={ticket.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, ticket.id)}
                    onClick={() => onSelectTicket(ticket)}
                    className={`p-3.5 rounded-lg border bg-white dark:bg-slate-800/90 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition ${
                      isUrgent
                        ? 'border-red-400 dark:border-red-800/80 ring-1 ring-red-400/30'
                        : isHigh
                        ? 'border-amber-300 dark:border-amber-700'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {ticket.ticketNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isUrgent
                            ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                            : isHigh
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {ticket.priority}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 mb-2">
                      {ticket.title}
                    </h4>

                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate mb-2">
                      {ticket.company?.name || (ticket.contact ? `${ticket.contact.firstName} ${ticket.contact.lastName}` : '')}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                      <span>💬 {ticket.messages?.length || 0}</span>
                      <span className="font-medium text-slate-600 dark:text-slate-300 truncate max-w-[90px]">
                        {ticket.assignedTo?.name || t('tickets.unassigned')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
