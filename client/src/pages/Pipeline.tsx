import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, Building2, User, Calendar, X, AlertCircle, Search, Filter } from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiRequest } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { RecordDrawer } from '../components/crm/RecordDrawer';
import { wsClient } from '../services/websocket';
import { Modal } from '../components/common/Modal';
import { PermissionGate } from '../components/common/PermissionGate';

export const Pipeline: React.FC = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const [stages, setStages] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<any | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('');
  const [minValuePreset, setMinValuePreset] = useState<number>(0);

  // Form state
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('');
  const [companies, setCompanies] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [contactId, setContactId] = useState('');

  const loadPipeline = async () => {
    setIsLoading(true);
    const res = await apiRequest('/deals/pipeline');
    if (res.success && res.data) {
      setStages(res.data.stages);
      setSummary(res.data.summary);
      if (res.data.stages.length > 0 && !selectedStageId) {
        setSelectedStageId(res.data.stages[0].id);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadPipeline();
    apiRequest('/companies?limit=100').then((res) => {
      if (res.success) setCompanies(res.data || []);
    });
    apiRequest('/contacts?limit=100').then((res) => {
      if (res.success) setContacts(res.data || []);
    });

    const unsubUpdated = wsClient.on('deal:updated', () => {
      loadPipeline();
    });
    const unsubCreated = wsClient.on('deal:created', () => {
      loadPipeline();
    });

    return () => {
      unsubUpdated();
      unsubCreated();
    };
  }, []);

  const handleDragStart = (dealId: string) => {
    setDraggedDealId(dealId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetStageId: string) => {
    if (!draggedDealId) return;

    // Optimistic UI update
    let movedDeal: any = null;
    let targetStageName = '';

    setStages((prevStages) =>
      prevStages.map((st) => {
        if (st.id === targetStageId) targetStageName = st.name;
        const deal = st.deals.find((d: any) => d.id === draggedDealId);
        if (deal) movedDeal = deal;
        return {
          ...st,
          deals: st.deals.filter((d: any) => d.id !== draggedDealId),
        };
      }).map((st) => {
        if (st.id === targetStageId && movedDeal) {
          return {
            ...st,
            deals: [movedDeal, ...st.deals],
          };
        }
        return st;
      })
    );

    // If moved to WON stage -> trigger celebration confetti!
    if (targetStageName.toLowerCase().includes('ganada')) {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
      toast.success('¡Negocio Ganado! 🎉', 'Oportunidad cerrada satisfactoriamente');
    }

    // Server PATCH mutation
    await apiRequest(`/deals/${draggedDealId}`, {
      method: 'PATCH',
      body: JSON.stringify({ stageId: targetStageId }),
    });

    setDraggedDealId(null);
    loadPipeline();
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !selectedStageId) return;

    const res = await apiRequest('/deals', {
      method: 'POST',
      body: JSON.stringify({
        title,
        value: parseFloat(value) || 0,
        stageId: selectedStageId,
        companyId: companyId || null,
        contactId: contactId || null,
      }),
    });

    if (res.success) {
      toast.success(t('success'), t('dealCreatedSuccess'));
      setIsModalOpen(false);
      setTitle('');
      setValue('');
      setCompanyId('');
      setContactId('');
      loadPipeline();
    } else {
      toast.error(t('error'), res.message || 'Error al crear trato');
    }
  };

  const filterDeals = (deals: any[]) => {
    return deals.filter((d) => {
      if (minValuePreset > 0 && d.value < minValuePreset) return false;
      if (selectedCompanyFilter && d.companyId !== selectedCompanyFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchTitle = d.title?.toLowerCase().includes(term);
        const matchCompany = d.company?.name?.toLowerCase().includes(term);
        const matchContact = `${d.contact?.firstName || ''} ${d.contact?.lastName || ''}`.toLowerCase().includes(term);
        if (!matchTitle && !matchCompany && !matchContact) return false;
      }
      return true;
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t('pipeline')}
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {t('dragNotice')} • Total: {summary?.totalValue?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
          </p>
        </div>

        <PermissionGate resource="deals" action="create">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('newDeal')}</span>
          </button>
        </PermissionGate>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-2 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, empresa o contacto..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
          />
        </div>

        {/* Company Dropdown Filter */}
        <div className="min-w-[180px]">
          <select
            value={selectedCompanyFilter}
            onChange={(e) => setSelectedCompanyFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-700 dark:text-gray-200 focus:outline-none"
          >
            <option value="">Todas las empresas</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Min Value Presets */}
        <div className="flex items-center space-x-1">
          {[
            { label: t('all'), val: 0 },
            { label: '> 5k €', val: 5000 },
            { label: '> 20k €', val: 20000 },
            { label: '> 50k €', val: 50000 },
          ].map((preset) => (
            <button
              key={preset.val}
              onClick={() => setMinValuePreset(preset.val)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                minValuePreset === preset.val
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board Container (Horizontal Scroll for High Density & Mobile) */}
      <div className="flex space-x-3 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin">
        {stages.map((stage) => {
          const visibleDeals = filterDeals(stage.deals || []);
          const columnTotal = visibleDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);

          return (
            <div
              key={stage.id}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.id)}
              className="w-72 shrink-0 bg-gray-100/70 dark:bg-slate-900/60 rounded-xl p-3 border border-gray-200 dark:border-slate-800 flex flex-col max-h-[calc(100vh-220px)]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-200/80 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[120px]">
                    {stage.name}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono font-bold text-gray-900 dark:text-white block">
                    {columnTotal.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-slate-500">
                    {visibleDeals.length} tratos
                  </span>
                </div>
              </div>

              {/* Deals List */}
              <div className="space-y-2 flex-1 overflow-y-auto pr-0.5">
                {visibleDeals.map((deal: any) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={() => handleDragStart(deal.id)}
                    onClick={() => setSelectedDeal(deal)}
                    className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700/80 shadow-xs hover:shadow-md cursor-grab active:cursor-grabbing transition-all space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {deal.title}
                      </span>
                      <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 shrink-0">
                        {deal.value?.toLocaleString('es-ES', { style: 'currency', currency: deal.currency || 'EUR', maximumFractionDigits: 0 })}
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] text-gray-500 dark:text-slate-400">
                      {deal.company && (
                        <div className="flex items-center space-x-1.5 truncate">
                          <Building2 className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="truncate">{deal.company.name}</span>
                        </div>
                      )}
                      {deal.contact && (
                        <div className="flex items-center space-x-1.5 truncate">
                          <User className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="truncate">{deal.contact.firstName} {deal.contact.lastName}</span>
                        </div>
                      )}
                    </div>

                    {deal.expectedCloseDate && (
                      <div className="pt-2 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(deal.expectedCloseDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {visibleDeals.length === 0 && (
                  <div className="h-28 border border-dashed border-gray-300 dark:border-slate-800 rounded-lg flex items-center justify-center text-[11px] text-gray-400 text-center p-2">
                    Sin tratos en esta etapa
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Deal Activity & Custom Fields Drawer */}
      {selectedDeal && (
        <RecordDrawer
          isOpen={Boolean(selectedDeal)}
          onClose={() => setSelectedDeal(null)}
          entityType="DEAL"
          entityId={selectedDeal.id}
          title={selectedDeal.title}
          subtitle={`${selectedDeal.company?.name ? selectedDeal.company.name + ' • ' : ''}${selectedDeal.value?.toLocaleString('es-ES', { style: 'currency', currency: selectedDeal.currency || 'EUR' })}`}
          extraBadge={selectedDeal.stage?.name || 'Deal'}
        />
      )}

      {/* Creation Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('newDeal')}>
        <form onSubmit={handleCreateDeal} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('dealTitle')}</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Licencia Anual ERP"
              className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('dealValue')}</label>
              <input
                type="number"
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="15000"
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Fase Inicial</label>
              <select
                value={selectedStageId}
                onChange={(e) => setSelectedStageId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
              >
                {stages.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('companies')}</label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
              >
                <option value="">-- Sin Empresa --</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('contacts')}</label>
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
              >
                <option value="">-- Sin Contacto --</option>
                {contacts.map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.firstName} {ct.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 flex justify-end space-x-2 border-t border-gray-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 rounded-lg"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
            >
              {t('save')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
