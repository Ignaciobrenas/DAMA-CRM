import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Mail,
  Phone,
  Building2,
  User,
  MessageSquare,
  Edit2,
  Trash2,
  DollarSign,
  FileText,
  Receipt,
  ExternalLink,
  Calendar,
  AlertCircle,
  Download,
  CheckSquare,
  Square,
  X,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { RecordDrawer } from '../components/crm/RecordDrawer';
import { Modal } from '../components/common/Modal';
import { PermissionGate } from '../components/common/PermissionGate';
import { exportToCSV } from '../utils/exportUtils';

export const Contacts: React.FC = () => {
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const toast = useToast();
  const [contacts, setContacts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Detail Modal State
  const [detailModalContact, setDetailModalContact] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<'info' | 'company' | 'deals' | 'invoicing' | 'messages'>('info');
  const [isEditingInModal, setIsEditingInModal] = useState(false);
  const [isSavingDetail, setIsSavingDetail] = useState(false);
  const [detailFormError, setDetailFormError] = useState('');

  // Editable fields inside detail modal
  const [detailFirstName, setDetailFirstName] = useState('');
  const [detailLastName, setDetailLastName] = useState('');
  const [detailEmail, setDetailEmail] = useState('');
  const [detailPhone, setDetailPhone] = useState('');
  const [detailMobile, setDetailMobile] = useState('');
  const [detailPosition, setDetailPosition] = useState('');
  const [detailDepartment, setDetailDepartment] = useState('');
  const [detailCompanyId, setDetailCompanyId] = useState('');
  const [detailIsLead, setDetailIsLead] = useState(false);
  const [detailNotes, setDetailNotes] = useState('');

  // Creation Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [isLead, setIsLead] = useState(false);

  const canEdit = hasPermission('contacts', 'update');
  const canDelete = hasPermission('contacts', 'delete');

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelectContact = (id: string, e: React.MouseEvent) => {
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
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contacts.map((c) => c.id)));
    }
  };

  const handleExportCSV = (selectedOnly = false) => {
    const dataToExport = selectedOnly
      ? contacts.filter((c) => selectedIds.has(c.id))
      : contacts;

    if (dataToExport.length === 0) {
      toast.error(t('error'), 'No hay contactos para exportar');
      return;
    }

    const headers = [
      'ID',
      t('firstName'),
      t('lastName'),
      t('email'),
      t('phone'),
      t('mobile'),
      t('companies'),
      t('jobTitle'),
      t('department'),
      t('status'),
      'Fecha Creación',
    ];

    const rows = dataToExport.map((c) => [
      c.id,
      c.firstName,
      c.lastName,
      c.email,
      c.phone || '',
      c.mobile || '',
      c.company?.name || '',
      c.position || '',
      c.department || '',
      c.isLead ? 'Lead' : 'Cliente',
      new Date(c.createdAt).toLocaleDateString(),
    ]);

    exportToCSV(`contactos_export_${new Date().toISOString().split('T')[0]}`, headers, rows);
    toast.success(t('success'), `${dataToExport.length} contactos exportados a CSV`);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const confirmMsg = t('bulk.confirmDelete').replace('{count}', String(selectedIds.size));
    if (!window.confirm(confirmMsg)) return;

    const res = await apiRequest('/contacts/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids: Array.from(selectedIds) }),
    });

    if (res.success) {
      toast.success(t('success'), t('bulk.deleteSuccess').replace('{count}', String(selectedIds.size)));
      setSelectedIds(new Set());
      loadContacts();
    } else {
      toast.error(t('error'), res.message || t('bulk.error'));
    }
  };

  const handleBulkMarkLead = async (isLead: boolean) => {
    if (selectedIds.size === 0) return;

    const res = await apiRequest('/contacts/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ ids: Array.from(selectedIds), isLead }),
    });

    if (res.success) {
      toast.success(t('success'), t('bulk.updateSuccess').replace('{count}', String(selectedIds.size)));
      setSelectedIds(new Set());
      loadContacts();
    } else {
      toast.error(t('error'), res.message || t('bulk.error'));
    }
  };

  const loadContacts = async () => {
    setIsLoading(true);
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await apiRequest(`/contacts${query}`);
    if (res.success && res.data) {
      setContacts(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadContacts();
    apiRequest('/companies?limit=100').then((res) => {
      if (res.success) setCompanies(res.data || []);
    });
  }, [search]);

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/contacts', {
      method: 'POST',
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        phone,
        position,
        companyId: companyId || null,
        isLead,
      }),
    });

    if (res.success) {
      toast.success(t('success'), 'Contacto creado correctamente');
      setIsModalOpen(false);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setPosition('');
      setCompanyId('');
      loadContacts();
    } else {
      toast.error(t('error'), res.message || 'Error al crear contacto');
    }
  };

  const handleOpenDetailModal = async (contactId: string) => {
    setIsDetailModalOpen(true);
    setIsDetailLoading(true);
    setIsEditingInModal(false);
    setDetailFormError('');
    setDetailTab('info');

    const res = await apiRequest(`/contacts/${contactId}`);
    if (res.success && res.data) {
      const c = res.data;
      setDetailModalContact(c);
      setDetailFirstName(c.firstName || '');
      setDetailLastName(c.lastName || '');
      setDetailEmail(c.email || '');
      setDetailPhone(c.phone || '');
      setDetailMobile(c.mobile || '');
      setDetailPosition(c.position || '');
      setDetailDepartment(c.department || '');
      setDetailCompanyId(c.companyId || '');
      setDetailIsLead(Boolean(c.isLead));
      setDetailNotes(c.notes || '');
    } else {
      toast.error(t('error'), 'No se pudo cargar la información del contacto');
      setIsDetailModalOpen(false);
    }
    setIsDetailLoading(false);
  };

  const handleSaveDetailModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailModalContact) return;
    setIsSavingDetail(true);
    setDetailFormError('');

    const res = await apiRequest(`/contacts/${detailModalContact.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        firstName: detailFirstName,
        lastName: detailLastName,
        email: detailEmail,
        phone: detailPhone,
        mobile: detailMobile,
        position: detailPosition,
        department: detailDepartment,
        companyId: detailCompanyId || null,
        isLead: detailIsLead,
        notes: detailNotes,
      }),
    });

    if (res.success && res.data) {
      setDetailModalContact(res.data);
      setIsEditingInModal(false);
      toast.success(t('success'), 'Ficha de contacto actualizada con éxito');
      loadContacts();
    } else {
      setDetailFormError(res.message || 'Error al guardar cambios');
    }
    setIsSavingDetail(false);
  };

  const handleDeleteContact = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el contacto ${name}?`)) return;
    const res = await apiRequest(`/contacts/${id}`, { method: 'DELETE' });
    if (res.success) {
      toast.success(t('success'), `Contacto ${name} eliminado`);
      setIsDetailModalOpen(false);
      loadContacts();
    } else {
      toast.error(t('error'), res.message || 'Error al eliminar');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t('contacts')}
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {t('contactsSubtitle')}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchContacts')}
              className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <button
            onClick={() => handleExportCSV(false)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            title={t('bulk.exportAll')}
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">{t('bulk.exportCsv')}</span>
          </button>

          <PermissionGate resource="contacts" action="create">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('newContact')}</span>
            </button>
          </PermissionGate>
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

          {canEdit && (
            <>
              <button
                onClick={() => handleBulkMarkLead(false)}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-600 font-semibold transition"
              >
                <span>{t('bulk.markAsClient')}</span>
              </button>

              <button
                onClick={() => handleBulkMarkLead(true)}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-amber-600/80 hover:bg-amber-600 font-semibold transition"
              >
                <span>{t('bulk.markAsLead')}</span>
              </button>
            </>
          )}

          {canDelete && (
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 font-semibold transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('bulk.deleteSelected')}</span>
            </button>
          )}

          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-slate-400 hover:text-white underline pl-2 transition"
          >
            {t('bulk.deselectAll')}
          </button>
        </div>
      )}

      {/* High Density Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
            <thead className="bg-gray-50 dark:bg-slate-800/60 text-[11px] font-semibold text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={contacts.length > 0 && selectedIds.size === contacts.length}
                    onChange={toggleSelectAll}
                    aria-label="Seleccionar todos los contactos"
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3">{t('fullName')}</th>
                <th className="px-4 py-3">{t('companies')}</th>
                <th className="px-4 py-3">{t('jobTitle')}</th>
                <th className="px-4 py-3">{t('email')} & {t('phone')}</th>
                <th className="px-4 py-3">{t('status')}</th>
                <th className="px-4 py-3 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-gray-400">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>{t('loading')}</span>
                    </div>
                  </td>
                </tr>
              ) : contacts.length > 0 ? (
                contacts.map((contact) => (
                  <tr
                    key={contact.id}
                    onClick={() => handleOpenDetailModal(contact.id)}
                    className={`hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group ${
                      selectedIds.has(contact.id) ? 'bg-blue-50/70 dark:bg-blue-950/40' : ''
                    }`}
                    title={t('view')}
                  >
                    <td className="px-4 py-2.5 text-center" onClick={(e) => toggleSelectContact(contact.id, e)}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(contact.id)}
                        onChange={() => {}}
                        aria-label={`Seleccionar ${contact.firstName} ${contact.lastName}`}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-2.5 font-bold text-gray-900 dark:text-white">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                          {contact.firstName ? contact.firstName.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {contact.firstName} {contact.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      {contact.company ? (
                        <span className="flex items-center space-x-1 font-medium text-gray-800 dark:text-slate-200">
                          <Building2 className="w-3 h-3 text-gray-400" />
                          <span>{contact.company.name}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">{contact.position || '—'}</td>
                    <td className="px-4 py-2.5 space-y-0.5">
                      <div className="flex items-center space-x-1 text-gray-700 dark:text-slate-300">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span>{contact.email}</span>
                      </div>
                      {contact.phone && (
                        <div className="flex items-center space-x-1 text-[11px] text-gray-500">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {contact.isLead ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                          Lead
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                          Cliente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center space-x-1.5">
                        <button
                          onClick={() => handleOpenDetailModal(contact.id)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 transition-colors"
                        >
                          <User className="w-3 h-3" />
                          <span>{t('details')}</span>
                        </button>
                        <button
                          onClick={() => setSelectedContact(contact)}
                          className="inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>{t('contacts.timeline')}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-gray-400">
                    {t('noContactsFound')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity, Custom Fields & Omnichannel Timeline Drawer */}
      {selectedContact && (
        <RecordDrawer
          isOpen={Boolean(selectedContact)}
          onClose={() => setSelectedContact(null)}
          entityType="CONTACT"
          entityId={selectedContact.id}
          title={`${selectedContact.firstName} ${selectedContact.lastName}`}
          subtitle={`${selectedContact.company?.name ? selectedContact.company.name + ' • ' : ''}${selectedContact.email}`}
          extraBadge={selectedContact.isLead ? 'Lead' : 'Cliente'}
          omniMessages={selectedContact.omniMessages || []}
        />
      )}

      {/* Modal: Create Contact */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('newContact')}>
        <form onSubmit={handleCreateContact} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('fullName')}</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={t('contacts.firstName')}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('contacts.lastName')}</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={t('contacts.lastName')}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('email')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@empresa.com"
              className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('phone')}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+34 600 000 000"
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('jobTitle')}</label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder={t('contacts.jobTitlePlaceholder', 'CEO / Responsable Compras')}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('companies')}</label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
            >
              <option value="">{t('contacts.unassignedCompany')}</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="isLeadCheck"
              checked={isLead}
              onChange={(e) => setIsLead(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isLeadCheck" className="text-xs text-gray-700 dark:text-slate-300">
              Registrar como Lead Comercial en Prospección
            </label>
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

      {/* Comprehensive Contact Sheet Modal */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  {detailModalContact ? detailModalContact.firstName?.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                    <span>{detailModalContact ? `${detailModalContact.firstName} ${detailModalContact.lastName}` : t('contactSheet')}</span>
                    {detailModalContact?.isLead ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                        Lead
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                        Cliente
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {detailModalContact?.position || 'Contacto'} {detailModalContact?.company?.name ? `@ ${detailModalContact.company.name}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {canEdit && !isEditingInModal && (
                  <button
                    type="button"
                    onClick={() => setIsEditingInModal(true)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{t('editRecord')}</span>
                  </button>
                )}
                {canDelete && detailModalContact && (
                  <button
                    type="button"
                    onClick={() => handleDeleteContact(detailModalContact.id, `${detailModalContact.firstName} ${detailModalContact.lastName}`)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    title={t('delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-2 px-6 border-b border-gray-200 dark:border-slate-800 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setDetailTab('info')}
                className={`py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  detailTab === 'info'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-slate-200'
                }`}
              >
                {t('generalInfo')}
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('company')}
                className={`py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  detailTab === 'company'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-slate-200'
                }`}
              >
                {t('companyTab')}
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('deals')}
                className={`py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  detailTab === 'deals'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-slate-200'
                }`}
              >
                {t('dealsTab')} ({detailModalContact?.deals?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('invoicing')}
                className={`py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  detailTab === 'invoicing'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-slate-200'
                }`}
              >
                {t('invoicingTab')}
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('messages')}
                className={`py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  detailTab === 'messages'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-slate-200'
                }`}
              >
                {t('timelineTab')}
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {isDetailLoading ? (
                <div className="p-12 text-center text-xs text-gray-400 flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>{t('loading')}</span>
                </div>
              ) : detailModalContact ? (
                <div>
                  {detailFormError && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center space-x-2 text-xs text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{detailFormError}</span>
                    </div>
                  )}

                  {/* TAB 1: General Info */}
                  {detailTab === 'info' && (
                    <div>
                      {isEditingInModal ? (
                        <form onSubmit={handleSaveDetailModal} className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('contacts.firstName')}</label>
                              <input
                                type="text"
                                required
                                value={detailFirstName}
                                onChange={(e) => setDetailFirstName(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('contacts.lastName')}</label>
                              <input
                                type="text"
                                required
                                value={detailLastName}
                                onChange={(e) => setDetailLastName(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('contacts.email')}</label>
                              <input
                                type="email"
                                required
                                value={detailEmail}
                                onChange={(e) => setDetailEmail(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('contacts.landline')}</label>
                              <input
                                type="tel"
                                value={detailPhone}
                                onChange={(e) => setDetailPhone(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('contacts.jobTitle')}</label>
                              <input
                                type="text"
                                value={detailPosition}
                                onChange={(e) => setDetailPosition(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('contacts.company')}</label>
                              <select
                                value={detailCompanyId}
                                onChange={(e) => setDetailCompanyId(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                              >
                                <option value="">{t('contacts.noCompanyOption')}</option>
                                {companies.map((co) => (
                                  <option key={co.id} value={co.id}>
                                    {co.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('notes')}</label>
                            <textarea
                              rows={3}
                              value={detailNotes}
                              onChange={(e) => setDetailNotes(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
                            />
                          </div>

                          <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                            <button
                              type="button"
                              onClick={() => setIsEditingInModal(false)}
                              className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 rounded-lg"
                            >
                              {t('cancel')}
                            </button>
                            <button
                              type="submit"
                              disabled={isSavingDetail}
                              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-50"
                            >
                              {isSavingDetail ? 'Guardando...' : t('save')}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                              <span className="text-gray-400 block mb-0.5">{t('email')}</span>
                              <span className="font-semibold text-gray-800 dark:text-slate-200">{detailModalContact.email}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                              <span className="text-gray-400 block mb-0.5">{t('phone')}</span>
                              <span className="font-semibold text-gray-800 dark:text-slate-200">{detailModalContact.phone || '—'}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                              <span className="text-gray-400 block mb-0.5">{t('jobTitle')}</span>
                              <span className="font-semibold text-gray-800 dark:text-slate-200">{detailModalContact.position || '—'}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                              <span className="text-gray-400 block mb-0.5">{t('companies')}</span>
                              <span className="font-semibold text-gray-800 dark:text-slate-200">{detailModalContact.company?.name || '—'}</span>
                            </div>
                          </div>

                          <div className="p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 space-y-1">
                            <span className="text-xs font-bold text-gray-700 dark:text-slate-300 block">{t('notes')}</span>
                            <p className="text-xs text-gray-600 dark:text-slate-400 whitespace-pre-wrap">
                              {detailModalContact.notes || 'Sin notas registradas.'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: Company */}
                  {detailTab === 'company' && (
                    <div>
                      {detailModalContact.company ? (
                        <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 space-y-3">
                          <div className="flex items-center space-x-3">
                            <div className="p-2.5 rounded-xl bg-blue-600 text-white">
                              <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-gray-900 dark:text-white">{detailModalContact.company.name}</h3>
                              <p className="text-xs text-gray-500">{detailModalContact.company.industry || 'Empresa'}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-gray-100 dark:border-slate-800">
                            <div>
                              <span className="text-gray-400 block">{t('city')}</span>
                              <span className="font-semibold">{detailModalContact.company.city || '—'}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 block">CIF</span>
                              <span className="font-semibold font-mono">{detailModalContact.company.taxId || '—'}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-8 text-center text-xs text-gray-400">
                          {t('noAssociatedCompany')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: Deals */}
                  {detailTab === 'deals' && (
                    <div className="space-y-2">
                      {detailModalContact.deals && detailModalContact.deals.length > 0 ? (
                        detailModalContact.deals.map((deal: any) => (
                          <div key={deal.id} className="p-3 rounded-xl border border-gray-200 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center space-x-2.5">
                              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600">
                                <DollarSign className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-gray-900 dark:text-white">{deal.title}</h4>
                                <span className="text-[11px] text-gray-400">Fase: {deal.stage?.name || 'Pipeline'}</span>
                              </div>
                            </div>
                            <span className="text-xs font-bold font-mono text-gray-900 dark:text-white">
                              {deal.value?.toLocaleString('es-ES', { style: 'currency', currency: deal.currency || 'EUR' })}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-xs text-gray-400">
                          {t('noAssociatedDeals')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: Invoicing */}
                  {detailTab === 'invoicing' && (
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-gray-700 dark:text-slate-300 block">{t('invoicing')}</span>
                      {detailModalContact.invoices && detailModalContact.invoices.length > 0 ? (
                        detailModalContact.invoices.map((inv: any) => (
                          <div key={inv.id} className="p-2.5 rounded-lg border border-gray-200 dark:border-slate-800 flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2">
                              <FileText className="w-3.5 h-3.5 text-indigo-500" />
                              <span className="font-semibold">{inv.invoiceNumber}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800">{inv.status}</span>
                            </div>
                            <span className="font-bold font-mono">{inv.total?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 italic">{t('noInvoices')}</p>
                      )}
                    </div>
                  )}

                  {/* TAB 5: Messages */}
                  {detailTab === 'messages' && (
                    <div className="space-y-2">
                      {detailModalContact.omniMessages && detailModalContact.omniMessages.length > 0 ? (
                        detailModalContact.omniMessages.map((msg: any) => (
                          <div key={msg.id} className="p-3 rounded-xl border border-gray-200 dark:border-slate-800 text-xs space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-gray-400">
                              <span className="font-semibold text-blue-600">{msg.channel} ({msg.direction})</span>
                              <span>{new Date(msg.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-gray-800 dark:text-slate-200">{msg.content || msg.text}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-xs text-gray-400">
                          {t('noMessages')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-1.5 rounded-xl font-semibold bg-gray-200 dark:bg-slate-800 text-gray-800 dark:text-slate-200 hover:bg-gray-300 dark:hover:bg-slate-700 text-xs transition-colors"
              >
                {t('closeSheet')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
