import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { isValidEmail, isValidPhone } from '../utils/validators';
import { exportToCSV } from '../utils/exportUtils';

export const Companies: React.FC = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const [companies, setCompanies] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Sorting state
  const [industryFilter, setIndustryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NAME_ASC');

  // Create Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
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

  const loadCompanies = async () => {
    setIsLoading(true);
    const res = await apiRequest('/companies?limit=200');
    if (res.success && res.data) {
      setCompanies(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadCompanies();
  }, []);

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
          if (
            !name.includes(q) &&
            !city.includes(q) &&
            !industry.includes(q) &&
            !website.includes(q) &&
            !phone.includes(q) &&
            !email.includes(q)
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

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedCompanies.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedCompanies.map((c) => c.id)));
    }
  };

  const handleExportCSV = (selectedOnly = false) => {
    const dataToExport = selectedOnly
      ? filteredAndSortedCompanies.filter((c) => selectedIds.has(c.id))
      : filteredAndSortedCompanies;

    if (dataToExport.length === 0) {
      toast.error(t('error'), 'No hay empresas para exportar');
      return;
    }

    const headers = [
      'ID',
      'Razón Social',
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
      c.industry || '',
      c.city || '',
      c.country || '',
      c.email || '',
      c.phone || '',
      c.website || '',
      c.annualRevenue || 0,
      c._count?.contacts || 0,
      c._count?.deals || 0,
      new Date(c.createdAt).toLocaleDateString(),
    ]);

    exportToCSV(`empresas_export_${new Date().toISOString().split('T')[0]}`, headers, rows);
    toast.success(t('success'), `${dataToExport.length} empresas exportadas a CSV`);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const confirmMsg = t('bulk.confirmDelete').replace('{count}', String(selectedIds.size));
    if (!window.confirm(confirmMsg)) return;

    const res = await apiRequest('/companies/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids: Array.from(selectedIds) }),
    });

    if (res.success) {
      toast.success(t('success'), t('bulk.deleteSuccess').replace('{count}', String(selectedIds.size)));
      setSelectedIds(new Set());
      loadCompanies();
    } else {
      toast.error(t('error'), res.message || t('bulk.error'));
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('La razón social o nombre de la empresa es obligatorio (*).');
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
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t('companies')}
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Directorio corporativo de cuentas de clientes, proveedores y análisis financiero
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleExportCSV(false)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            title={t('bulk.exportAll')}
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">{t('bulk.exportCsv')}</span>
          </button>

          <button
            onClick={() => {
              setFormError('');
              setIsModalOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('newCompany')}</span>
          </button>
        </div>
      </div>

      {/* Floating Enterprise Bulk Operations Toolbar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center space-x-3 text-xs animate-in fade-in slide-in-from-bottom-4">
          <div className="font-bold flex items-center space-x-1.5 border-r border-slate-700 pr-3 text-blue-400">
            <CheckSquare className="w-4 h-4" />
            <span>{t('bulk.selectedCount').replace('{count}', String(selectedIds.size))}</span>
          </div>

          <button
            onClick={() => handleExportCSV(true)}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 font-semibold transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('bulk.exportCsv')}</span>
          </button>

          <button
            onClick={handleBulkDelete}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 font-semibold transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('bulk.deleteSelected')}</span>
          </button>

          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-slate-400 hover:text-white underline pl-2 transition"
          >
            {t('bulk.deselectAll')}
          </button>
        </div>
      )}

      {/* Toolbar / Filters */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('companies.searchPlaceholder')}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Industry Filter */}
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 max-w-[190px] truncate"
            >
              <option value="ALL">Todos los sectores</option>
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
          <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-500 hidden sm:inline">Ordenar:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 font-medium"
          >
            <option value="NAME_ASC">Nombre (A - Z)</option>
            <option value="NAME_DESC">Nombre (Z - A)</option>
            <option value="REVENUE_DESC">Mayor Facturación</option>
            <option value="REVENUE_ASC">Menor Facturación</option>
            <option value="CONTACTS_DESC">Más Contactos</option>
            <option value="DEALS_DESC">Más Oportunidades</option>
            <option value="NEWEST">Más recientes</option>
          </select>
        </div>
      </div>

      {/* Grid of Companies */}
      {isLoading ? (
        <div className="text-center py-12 text-xs text-gray-400">
          Cargando empresas...
        </div>
      ) : filteredAndSortedCompanies.length === 0 ? (
        <div className="text-center py-12 text-xs text-gray-400 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800">
          No se encontraron empresas con los criterios seleccionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedCompanies.map((company) => (
            <div
              key={company.id}
              onClick={(e) => toggleSelectCompany(company.id, e)}
              className={`bg-white dark:bg-slate-800 p-4 rounded-xl border shadow-xs flex flex-col justify-between space-y-3 transition-colors cursor-pointer ${
                selectedIds.has(company.id)
                  ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40 dark:bg-slate-800'
                  : 'border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-600'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(company.id)}
                      onChange={() => {}}
                      aria-label={`Seleccionar ${company.name}`}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer shrink-0"
                    />
                    <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                        {company.name}
                      </h3>
                      <span className="text-[10px] text-gray-500 dark:text-slate-400">
                        {company.industry || 'Industria no especificada'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenEdit(company)}
                      title="Editar Empresa"
                      className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingCompany(company)}
                      title="Eliminar Empresa"
                      className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-xs text-gray-600 dark:text-slate-300">
                  {company.city && (
                    <div className="flex items-center space-x-1.5 text-[11px]">
                      <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                      <span>{company.city}</span>
                    </div>
                  )}
                  {company.website && (
                    <div className="flex items-center space-x-1.5 text-[11px]">
                      <Globe className="w-3 h-3 text-gray-400 shrink-0" />
                      <a
                        href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline truncate max-w-[200px]"
                      >
                        {company.website}
                      </a>
                    </div>
                  )}
                  {company.phone && (
                    <div className="flex items-center space-x-1.5 text-[11px]">
                      <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                      <span>{company.phone}</span>
                    </div>
                  )}
                  {company.email && (
                    <div className="flex items-center space-x-1.5 text-[11px]">
                      <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                      <span className="truncate max-w-[200px]">{company.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2.5 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-gray-500 dark:text-slate-400">
                <span>Contactos: <strong className="text-gray-700 dark:text-slate-200">{company._count?.contacts || 0}</strong></span>
                <span>Deals: <strong className="text-gray-700 dark:text-slate-200">{company._count?.deals || 0}</strong></span>
                <span className="font-semibold text-gray-900 dark:text-white">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t('newCompany')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center space-x-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCompany} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Nombre Comercial <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Acme Corp SL"
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('companies.sector')}</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="Ej: Software, Logística, Salud"
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('companies.city')}</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Madrid"
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('companies.revenue')}</label>
                  <input
                    type="number"
                    value={annualRevenue}
                    onChange={(e) => setAnnualRevenue(e.target.value)}
                    placeholder="250000"
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('companies.website')}</label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('companies.phone')}</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+34 912 345 678"
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('companies.email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contacto@empresa.com"
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
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
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Editar Empresa</h2>
              <button onClick={() => setEditingCompany(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {editFormError && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center space-x-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editFormError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateCompany} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Nombre Comercial <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('companies.sector')}</label>
                <input
                  type="text"
                  value={editIndustry}
                  onChange={(e) => setEditIndustry(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('companies.city')}</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('companies.revenue')}</label>
                  <input
                    type="number"
                    value={editAnnualRevenue}
                    onChange={(e) => setEditAnnualRevenue(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('companies.website')}</label>
                  <input
                    type="text"
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('companies.phone')}</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('companies.email')}</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-gray-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCompany(null)}
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

      {/* Delete Confirmation Modal */}
      {deletingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 p-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">Eliminar Empresa</h2>
            <p className="text-xs text-gray-600 dark:text-slate-400 mb-5">
              ¿Estás seguro de que deseas eliminar la empresa{' '}
              <strong className="text-gray-900 dark:text-white">{deletingCompany.name}</strong>?
              Esta acción puede afectar a los contactos y oportunidades vinculados.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDeletingCompany(null)}
                disabled={isDeleting}
                className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteCompany}
                disabled={isDeleting}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg shadow-xs"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
