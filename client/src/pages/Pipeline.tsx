import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  DollarSign,
  Building2,
  User,
  Calendar,
  X,
  AlertCircle,
  Search,
  Filter,
  RotateCcw,
  Edit2,
  Trash2,
  ArrowUpDown,
  MessageSquare,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiRequest } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { RecordDrawer } from '../components/crm/RecordDrawer';
import { wsClient } from '../services/websocket';

export const Pipeline: React.FC = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const [stages, setStages] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<any | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCompanyId, setFilterCompanyId] = useState('');
  const [minValueFilter, setMinValueFilter] = useState<number>(0);
  const [dealSortBy, setDealSortBy] = useState('VALUE_DESC');

  // Create Deal Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('');
  const [companies, setCompanies] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [contactId, setContactId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Deal Form state
  const [editingDeal, setEditingDeal] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editStageId, setEditStageId] = useState('');
  const [editCompanyId, setEditCompanyId] = useState('');
  const [editContactId, setEditContactId] = useState('');
  const [editFormError, setEditFormError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Deal state
  const [deletingDeal, setDeletingDeal] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

    if (targetStageName.toLowerCase().includes('ganada')) {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
      toast.success('¡Negocio Ganado! 🎉', `Se ha cerrado con éxito: ${movedDeal?.title || 'Oportunidad'}`);
    } else if (targetStageName) {
      toast.info('Etapa actualizada', `Negocio movido a "${targetStageName}"`);
    }

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

    setIsSubmitting(true);
    const res = await apiRequest('/deals', {
      method: 'POST',
      body: JSON.stringify({
        title: title.trim(),
        value: parseFloat(value) || 0,
        stageId: selectedStageId,
        companyId: companyId || null,
        contactId: contactId || null,
      }),
    });
    setIsSubmitting(false);

    if (res.success) {
      toast.success('Negocio Creado', `Se añadió "${title}" al embudo.`);
      setIsModalOpen(false);
      setTitle('');
      setValue('');
      setCompanyId('');
      setContactId('');
      loadPipeline();
    } else {
      toast.error('Error al crear negocio', res.message || 'Verifica los campos');
    }
  };

  const handleOpenEdit = (deal: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDeal(deal);
    setEditTitle(deal.title || '');
    setEditValue(String(deal.value || 0));
    setEditStageId(deal.stageId || '');
    setEditCompanyId(deal.companyId || '');
    setEditContactId(deal.contactId || '');
    setEditFormError('');
  };

  const handleUpdateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeal) return;
    if (!editTitle.trim()) {
      setEditFormError('El título del negocio es obligatorio.');
      return;
    }

    setIsUpdating(true);
    const res = await apiRequest(`/deals/${editingDeal.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: editTitle.trim(),
        value: parseFloat(editValue) || 0,
        stageId: editStageId || undefined,
        companyId: editCompanyId || null,
        contactId: editContactId || null,
      }),
    });
    setIsUpdating(false);

    if (res.success) {
      toast.success('Negocio actualizado', `"${editTitle}" se guardó correctamente.`);
      setEditingDeal(null);
      loadPipeline();
    } else {
      setEditFormError(res.message || 'Error al actualizar el negocio');
    }
  };

  const handleDeleteDeal = async () => {
    if (!deletingDeal) return;
    setIsDeleting(true);
    const res = await apiRequest(`/deals/${deletingDeal.id}`, {
      method: 'DELETE',
    });
    setIsDeleting(false);

    if (res.success) {
      toast.success('Negocio eliminado', `Se eliminó "${deletingDeal.title}" del embudo.`);
      setDeletingDeal(null);
      loadPipeline();
    } else {
      toast.error('Error al eliminar', res.message || 'No se pudo eliminar el negocio');
    }
  };

  const isFilterActive = Boolean(searchQuery.trim() || filterCompanyId || minValueFilter > 0);

  const resetFilters = () => {
    setSearchQuery('');
    setFilterCompanyId('');
    setMinValueFilter(0);
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
            {t('dragNotice')} • Total Cartera: {summary?.totalValue?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t('newDeal')}</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título, empresa o contacto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Company Filter Dropdown */}
          <select
            value={filterCompanyId}
            onChange={(e) => setFilterCompanyId(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs text-gray-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="">Todas las empresas</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Min Value Quick Filter Presets */}
          <div className="hidden md:flex items-center space-x-1 p-0.5 bg-gray-100 dark:bg-slate-800 rounded-lg text-[10px] font-semibold">
            {[
              { label: 'Todos', val: 0 },
              { label: '> 5.000€', val: 5000 },
              { label: '> 10.000€', val: 10000 },
            ].map((preset) => (
              <button
                key={preset.val}
                onClick={() => setMinValueFilter(preset.val)}
                className={`px-2 py-1 rounded-md transition-colors ${
                  minValueFilter === preset.val
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Reset button if active */}
          {isFilterActive && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center space-x-1 px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center space-x-2 shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-500 hidden sm:inline">Ordenar:</span>
          <select
            value={dealSortBy}
            onChange={(e) => setDealSortBy(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 font-medium"
          >
            <option value="VALUE_DESC">Mayor Importe</option>
            <option value="VALUE_ASC">Menor Importe</option>
            <option value="TITLE_ASC">Título (A - Z)</option>
            <option value="NEWEST">Más recientes</option>
          </select>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex space-x-3 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin">
        {stages.map((stage) => {
          const filteredDeals = stage.deals
            .filter((deal: any) => {
              if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = deal.title?.toLowerCase().includes(q);
                const matchCompany = deal.company?.name?.toLowerCase().includes(q);
                const matchContact = `${deal.contact?.firstName || ''} ${deal.contact?.lastName || ''}`
                  .toLowerCase()
                  .includes(q);
                if (!matchTitle && !matchCompany && !matchContact) return false;
              }
              if (filterCompanyId && deal.companyId !== filterCompanyId) return false;
              if (minValueFilter > 0 && deal.value < minValueFilter) return false;
              return true;
            })
            .sort((a: any, b: any) => {
              if (dealSortBy === 'VALUE_DESC') return (b.value || 0) - (a.value || 0);
              if (dealSortBy === 'VALUE_ASC') return (a.value || 0) - (b.value || 0);
              if (dealSortBy === 'TITLE_ASC') return (a.title || '').localeCompare(b.title || '');
              if (dealSortBy === 'NEWEST') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
              return 0;
            });

          const columnValue = filteredDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);

          return (
            <div
              key={stage.id}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.id)}
              className="w-72 shrink-0 bg-gray-100/70 dark:bg-slate-900/60 rounded-xl p-3 border border-gray-200 dark:border-slate-800 flex flex-col max-h-[calc(100vh-230px)]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-200/80 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[140px]">
                    {stage.name}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700">
                    {filteredDeals.length}
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-gray-700 dark:text-slate-300">
                  {columnValue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                </div>
              </div>

              {/* Cards List */}
              <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
                {filteredDeals.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400 border border-dashed border-gray-200 dark:border-slate-800/80 rounded-lg">
                    {isFilterActive ? 'Sin coincidencias' : 'Sin tratos en esta fase'}
                  </div>
                ) : (
                  <AnimatePresence>
                    {filteredDeals.map((deal: any) => (
                      <motion.div
                        key={deal.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{
                          opacity: draggedDealId === deal.id ? 0.4 : 1,
                          scale: draggedDealId === deal.id ? 0.96 : 1,
                        }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ y: -3, transition: { duration: 0.15 } }}
                        whileTap={{ scale: 0.98 }}
                        draggable
                        onDragStart={() => handleDragStart(deal.id)}
                        onClick={() => setSelectedDeal(deal)}
                        className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200/80 dark:border-slate-700 shadow-xs hover:shadow-md transition-shadow cursor-pointer group"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                            {deal.title}
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 shrink-0">
                            <button
                              onClick={(e) => handleOpenEdit(deal, e)}
                              title="Editar negocio"
                              className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-slate-700"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingDeal(deal);
                              }}
                              title="Eliminar negocio"
                              className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-2 text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center">
                          <DollarSign className="w-3.5 h-3.5 inline mr-0.5" />
                          {deal.value.toLocaleString('es-ES', { style: 'currency', currency: deal.currency || 'EUR' })}
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
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Deal Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 p-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t('newDeal')}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateDeal} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Título del Negocio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej: Licencia ERP Cloud + Consultoría"
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Valor Proyectado (€) <span className="text-red-500">*</span>
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
                    Etapa Inicial
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
                    Empresa Asociada
                  </label>
                  <select
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
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
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Contacto de Referencia
                  </label>
                  <select
                    value={contactId}
                    onChange={(e) => setContactId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="">-- Sin Contacto --</option>
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
                    disabled={isSubmitting}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs"
                  >
                    {isSubmitting ? 'Guardando...' : t('save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Deal Modal */}
      {editingDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Editar Negocio</h2>
              <button onClick={() => setEditingDeal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {editFormError && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center space-x-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editFormError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateDeal} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Título del Negocio <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Valor Proyectado (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Fase / Etapa
                  </label>
                  <select
                    value={editStageId}
                    onChange={(e) => setEditStageId(e.target.value)}
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

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Empresa
                </label>
                <select
                  value={editCompanyId}
                  onChange={(e) => setEditCompanyId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
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
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Contacto
                </label>
                <select
                  value={editContactId}
                  onChange={(e) => setEditContactId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                >
                  <option value="">-- Sin Contacto --</option>
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
                  onClick={() => setEditingDeal(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs"
                >
                  {isUpdating ? 'Actualizando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Deal Confirmation Modal */}
      {deletingDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 p-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">Eliminar Negocio</h2>
            <p className="text-xs text-gray-600 dark:text-slate-400 mb-5">
              ¿Estás seguro de que deseas eliminar la oportunidad{' '}
              <strong className="text-gray-900 dark:text-white">{deletingDeal.title}</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDeletingDeal(null)}
                disabled={isDeleting}
                className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteDeal}
                disabled={isDeleting}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg shadow-xs"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

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
