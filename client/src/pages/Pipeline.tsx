import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, Building2, User, Calendar, X, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiRequest } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { RecordDrawer } from '../components/crm/RecordDrawer';
import { wsClient } from '../services/websocket';
import { Modal } from '../components/common/Modal';
import { PermissionGate } from '../components/common/PermissionGate';

export const Pipeline: React.FC = () => {
  const { t } = useLanguage();
  const [stages, setStages] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<any | null>(null);

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
    // Load companies and contacts for creation form
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
    }

    // Server PATCH mutation
    await apiRequest(`/deals/${draggedDealId}`, {
      method: 'PATCH',
      body: JSON.stringify({ stageId: targetStageId }),
    });

    setDraggedDealId(null);
    loadPipeline(); // Recalculate metrics
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
      setIsModalOpen(false);
      setTitle('');
      setValue('');
      setCompanyId('');
      setContactId('');
      loadPipeline();
    }
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

      {/* Kanban Board Container (Horizontal Scroll for High Density & Mobile) */}
      <div className="flex space-x-3 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin">
        {stages.map((stage) => (
          <div
            key={stage.id}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(stage.id)}
            className="w-72 shrink-0 bg-gray-100/70 dark:bg-slate-900/60 rounded-xl p-3 border border-gray-200 dark:border-slate-800 flex flex-col max-h-[calc(100vh-180px)]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-200/80 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                <span className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[140px]">
                  {stage.name}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700">
                  {stage.deals.length}
                </span>
              </div>
              <div className="text-[11px] font-semibold text-gray-700 dark:text-slate-300">
                {stage.metrics.totalValue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
              </div>
            </div>

            {/* Cards List */}
            <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
              {stage.deals.map((deal: any) => (
                <div
                  key={deal.id}
                  draggable
                  onDragStart={() => handleDragStart(deal.id)}
                  onClick={() => setSelectedDeal(deal)}
                  className={`p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200/80 dark:border-slate-700 shadow-xs hover:shadow-md transition-all cursor-pointer ${
                    draggedDealId === deal.id ? 'opacity-40 scale-95' : 'opacity-100'
                  }`}
                >
                  <div className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                    {deal.title}
                  </div>

                  <div className="mt-2 text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center">
                    <DollarSign className="w-3.5 h-3.5 inline mr-0.5" />
                    {deal.value.toLocaleString('es-ES', { style: 'currency', currency: deal.currency })}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-slate-700/60 space-y-1 text-[11px] text-gray-500 dark:text-slate-400">
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
                </div>
              ))}

              {stage.deals.length === 0 && (
                <div className="py-8 text-center text-xs text-gray-400 dark:text-slate-500 border border-dashed border-gray-200 dark:border-slate-800 rounded-lg">
                  Sin negocios en esta fase
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New Deal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('newDeal')}
        size="md"
      >
        <form onSubmit={handleCreateDeal} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              {t('dealTitle')}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: ERP Cloud"
              className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              {t('dealValue')} (€)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="15000"
              className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              {t('status')}
            </label>
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

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              {t('dealCompany')}
            </label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
            >
              <option value="">-- {t('noData')} --</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              {t('dealContact')}
            </label>
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
            >
              <option value="">-- {t('noData')} --</option>
              {contacts.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.firstName} {ct.lastName} ({ct.email})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 flex justify-end space-x-2 border-t border-gray-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
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

      {/* Deal Activity & Custom Fields Drawer */}
      {selectedDeal && (
        <RecordDrawer
          isOpen={!!selectedDeal}
          onClose={() => setSelectedDeal(null)}
          entityType="DEAL"
          entityId={selectedDeal.id}
          title={selectedDeal.title}
          subtitle={`${selectedDeal.company?.name ? selectedDeal.company.name + ' • ' : ''}${selectedDeal.value?.toLocaleString('es-ES', { style: 'currency', currency: selectedDeal.currency || 'EUR' })}`}
          extraBadge={selectedDeal.stage?.name || 'Deal'}
        />
      )}
    </div>
  );
};
