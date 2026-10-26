import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Search,
  Building2,
  Globe,
  Phone,
  Mail,
  MapPin,
  X,
  AlertCircle,
  Edit2,
  Trash2,
  Filter,
  Download,
  CheckSquare,
  Square,
  ArrowUpDown,
  FileText,
  Briefcase,
  Users,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import {
  isValidEmail,
  isValidPhone,
  isValidSpanishTaxId,
  validateEmail,
  validatePhone,
  validateUrl,
  validateRequired,
  validateSpanishTaxId,
} from '../utils/validators';
import { ValidatedInput } from '../components/common/ValidatedInput';
import { exportToCSV } from '../utils/exportUtils';
import { CompanyDetailModal } from '../components/companies/CompanyDetailModal';

export const Companies: React.FC = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [companies, setCompanies] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Sorting state
  const [industryFilter, setIndustryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NAME_ASC');

  // Create Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [annualRevenue, setAnnualRevenue] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal state
  const [editingCompany, setEditingCompany] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editTaxId, setEditTaxId] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editAnnualRevenue, setEditAnnualRevenue] = useState('');
  const [editFormError, setEditFormError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Modal state
  const [deletingCompany, setDeletingCompany] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 360 Detail Modal state
  const [detailModalCompany, setDetailModalCompany] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const handleOpenDetailModal = useCallback(async (companyId: string) => {
    setIsDetailModalOpen(true);
    setIsDetailLoading(true);
    const res = await apiRequest('/companies/' + companyId);
    if (res.success && res.data) {
      setDetailModalCompany(res.data);
    } else {
      toast.error(t('error'), 'No se pudo cargar la información de la empresa');
      setIsDetailModalOpen(false);
    }
    setIsDetailLoading(false);
  }, [t, toast]);

  useEffect(() => {
    const handleUrlParams = () => {
      const params = new URLSearchParams(window.location.search);
      const targetId = params.get('id') || params.get('companyId');
      const q = params.get('q');
      if (q) setSearch(q);
      if (targetId) {
        handleOpenDetailModal(targetId);
      }
    };
    handleUrlParams();
    window.addEventListener('popstate', handleUrlParams);
    return () => window.removeEventListener('popstate', handleUrlParams);
  }, [handleOpenDetailModal]);

  const loadCompanies = useCallback(async () => {
    setIsLoading(true);
    const res = await apiRequest('/companies?limit=200');
    if (res.success && res.data) {
      setCompanies(res.data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  // Handle ESC key to close active modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDetailModalOpen) setIsDetailModalOpen(false);
        else if (deletingCompany) setDeletingCompany(null);
        else if (editingCompany) setEditingCompany(null);
        else if (isModalOpen) setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, editingCompany, deletingCompany, isDetailModalOpen]);

  // Extract distinct industries for filter dropdown
  const uniqueIndustries = useMemo(() => {
    const set = new Set<string>();
    companies.forEach((c) => {
      if (c.industry && c.industry.trim()) {
        set.add(c.industry.trim());
      }
    });
    return Array.from(set).sort();
  }, [companies]);

  // Filter & sort companies
  const filteredAndSortedCompanies = useMemo(() => {
    return companies
      .filter((company) => {
        // Search
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          const name = (company.name || '').toLowerCase();
          const city = (company.city || '').toLowerCase();
          const industry = (company.industry || '').toLowerCase();
          const website = (company.website || '').toLowerCase();
          const phone = (company.phone || '').toLowerCase();
          const email = (company.email || '').toLowerCase();
          const taxId = (company.taxId || '').toLowerCase();
          if (
            !name.includes(q) &&
            !city.includes(q) &&
            !industry.includes(q) &&
            !website.includes(q) &&
            !phone.includes(q) &&
            !email.includes(q) &&
            !taxId.includes(q)
          ) {
            return false;
          }
        }

        // Industry filter
        if (industryFilter !== 'ALL') {
          if ((company.industry || '').trim() !== industryFilter) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'NAME_ASC') {
          return (a.name || '').localeCompare(b.name || '');
        }
        if (sortBy === 'NAME_DESC') {
          return (b.name || '').localeCompare(a.name || '');
        }
        if (sortBy === 'REVENUE_DESC') {
          return (b.annualRevenue || 0) - (a.annualRevenue || 0);
        }
        if (sortBy === 'REVENUE_ASC') {
          return (a.annualRevenue || 0) - (b.annualRevenue || 0);
        }
        if (sortBy === 'CONTACTS_DESC') {
          return (b._count?.contacts || 0) - (a._count?.contacts || 0);
        }
        if (sortBy === 'DEALS_DESC') {
          return (b._count?.deals || 0) - (a._count?.deals || 0);
        }
        if (sortBy === 'NEWEST') {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        return 0;
      });
  }, [companies, search, industryFilter, sortBy]);

  const toggleSelectCompany = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleExportCSV = (selectedOnly = false) => {
    const dataToExport = selectedOnly
      ? filteredAndSortedCompanies.filter((c) => selectedIds.has(c.id))
      : filteredAndSortedCompanies;

    if (dataToExport.length === 0) {
      toast.error(t('error') || 'Error', 'No hay empresas para exportar');
      return;
    }

    const headers = [
      'ID',
      'Razón Social',
      'NIF / CIF',
      'Sector / Industria',
      'Ciudad',
      'País',
      'Email',
      'Teléfono',
      'Sitio Web',
      'Facturación Anual (€)',
      'Nº Contactos',
      'Nº Tratos',
      'Fecha Creación',
    ];

    const rows = dataToExport.map((c) => [
      c.id,
      c.name,
      c.taxId || '',
      c.industry || '',
      c.city || '',
      c.country || '',
      c.email || '',
      c.phone || '',
      c.website || '',
      c.annualRevenue || 0,
      c._count?.contacts || 0,
      c._count?.deals || 0,
      new Date(c.createdAt || Date.now()).toLocaleDateString(),
    ]);

    exportToCSV(`empresas_export_${new Date().toISOString().split('T')[0]}`, headers, rows);
    toast.success(t('success') || 'Éxito', `${dataToExport.length} empresas exportadas a CSV`);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const isConfirmed = await confirm({
      title: '¿Eliminar empresas seleccionadas?',
      description: `¿Estás seguro de que deseas eliminar permanentemente ${selectedIds.size} empresas seleccionadas?`,
      entityName: `${selectedIds.size} empresas`,
      confirmText: 'Eliminar todas',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!isConfirmed) return;

    const res = await apiRequest('/companies/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids: Array.from(selectedIds) }),
    });

    if (res.success) {
      toast.success(t('success') || 'Éxito', `${selectedIds.size} empresas eliminadas correctamente`);
      setSelectedIds(new Set());
      loadCompanies();
    } else {
      toast.error(t('error') || 'Error', res.message || 'Error al eliminar empresas');
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('La razón social o nombre de la empresa es obligatorio (*).');
      return;
    }

    if (taxId.trim() && !isValidSpanishTaxId(taxId.trim())) {
      setFormError('El NIF / CIF introducido no es válido en España (ej. B12345678, A08000000, 12345678Z).');
      return;
    }

    if (email && !isValidEmail(email)) {
      setFormError('El correo electrónico no tiene un formato válido.');
      return;
    }

    if (phone && !isValidPhone(phone)) {
      setFormError('El número de teléfono no tiene un formato válido.');
      return;
    }

    setIsSubmitting(true);
    const res = await apiRequest('/companies', {
      method: 'POST',
      body: JSON.stringify({
        name: name.trim(),
        taxId: taxId ? taxId.trim().toUpperCase() : null,
        industry: industry ? industry.trim() : null,
        website: website ? website.trim() : null,
        phone: phone ? phone.trim() : null,
        email: email ? email.trim().toLowerCase() : null,
        city: city ? city.trim() : null,
        annualRevenue: annualRevenue ? parseFloat(annualRevenue) : null,
      }),
    });
    setIsSubmitting(false);

    if (res.success) {
      toast.success('Empresa registrada', `${name} se ha añadido correctamente.`);
      setIsModalOpen(false);
      setFormError('');
      setName('');
      setTaxId('');
      setIndustry('');
      setWebsite('');
      setPhone('');
      setEmail('');
      setCity('');
      setAnnualRevenue('');
      loadCompanies();
    } else {
      setFormError(res.message || 'Error al registrar la empresa');
    }
  };

  const handleOpenEdit = (company: any) => {
    setEditingCompany(company);
    setEditName(company.name || '');
    setEditTaxId(company.taxId || '');
    setEditIndustry(company.industry || '');
    setEditWebsite(company.website || '');
    setEditPhone(company.phone || '');
    setEditEmail(company.email || '');
    setEditCity(company.city || '');
    setEditAnnualRevenue(company.annualRevenue ? String(company.annualRevenue) : '');
    setEditFormError('');
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;
    setEditFormError('');

    if (!editName.trim()) {
      setEditFormError('La razón social o nombre de la empresa es obligatorio (*).');
      return;
    }

    if (editTaxId.trim() && !isValidSpanishTaxId(editTaxId.trim())) {
      setEditFormError('El NIF / CIF introducido no es válido en España (ej. B12345678, A08000000, 12345678Z).');
      return;
    }

    if (editEmail && !isValidEmail(editEmail)) {
      setEditFormError('El correo electrónico no tiene un formato válido.');
      return;
    }

    if (editPhone && !isValidPhone(editPhone)) {
      setEditFormError('El número de teléfono no tiene un formato válido.');
      return;
    }

    setIsUpdating(true);
    const res = await apiRequest(`/companies/${editingCompany.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: editName.trim(),
        taxId: editTaxId ? editTaxId.trim().toUpperCase() : null,
        industry: editIndustry ? editIndustry.trim() : null,
        website: editWebsite ? editWebsite.trim() : null,
        phone: editPhone ? editPhone.trim() : null,
        email: editEmail ? editEmail.trim().toLowerCase() : null,
        city: editCity ? editCity.trim() : null,
        annualRevenue: editAnnualRevenue ? parseFloat(editAnnualRevenue) : null,
      }),
    });
    setIsUpdating(false);

    if (res.success) {
      toast.success('Empresa actualizada', `${editName} se ha actualizado correctamente.`);
      setEditingCompany(null);
      loadCompanies();
    } else {
      setEditFormError(res.message || 'Error al actualizar la empresa');
    }
  };

  const handleDeleteCompany = async () => {
    if (!deletingCompany) return;
    setIsDeleting(true);
    const res = await apiRequest(`/companies/${deletingCompany.id}`, {
      method: 'DELETE',
    });
    setIsDeleting(false);

    if (res.success) {
      toast.success('Empresa eliminada', `${deletingCompany.name} ha sido eliminada.`);
      setDeletingCompany(null);
      loadCompanies();
    } else {
      toast.error('Error al eliminar', res.message || 'No se pudo eliminar la empresa.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
            <span>{t('companies') || 'Empresas'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('companiesSubtitle') || 'Directorio corporativo de cuentas de clientes, proveedores y datos fiscales'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleExportCSV(false)}
            aria-label="Exportar todas las empresas a CSV"
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0 active:scale-[0.98]"
            title={t('bulk.exportAll') || 'Exportar CSV'}
          >
            <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">{t('bulk.exportCsv') || 'Exportar CSV'}</span>
          </button>

          <button
            onClick={() => {
              setFormError('');
              setIsModalOpen(true);
            }}
            aria-label="Añadir nueva empresa"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0 active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('newCompany') || 'Nueva Empresa'}</span>
          </button>
        </div>
      </div>

      {/* Floating Enterprise Bulk Operations Toolbar */}
      {selectedIds.size > 0 && (
        <div data-testid="bulk-toolbar" role="region" aria-label="Operaciones masivas" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center space-x-3 text-xs animate-in fade-in slide-in-from-bottom-4">
          <div className="font-bold flex items-center space-x-1.5 border-r border-slate-700 pr-3 text-blue-400">
            <CheckSquare className="w-4 h-4" />
            <span>{t('bulk.selectedCount') ? t('bulk.selectedCount').replace('{count}', String(selectedIds.size)) : `${selectedIds.size} seleccionadas`}</span>
          </div>

          <button
            onClick={() => handleExportCSV(true)}
            aria-label="Exportar empresas seleccionadas a CSV"
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 font-semibold transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('bulk.exportCsv') || 'Exportar CSV'}</span>
          </button>

          <button
            onClick={handleBulkDelete}
            aria-label="Eliminar empresas seleccionadas"
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 font-semibold transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('bulk.deleteSelected') || 'Eliminar'}</span>
          </button>

          <button
            onClick={() => setSelectedIds(new Set())}
            aria-label="Deseleccionar todas las empresas"
            className="text-slate-400 hover:text-white underline pl-2 transition"
          >
            {t('bulk.deselectAll') || 'Deseleccionar'}
          </button>
        </div>
      )}

      {/* Toolbar / Filters */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar empresas"
              placeholder={t('companies.searchPlaceholder') || 'Buscar por razón social, ciudad, sector...'}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Industry Filter */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              aria-label="Filtrar por sector"
              className="px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 max-w-[190px] truncate transition-all"
            >
              <option value="ALL">{t('companies.allSectors') || 'Todos los sectores'}</option>
              {uniqueIndustries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center space-x-2 shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 hidden sm:inline">{t('companies.sortBy') || 'Ordenar:'}</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Ordenar empresas"
            className="px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition-all"
          >
            <option value="NAME_ASC">{t('companies.sortNameAsc') || 'Nombre (A - Z)'}</option>
            <option value="NAME_DESC">{t('companies.sortNameDesc') || 'Nombre (Z - A)'}</option>
            <option value="REVENUE_DESC">{t('companies.sortRevenueDesc') || 'Mayor Facturación'}</option>
            <option value="REVENUE_ASC">{t('companies.sortRevenueAsc') || 'Menor Facturación'}</option>
            <option value="CONTACTS_DESC">{t('companies.sortContactsDesc') || 'Más Contactos'}</option>
            <option value="DEALS_DESC">{t('companies.sortDealsDesc') || 'Más Oportunidades'}</option>
            <option value="NEWEST">{t('companies.sortRecent') || 'Más recientes'}</option>
          </select>
        </div>
      </div>

      {/* Grid of Companies */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
                  <div className="space-y-1.5">
                    <div className="w-28 h-3.5 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="w-16 h-2.5 bg-slate-100 dark:bg-slate-800/60 rounded" />
                  </div>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800/60 rounded" />
                <div className="w-3/4 h-2.5 bg-slate-100 dark:bg-slate-800/60 rounded" />
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                <div className="w-16 h-2 bg-slate-100 dark:bg-slate-800 rounded" />
                <div className="w-16 h-2 bg-slate-100 dark:bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredAndSortedCompanies.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            {t('noCompaniesFound') || 'No se encontraron empresas'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
            {search || industryFilter !== 'ALL'
              ? 'Prueba a cambiar o restablecer los términos de búsqueda o filtros para ver resultados.'
              : 'Empieza a registrar las organizaciones y clientes de tu cartera comercial.'}
          </p>
          {search || industryFilter !== 'ALL' ? (
            <button
              onClick={() => {
                setSearch('');
                setIndustryFilter('ALL');
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 rounded-xl transition"
            >
              Restablecer filtros
            </button>
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5 inline mr-1" />
              {t('newCompany') || 'Nueva Empresa'}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedCompanies.map((company) => (
            <div
              key={company.id}
              onClick={() => handleOpenDetailModal(company.id)}
              className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border shadow-xs flex flex-col justify-between space-y-3.5 transition-all duration-200 cursor-pointer ${
                selectedIds.has(company.id)
                  ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-slate-800/90'
                  : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(company.id)}
                      onClick={(e) => { e.stopPropagation(); toggleSelectCompany(company.id, e); }}
                      onChange={() => {}}
                      aria-label={`Seleccionar ${company.name}`}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer shrink-0"
                    />
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center font-bold text-sm shrink-0">
                      <Building2 className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {company.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {company.industry && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {company.industry}
                          </span>
                        )}
                        {company.taxId && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
                            {company.taxId}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenEdit(company)}
                      aria-label={`Editar ${company.name}`}
                      title="Editar Empresa"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingCompany(company)}
                      aria-label={`Eliminar ${company.name}`}
                      title="Eliminar Empresa"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3.5 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  {company.city && (
                    <div className="flex items-center space-x-2 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{company.city}{company.country ? `, ${company.country}` : ''}</span>
                    </div>
                  )}
                  {company.website && (
                    <div className="flex items-center space-x-2 text-[11px]">
                      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a
                        href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[220px]"
                      >
                        {company.website}
                      </a>
                    </div>
                  )}
                  {company.phone && (
                    <div className="flex items-center space-x-2 text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{company.phone}</span>
                    </div>
                  )}
                  {company.email && (
                    <div className="flex items-center space-x-2 text-[11px]">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[220px]">{company.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center space-x-1">
                  <Users className="w-3 h-3 text-slate-400" />
                  <span>{t('companies.contactsCount') || 'Contactos:'} <strong className="text-slate-700 dark:text-slate-200">{company._count?.contacts || 0}</strong></span>
                </span>
                <span className="flex items-center space-x-1">
                  <Briefcase className="w-3 h-3 text-slate-400" />
                  <span>{t('companies.dealsCount') || 'Deals:'} <strong className="text-slate-700 dark:text-slate-200">{company._count?.deals || 0}</strong></span>
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {company.annualRevenue
                    ? company.annualRevenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
                    : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-company-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 m-auto bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 m-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <h2 id="create-company-modal-title" className="text-sm font-bold text-slate-900 dark:text-white">
                  {t('newCompany') || 'Nueva Empresa'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Cerrar modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-3.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center space-x-2.5 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCompany} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ValidatedInput
                  label="Razón Social / Nombre"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  validator={(val) => validateRequired(val, 'La razón social')}
                  placeholder="Ej. Inversiones Nova SL"
                />

                <ValidatedInput
                  label="CIF / NIF (España)"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  validator={(val) => (!val ? { isValid: true } : validateSpanishTaxId(val))}
                  placeholder="B12345678"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ValidatedInput
                  label={t('companies.sector') || 'Sector / Industria'}
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="Ej: Software, Logística, Salud"
                />
                <ValidatedInput
                  label={t('companies.city') || 'Ciudad'}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Madrid"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ValidatedInput
                  label={t('companies.revenue') || 'Facturación (€)'}
                  type="number"
                  value={annualRevenue}
                  onChange={(e) => setAnnualRevenue(e.target.value)}
                  placeholder="250000"
                />
                <ValidatedInput
                  label={t('companies.website') || 'Sitio Web'}
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  validator={validateUrl}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ValidatedInput
                  label={t('companies.phone') || 'Teléfono'}
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  validator={validatePhone}
                  placeholder="+34 912 345 678"
                />
                <ValidatedInput
                  label={t('companies.email') || 'Email Corporativo'}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  validator={(val) => (!val ? { isValid: true } : validateEmail(val))}
                  placeholder="contacto@empresa.com"
                />
              </div>

              <div className="pt-3.5 flex justify-end space-x-2.5 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition active:scale-[0.98]"
                >
                  {t('cancel') || 'Cancelar'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition active:scale-[0.98]"
                >
                  {isSubmitting ? 'Guardando...' : (t('save') || 'Guardar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingCompany && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-company-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 m-auto bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setEditingCompany(null)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 m-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h2 id="edit-company-modal-title" className="text-sm font-bold text-slate-900 dark:text-white">
                  {t('companies.editCompanyModalTitle') || 'Editar Empresa'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingCompany(null)}
                aria-label="Cerrar modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editFormError && (
              <div className="mt-3.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center space-x-2.5 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editFormError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateCompany} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ValidatedInput
                  label="Razón Social / Nombre"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  validator={(val) => validateRequired(val, 'La razón social')}
                />
                <ValidatedInput
                  label="CIF / NIF (España)"
                  value={editTaxId}
                  onChange={(e) => setEditTaxId(e.target.value)}
                  validator={(val) => (!val ? { isValid: true } : validateSpanishTaxId(val))}
                  placeholder="B12345678"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ValidatedInput
                  label={t('companies.sector') || 'Sector / Industria'}
                  value={editIndustry}
                  onChange={(e) => setEditIndustry(e.target.value)}
                />
                <ValidatedInput
                  label={t('companies.city') || 'Ciudad'}
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ValidatedInput
                  label={t('companies.revenue') || 'Facturación (€)'}
                  type="number"
                  value={editAnnualRevenue}
                  onChange={(e) => setEditAnnualRevenue(e.target.value)}
                />
                <ValidatedInput
                  label={t('companies.website') || 'Sitio Web'}
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  validator={validateUrl}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ValidatedInput
                  label={t('companies.phone') || 'Teléfono'}
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  validator={validatePhone}
                />
                <ValidatedInput
                  label={t('companies.email') || 'Email Corporativo'}
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  validator={(val) => (!val ? { isValid: true } : validateEmail(val))}
                />
              </div>

              <div className="pt-3.5 flex justify-end space-x-2.5 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCompany(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition active:scale-[0.98]"
                >
                  {t('cancel') || 'Cancelar'}
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition active:scale-[0.98]"
                >
                  {isUpdating ? 'Actualizando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCompany && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-company-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 m-auto bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setDeletingCompany(null)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 m-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h2 id="delete-company-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                {t('companies.deleteCompanyModalTitle') || 'Eliminar Empresa'}
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
              ¿Estás seguro de que deseas eliminar permanentemente la empresa{' '}
              <strong className="text-slate-900 dark:text-white">{deletingCompany.name}</strong>?
              Esta acción puede afectar a los contactos, presupuestos y oportunidades vinculados.
            </p>
            <div className="flex justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setDeletingCompany(null)}
                disabled={isDeleting}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition active:scale-[0.98]"
              >
                {t('cancel') || 'Cancelar'}
              </button>
              <button
                type="button"
                onClick={handleDeleteCompany}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl shadow-xs transition active:scale-[0.98]"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 360 Company Detail Modal (Interconnected Data across modules) */}
      <CompanyDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        company={detailModalCompany}
        isLoading={isDetailLoading}
        onEdit={(cmp) => handleOpenEdit(cmp)}
      />
    </div>
  );
};
