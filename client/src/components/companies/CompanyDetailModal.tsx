import React, { useState } from 'react';
import {
  X,
  Building2,
  Users,
  DollarSign,
  FileText,
  LifeBuoy,
  Globe,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ArrowRight,
  Plus,
  ExternalLink,
  Edit2,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export interface CompanyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: any | null;
  isLoading?: boolean;
  onEdit?: (company: any) => void;
  onNavigate?: (route: string) => void;
}

export const CompanyDetailModal: React.FC<CompanyDetailModalProps> = ({
  isOpen,
  onClose,
  company,
  isLoading = false,
  onEdit,
  onNavigate,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'info' | 'contacts' | 'deals' | 'invoicing' | 'tickets'>('info');

  if (!isOpen) return null;

  const navigateTo = (route: string) => {
    onClose();
    if (onNavigate) {
      onNavigate(route);
    } else {
      window.location.href = route;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="company-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 m-auto bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col m-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg shrink-0 border border-blue-100 dark:border-blue-900/50">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="company-detail-title" className="text-lg font-bold text-slate-900 dark:text-white">
                  {company?.name || 'Detalles de Empresa'}
                </h2>
                {company?.taxId && (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
                    CIF: {company.taxId}
                  </span>
                )}
                {company?.industry && (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {company.industry}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {[company?.city, company?.country].filter(Boolean).join(', ') || 'Ficha de Cliente y Ecosistema Intercomunicado'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            {onEdit && company && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(company);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Editar Empresa"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 px-4 sm:px-6 pt-2 bg-slate-50/30 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition ${
              activeTab === 'info'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{t('information') || 'Información General'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contacts')}
            className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition ${
              activeTab === 'contacts'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t('contacts') || 'Contactos'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
              {company?.contacts?.length || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('deals')}
            className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition ${
              activeTab === 'deals'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>{t('pipeline') || 'Oportunidades'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
              {company?.deals?.length || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invoicing')}
            className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition ${
              activeTab === 'invoicing'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t('invoicing') || 'Facturación & Presupuestos'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
              {(company?.invoices?.length || 0) + (company?.quotes?.length || 0)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tickets')}
            className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition ${
              activeTab === 'tickets'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>{t('tickets') || 'Tickets'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
              {company?.tickets?.length || 0}
            </span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 max-h-[60vh] space-y-4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2 text-xs text-slate-400">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Cargando datos corporativos...</span>
            </div>
          ) : !company ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No se ha seleccionado ninguna empresa.
            </div>
          ) : (
            <>
              {/* TAB: INFO */}
              {activeTab === 'info' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Facturación Estimada Anual
                      </span>
                      <p className="text-base font-bold text-slate-900 dark:text-white">
                        {company.annualRevenue
                          ? company.annualRevenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
                          : 'No especificada'}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Empleados de la Compañía
                      </span>
                      <p className="text-base font-bold text-slate-900 dark:text-white">
                        {company.employeesCount ? `${company.employeesCount} personas` : 'No registrado'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Datos de Contacto Corporativo
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {company.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                          <a href={`mailto:${company.email}`} className="text-blue-600 hover:underline truncate">
                            {company.email}
                          </a>
                        </div>
                      )}
                      {company.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                          <a href={`tel:${company.phone}`} className="text-slate-700 dark:text-slate-300 hover:underline">
                            {company.phone}
                          </a>
                        </div>
                      )}
                      {company.website && (
                        <div className="flex items-center space-x-2">
                          <Globe className="w-4 h-4 text-cyan-500 shrink-0" />
                          <a
                            href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline truncate"
                          >
                            {company.website}
                          </a>
                        </div>
                      )}
                      {(company.address || company.city) && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                          <span className="text-slate-700 dark:text-slate-300">
                            {[company.address, company.city, company.country].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {company.notes && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Notas Internas</h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{company.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: CONTACTS */}
              {activeTab === 'contacts' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Contactos y Personas de Decisión ({company.contacts?.length || 0})
                    </span>
                    <button
                      type="button"
                      onClick={() => navigateTo('/contacts')}
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nuevo Contacto</span>
                    </button>
                  </div>

                  {company.contacts && company.contacts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {company.contacts.map((contact: any) => (
                        <div
                          key={contact.id}
                          className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition flex items-center justify-between group"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {contact.firstName} {contact.lastName}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {contact.position || contact.department || 'Contacto'}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">{contact.email}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => navigateTo(`/contacts?id=${contact.id}`)}
                            className="p-1.5 rounded-lg text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 transition shrink-0"
                            title="Ver ficha de contacto"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      No hay contactos vinculados a esta empresa todavía.
                    </div>
                  )}
                </div>
              )}

              {/* TAB: DEALS */}
              {activeTab === 'deals' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Oportunidades en Pipeline ({company.deals?.length || 0})
                    </span>
                    <button
                      type="button"
                      onClick={() => navigateTo('/pipeline')}
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nueva Oportunidad</span>
                    </button>
                  </div>

                  {company.deals && company.deals.length > 0 ? (
                    <div className="space-y-2">
                      {company.deals.map((deal: any) => (
                        <div
                          key={deal.id}
                          className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition flex items-center justify-between"
                        >
                          <div>
                            <div className="text-xs font-semibold text-slate-900 dark:text-white">{deal.title}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              Fase: <strong className="text-slate-700 dark:text-slate-200">{deal.stage?.name || deal.status}</strong>
                              {deal.stage?.probability ? ` (${deal.stage.probability}%)` : ''}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {(deal.value || 0).toLocaleString('es-ES', { style: 'currency', currency: deal.currency || 'EUR' })}
                            </span>
                            <button
                              type="button"
                              onClick={() => navigateTo(`/pipeline?dealId=${deal.id}`)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 transition"
                              title="Ver en Pipeline"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      No hay oportunidades activas registradas para esta empresa.
                    </div>
                  )}
                </div>
              )}

              {/* TAB: INVOICING */}
              {activeTab === 'invoicing' && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Facturas ({company.invoices?.length || 0})
                      </span>
                      <button
                        type="button"
                        onClick={() => navigateTo('/invoicing')}
                        className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:underline"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Nueva Factura</span>
                      </button>
                    </div>
                    {company.invoices && company.invoices.length > 0 ? (
                      <div className="space-y-2">
                        {company.invoices.map((inv: any) => (
                          <div
                            key={inv.id}
                            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                          >
                            <div>
                              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                                {inv.invoiceNumber}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {new Date(inv.issueDate).toLocaleDateString('es-ES')} • Estado:{' '}
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{inv.status}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {(inv.total || 0).toLocaleString('es-ES', { style: 'currency', currency: inv.currency || 'EUR' })}
                              </span>
                              <button
                                type="button"
                                onClick={() => navigateTo(`/invoicing?invoiceId=${inv.id}`)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 transition"
                                title="Ver Factura"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                        No hay facturas emitidas a esta empresa.
                      </div>
                    )}
                  </div>

                  {company.quotes && company.quotes.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block mb-2">
                        Presupuestos ({company.quotes.length})
                      </span>
                      <div className="space-y-2">
                        {company.quotes.map((q: any) => (
                          <div
                            key={q.id}
                            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                          >
                            <div>
                              <div className="text-xs font-semibold text-slate-900 dark:text-white">{q.quoteNumber}</div>
                              <div className="text-[11px] text-slate-500">
                                {new Date(q.issueDate).toLocaleDateString('es-ES')} • {q.status}
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {(q.total || 0).toLocaleString('es-ES', { style: 'currency', currency: q.currency || 'EUR' })}
                              </span>
                              <button
                                type="button"
                                onClick={() => navigateTo(`/invoicing?quoteId=${q.id}`)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 transition"
                                title="Ver Presupuesto"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: TICKETS */}
              {activeTab === 'tickets' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Tickets de Incidencias ({company.tickets?.length || 0})
                    </span>
                    <button
                      type="button"
                      onClick={() => navigateTo('/tickets')}
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nuevo Ticket</span>
                    </button>
                  </div>

                  {company.tickets && company.tickets.length > 0 ? (
                    <div className="space-y-2">
                      {company.tickets.map((tck: any) => (
                        <div
                          key={tck.id}
                          className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                        >
                          <div>
                            <div className="text-xs font-semibold text-slate-900 dark:text-white">
                              #{tck.ticketNumber} - {tck.title}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Prioridad: <span className="font-semibold">{tck.priority}</span> • Estado:{' '}
                              <span className="font-semibold">{tck.status}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => navigateTo(`/tickets?ticketId=${tck.id}`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 transition"
                            title="Ver Ticket"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      No hay tickets de soporte abiertos para esta empresa.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-[11px] text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Datos 100% intercomunicados con CRM, Pipeline, Facturas y Helpdesk</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition"
          >
            {t('close') || 'Cerrar'}
          </button>
        </div>
      </div>
    </div>
  );
};
