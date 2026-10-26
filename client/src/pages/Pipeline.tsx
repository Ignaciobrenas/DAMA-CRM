import React, { useState, useEffect } from 'react';
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
  FileSpreadsheet,
  FileText,
  Edit,
  Trash2,
  TrendingUp,
  Target,
  Trophy,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiRequest, downloadFile } from '../services/api';
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

  // Edit & Delete Deal states
  const [editingDeal, setEditingDeal] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editStageId, setEditStageId] = useState('');
  const [editCompanyId, setEditCompanyId] = useState('');
  const [editContactId, setEditContactId] = useState('');
  const [editExpectedCloseDate, setEditExpectedCloseDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const [deletingDeal, setDeletingDeal] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('');
  const [minValuePreset, setMinValuePreset] = useState<number>(0);

  // Creation Form state
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [notes, setNotes] = useState('');
  const [companies, setCompanies] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [contactId, setContactId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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

  useEffect(() => {
    const handleUrlParams = () => {
      const params = new URLSearchParams(window.location.search);
      const dealId = params.get('dealId') || params.get('id');
      const q = params.get('q');
      const newDeal = params.get('new');
      const cId = params.get('companyId');
      if (q) setSearchTerm(q);
      if (newDeal === 'true') {
        if (cId) setCompanyId(cId);
        setIsModalOpen(true);
      }
      if (dealId && stages.length > 0) {
        for (const st of stages) {
          const d = st.deals?.find((item: any) => item.id === dealId);
          if (d) {
            setSelectedDeal(d);
            break;
          }
        }
      }
    };
    handleUrlParams();
    window.addEventListener('popstate', handleUrlParams);
    return () => window.removeEventListener('popstate', handleUrlParams);
  }, [stages]);

  // Listen for Escape key on local delete confirmation modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deletingDeal) setDeletingDeal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deletingDeal]);

  const handleDragStart = (dealId: string) => {
    setDraggedDealId(dealId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetStageId: string) => {
    if (!draggedDealId) return;

    let targetStageName = '';
    const currentTarget = stages.find((s) => s.id === targetStageId);
    if (currentTarget) targetStageName = currentTarget.name;

    // Trigger celebration confetti if moved to WON stage
    if (targetStageName.toLowerCase().includes('ganada')) {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
      toast.success(t('success', 'Éxito'), '¡Negocio Ganado! Oportunidad cerrada satisfactoriamente');
    }

    // Optimistic UI update
    let movedDeal: any = null;
    setStages((prevStages) =>
      prevStages
        .map((st) => {
          const deal = st.deals?.find((d: any) => d.id === draggedDealId);
          if (deal) movedDeal = { ...deal, stageId: targetStageId };
          return {
            ...st,
            deals: st.deals ? st.deals.filter((d: any) => d.id !== draggedDealId) : [],
          };
        })
        .map((st) => {
          if (st.id === targetStageId && movedDeal) {
            return {
              ...st,
              deals: [movedDeal, ...(st.deals || [])],
            };
          }
          return st;
        })
    );

    await apiRequest(`/deals/${draggedDealId}`, {
      method: 'PATCH',
      body: JSON.stringify({ stageId: targetStageId }),
    });

    setDraggedDealId(null);
    loadPipeline();
  };

  const handleQuickStageChange = async (dealId: string, newStageId: string) => {
    const targetStage = stages.find((s) => s.id === newStageId);
    if (targetStage?.name?.toLowerCase().includes('ganada')) {
      confetti({
        particleCount: 100,
        spread: 60,
        origin: { y: 0.6 },
      });
      toast.success(t('success', 'Éxito'), '¡Negocio Ganado! Oportunidad cerrada satisfactoriamente');
    }

    const res = await apiRequest(`/deals/${dealId}`, {
      method: 'PATCH',
      body: JSON.stringify({ stageId: newStageId }),
    });

    if (res.success) {
      toast.success(t('success', 'Éxito'), 'Etapa actualizada correctamente');
      loadPipeline();
    } else {
      toast.error(t('error', 'Error'), res.message || 'Error al actualizar etapa');
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedStageId) return;

    setIsCreating(true);
    const res = await apiRequest('/deals', {
      method: 'POST',
      body: JSON.stringify({
        title: title.trim(),
        value: parseFloat(value) || 0,
        stageId: selectedStageId,
        companyId: companyId || null,
        contactId: contactId || null,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate).toISOString() : null,
        notes: notes.trim() || null,
      }),
    });
    setIsCreating(false);

    if (res.success) {
      toast.success(t('success', 'Éxito'), t('dealCreatedSuccess', 'Oportunidad creada correctamente'));
      setIsModalOpen(false);
      setTitle('');
      setValue('');
      setExpectedCloseDate('');
      setNotes('');
      setCompanyId('');
      setContactId('');
      loadPipeline();
    } else {
      toast.error(t('error', 'Error'), res.message || 'Error al crear la oportunidad');
    }
  };

  const openEditDealModal = (deal: any) => {
    setEditingDeal(deal);
    setEditTitle(deal.title || '');
    setEditValue(deal.value !== undefined ? String(deal.value) : '0');
    setEditStageId(deal.stageId || '');
    setEditCompanyId(deal.companyId || '');
    setEditContactId(deal.contactId || '');
    setEditExpectedCloseDate(
      deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toISOString().slice(0, 10) : ''
    );
    setEditNotes(deal.notes || '');
  };

  const handleUpdateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeal || !editTitle.trim()) return;

    setIsSubmittingEdit(true);
    const res = await apiRequest(`/deals/${editingDeal.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: editTitle.trim(),
        value: parseFloat(editValue) || 0,
        stageId: editStageId,
        companyId: editCompanyId || null,
        contactId: editContactId || null,
        expectedCloseDate: editExpectedCloseDate ? new Date(editExpectedCloseDate).toISOString() : null,
        notes: editNotes.trim() || null,
      }),
    });
    setIsSubmittingEdit(false);

    if (res.success) {
      toast.success(t('success', 'Éxito'), 'Oportunidad comercial actualizada correctamente');
      setEditingDeal(null);
      loadPipeline();
    } else {
      toast.error(t('error', 'Error'), res.message || 'Error al actualizar oportunidad');
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
      toast.success(t('success', 'Éxito'), 'Oportunidad comercial eliminada correctamente');
      setDeletingDeal(null);
      loadPipeline();
    } else {
      toast.error(t('error', 'Error'), res.message || 'Error al eliminar la oportunidad');
    }
  };

  const filterDeals = (deals: any[]) => {
    return (deals || []).filter((d) => {
      if (minValuePreset > 0 && (d.value || 0) < minValuePreset) return false;
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

  const handleExportCSV = async () => {
    try {
      await downloadFile('/deals/export/csv', `pipeline_ventas_${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success(t('success', 'Éxito'), t('pipeline.exportCsvSuccess', 'Pipeline exportado a Excel correctamente'));
    } catch {
      toast.error(t('error', 'Error'), t('pipeline.exportError', 'Error al exportar'));
    }
  };

  const handleExportPDF = async () => {
    try {
      await downloadFile('/deals/export/pdf', `informe_pipeline_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success(t('success', 'Éxito'), t('pipeline.exportPdfSuccess', 'Informe PDF generado correctamente'));
    } catch {
      toast.error(t('error', 'Error'), t('pipeline.exportError', 'Error al exportar'));
    }
  };

  const hasActiveFilters = Boolean(searchTerm.trim() || selectedCompanyFilter || minValuePreset > 0);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('pipeline', 'Pipeline Comercial')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('pipelineSubtitle', 'Gestión visual de oportunidades y pronóstico de ventas')}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {/* Export buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1 rounded text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition flex items-center gap-1.5"
              title="Exportar Pipeline a Excel (CSV)"
              aria-label="Exportar Pipeline a Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="px-2.5 py-1 rounded text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition flex items-center gap-1.5"
              title="Descargar Informe PDF de Pipeline"
              aria-label="Descargar Informe PDF de Pipeline"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>PDF</span>
            </button>
          </div>

          <PermissionGate resource="deals" action="create">
            <button
              onClick={() => setIsModalOpen(true)}
              data-testid="create-deal-button"
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('newDeal', 'Nueva Oportunidad')}</span>
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Oportunidades Activas</p>
            <p className="text-base font-bold text-slate-900 dark:text-white" data-testid="kpi-total-deals">
              {summary?.totalDeals ?? 0}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Volumen Total Pipeline</p>
            <p className="text-base font-bold text-slate-900 dark:text-white" data-testid="kpi-total-value">
              {(summary?.totalValue || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Valor Ponderado (Prob.)</p>
            <p className="text-base font-bold text-slate-900 dark:text-white" data-testid="kpi-weighted-value">
              {(summary?.weightedValue || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Tratos Ganados</p>
            <p className="text-base font-bold text-slate-900 dark:text-white" data-testid="kpi-won-deals">
              {summary?.wonCount ?? 0} ({ (summary?.wonValue || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }) })
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-2 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            data-testid="pipeline-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('pipeline.searchFilterPlaceholder', 'Buscar por título, empresa o contacto...')}
            aria-label="Buscar oportunidades por título, empresa o contacto"
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
          />
        </div>

        {/* Company Dropdown Filter */}
        <div className="min-w-[180px]">
          <select
            data-testid="pipeline-company-filter"
            value={selectedCompanyFilter}
            onChange={(e) => setSelectedCompanyFilter(e.target.value)}
            aria-label="Filtrar por empresa"
            className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-600"
          >
            <option value="">{t('pipeline.allCompanies', 'Todas las empresas')}</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Min Value Presets */}
        <div className="flex items-center space-x-1" role="group" aria-label="Filtro de importe mínimo">
          {[
            { label: t('all', 'Todos'), val: 0 },
            { label: '> 5k €', val: 5000 },
            { label: '> 20k €', val: 20000 },
            { label: '> 50k €', val: 50000 },
          ].map((preset) => (
            <button
              key={preset.val}
              type="button"
              data-testid={`preset-filter-${preset.val}`}
              onClick={() => setMinValuePreset(preset.val)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                minValuePreset === preset.val
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedCompanyFilter('');
              setMinValuePreset(0);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs rounded-lg flex items-center gap-1"
            title="Limpiar filtros"
            aria-label="Limpiar filtros"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Limpiar</span>
          </button>
        )}
      </div>

      {/* Kanban Board Container (Horizontal Scroll with snap for high density & mobile) */}
      <div
        className="flex space-x-3 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin"
        role="region"
        aria-label="Tablero Kanban de Ventas"
      >
        {stages.map((stage) => {
          const visibleDeals = filterDeals(stage.deals || []);
          const columnTotal = visibleDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);

          return (
            <div
              key={stage.id}
              data-testid={`stage-column-${stage.id}`}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.id)}
              className="w-72 shrink-0 bg-slate-100/80 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[calc(100vh-220px)]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                    {stage.name}
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-semibold bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {stage.probability}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono font-bold text-slate-900 dark:text-white block">
                    {columnTotal.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {visibleDeals.length} tratos
                  </span>
                </div>
              </div>

              {/* Deals List */}
              <div className="space-y-2 flex-1 overflow-y-auto pr-0.5">
                {visibleDeals.map((deal: any) => (
                  <div
                    key={deal.id}
                    data-testid={`deal-card-${deal.id}`}
                    draggable
                    onDragStart={() => handleDragStart(deal.id)}
                    className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 cursor-grab active:cursor-grabbing transition-all space-y-2 group"
                  >
                    <div
                      className="flex items-start justify-between gap-1 cursor-pointer"
                      data-testid="deal-header-clickable"
                      onClick={() => setSelectedDeal(deal)}
                    >
                      <span
                        data-testid="deal-card-title"
                        className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                      >
                        {deal.title}
                      </span>
                      <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 shrink-0">
                        {(deal.value || 0).toLocaleString('es-ES', {
                          style: 'currency',
                          currency: deal.currency || 'EUR',
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>

                    <div
                      className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer"
                      onClick={() => setSelectedDeal(deal)}
                    >
                      {deal.company && (
                        <div className="flex items-center space-x-1.5 truncate">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{deal.company.name}</span>
                        </div>
                      )}
                      {deal.contact && (
                        <div className="flex items-center space-x-1.5 truncate">
                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {deal.contact.firstName} {deal.contact.lastName || ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {deal.expectedCloseDate && (
                      <div className="pt-1.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(deal.expectedCloseDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}

                    {/* Card Actions: Accessible Stage Switcher & Quick Edit / Delete */}
                    <div
                      className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        aria-label={`Mover etapa de ${deal.title}`}
                        value={deal.stageId}
                        onChange={(e) => handleQuickStageChange(deal.id, e.target.value)}
                        className="text-[10px] py-0.5 px-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-700 dark:text-slate-200 max-w-[130px] truncate focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {stages.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => openEditDealModal(deal)}
                          aria-label={`Editar ${deal.title}`}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingDeal(deal)}
                          aria-label={`Eliminar ${deal.title}`}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {visibleDeals.length === 0 && (
                  <div className="h-28 border border-dashed border-slate-300 dark:border-slate-800 rounded-lg flex items-center justify-center text-[11px] text-slate-400 text-center p-2">
                    Sin oportunidades en esta etapa
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Deal Activity & Custom Fields Centered Modal Drawer */}
      {selectedDeal && (
        <RecordDrawer
          isOpen={Boolean(selectedDeal)}
          onClose={() => setSelectedDeal(null)}
          entityType="DEAL"
          entityId={selectedDeal.id}
          title={selectedDeal.title}
          subtitle={`${selectedDeal.company?.name ? selectedDeal.company.name + ' • ' : ''}${(selectedDeal.value || 0).toLocaleString('es-ES', { style: 'currency', currency: selectedDeal.currency || 'EUR' })}`}
          extraBadge={selectedDeal.stage?.name || 'Deal'}
        />
      )}

      {/* Creation Modal (Centered with m-auto) */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('newDeal', 'Nueva Oportunidad Comercial')}>
        <form onSubmit={handleCreateDeal} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('dealTitle', 'Título de la Oportunidad')} *
            </label>
            <input
              type="text"
              required
              data-testid="create-deal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('pipeline.dealTitlePlaceholder', 'p.ej. Contrato Anual Mantenimiento')}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('dealValue', 'Importe (€)')} *
              </label>
              <input
                type="number"
                required
                min="0"
                step="any"
                data-testid="create-deal-value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="15000"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('pipeline.stageInitial', 'Fase del Embudo')} *
              </label>
              <select
                data-testid="create-deal-stage"
                value={selectedStageId}
                onChange={(e) => setSelectedStageId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              >
                {stages.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.probability}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('companies', 'Empresa Asociada')}
              </label>
              <select
                data-testid="create-deal-company"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              >
                <option value="">{t('pipeline.noCompanyOption', '-- Sin Empresa --')}</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('contacts', 'Contacto')}
              </label>
              <select
                data-testid="create-deal-contact"
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              >
                <option value="">{t('pipeline.noContactOption', '-- Sin Contacto --')}</option>
                {contacts.map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.firstName} {ct.lastName || ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Fecha Estimada de Cierre
            </label>
            <input
              type="date"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notas y Observaciones
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles sobre las necesidades del cliente..."
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="pt-3 flex justify-end space-x-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              {t('cancel', 'Cancelar')}
            </button>
            <button
              type="submit"
              disabled={isCreating}
              data-testid="submit-create-deal"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs"
            >
              {isCreating ? 'Guardando...' : t('save', 'Guardar')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Deal Modal (Centered with m-auto) */}
      {editingDeal && (
        <Modal
          isOpen={Boolean(editingDeal)}
          onClose={() => setEditingDeal(null)}
          title="Editar Oportunidad Comercial"
        >
          <form onSubmit={handleUpdateDeal} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('dealTitle', 'Título')} *
              </label>
              <input
                type="text"
                required
                data-testid="edit-deal-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('dealValue', 'Importe (€)')} *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  data-testid="edit-deal-value"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('pipeline.stageInitial', 'Fase')} *
                </label>
                <select
                  data-testid="edit-deal-stage"
                  value={editStageId}
                  onChange={(e) => setEditStageId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                >
                  {stages.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.probability}%)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('companies', 'Empresa')}
                </label>
                <select
                  value={editCompanyId}
                  onChange={(e) => setEditCompanyId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                >
                  <option value="">{t('pipeline.noCompanyOption', '-- Sin Empresa --')}</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('contacts', 'Contacto')}
                </label>
                <select
                  value={editContactId}
                  onChange={(e) => setEditContactId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                >
                  <option value="">{t('pipeline.noContactOption', '-- Sin Contacto --')}</option>
                  {contacts.map((ct) => (
                    <option key={ct.id} value={ct.id}>
                      {ct.firstName} {ct.lastName || ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fecha Estimada de Cierre
              </label>
              <input
                type="date"
                value={editExpectedCloseDate}
                onChange={(e) => setEditExpectedCloseDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notas
              </label>
              <textarea
                rows={2}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="pt-3 flex justify-end space-x-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingDeal(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                {t('cancel', 'Cancelar')}
              </button>
              <button
                type="submit"
                disabled={isSubmittingEdit}
                data-testid="submit-edit-deal"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs"
              >
                {isSubmittingEdit ? 'Guardando...' : 'Actualizar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal (Centered with m-auto) */}
      {deletingDeal && (
        <div
          onClick={() => setDeletingDeal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 m-auto bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-deal-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 m-auto space-y-4 animate-in zoom-in-95"
          >
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 rounded-xl">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 id="delete-deal-title" className="text-sm font-bold text-slate-900 dark:text-white">
                  Eliminar Oportunidad Comercial
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              ¿Estás seguro de que deseas eliminar permanentemente la oportunidad{' '}
              <strong className="text-slate-900 dark:text-white">"{deletingDeal.title}"</strong>?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingDeal(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                {t('cancel', 'Cancelar')}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteDeal}
                data-testid="confirm-delete-deal-btn"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar Oportunidad'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
