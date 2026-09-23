import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Mail,
  Phone,
  Building2,
  User,
  MessageSquare,
  X,
  AlertCircle,
  Edit2,
  Trash2,
  ArrowUpDown,
  Filter,
  DollarSign,
  FileText,
  Receipt,
  Check,
  Copy,
  ExternalLink,
  Calendar,
  Shield,
  Sparkles,
  Smartphone,
  Briefcase,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { RecordDrawer } from '../components/crm/RecordDrawer';
import { isValidEmail, isValidPhone } from '../utils/validators';

export const Contacts: React.FC = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('contacts', 'update') || hasPermission('contacts', 'manage');
  const canDelete = hasPermission('contacts', 'delete') || hasPermission('contacts', 'manage');
  const canCreate = hasPermission('contacts', 'create') || hasPermission('contacts', 'manage');

  const [contacts, setContacts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Comprehensive Contact Detail Modal state
  const [detailModalContact, setDetailModalContact] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<'info' | 'company' | 'deals' | 'invoicing' | 'messages'>('info');
  const [isEditingInModal, setIsEditingInModal] = useState(false);

  // In-modal edit form fields
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
  const [detailFormError, setDetailFormError] = useState('');
  const [isSavingDetail, setIsSavingDetail] = useState(false);
  const [isCopiedEmail, setIsCopiedEmail] = useState(false);

  // Filters & Sorting state
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'LEAD' | 'CLIENT'>('ALL');
  const [companyFilter, setCompanyFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('NAME_ASC');

  // Create Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [isLead, setIsLead] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal state
  const [editingContact, setEditingContact] = useState<any | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editCompanyId, setEditCompanyId] = useState('');
  const [editIsLead, setEditIsLead] = useState(false);
  const [editFormError, setEditFormError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Confirmation state
  const [deletingContact, setDeletingContact] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadContacts = async () => {
    setIsLoading(true);
    const res = await apiRequest('/contacts?limit=500');
    if (res.success && res.data) {
      setContacts(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadContacts();
    apiRequest('/companies?limit=200').then((res) => {
      if (res.success) setCompanies(res.data || []);
    });
  }, []);

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setFormError('Nombre, apellidos y correo electrónico son obligatorios (*).');
      return;
    }

    if (!isValidEmail(email)) {
      setFormError('El correo electrónico no tiene un formato válido (ej. usuario@dominio.com).');
      return;
    }

    if (phone && !isValidPhone(phone)) {
      setFormError('El número de teléfono no tiene un formato válido.');
      return;
    }

    setIsSubmitting(true);
    const res = await apiRequest('/contacts', {
      method: 'POST',
      body: JSON.stringify({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        position: position ? position.trim() : null,
        companyId: companyId || null,
        isLead,
      }),
    });
    setIsSubmitting(false);

    if (res.success) {
      toast.success('Contacto creado', `${firstName} ${lastName} ha sido añadido con éxito.`);
      setIsModalOpen(false);
      setFormError('');
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setPosition('');
      setCompanyId('');
      setIsLead(false);
      loadContacts();
    } else {
      setFormError(res.message || 'Error al crear el contacto');
    }
  };

  const handleOpenEdit = (contact: any) => {
    setEditingContact(contact);
    setEditFirstName(contact.firstName || '');
    setEditLastName(contact.lastName || '');
    setEditEmail(contact.email || '');
    setEditPhone(contact.phone || '');
    setEditPosition(contact.position || '');
    setEditCompanyId(contact.companyId || contact.company?.id || '');
    setEditIsLead(!!contact.isLead);
    setEditFormError('');
  };

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;
    setEditFormError('');

    if (!editFirstName.trim() || !editLastName.trim() || !editEmail.trim()) {
      setEditFormError('Nombre, apellidos y correo electrónico son obligatorios (*).');
      return;
    }

    if (!isValidEmail(editEmail)) {
      setEditFormError('El correo electrónico no tiene un formato válido.');
      return;
    }

    if (editPhone && !isValidPhone(editPhone)) {
      setEditFormError('El teléfono no tiene un formato válido.');
      return;
    }

    setIsUpdating(true);
    const res = await apiRequest(`/contacts/${editingContact.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        email: editEmail.trim().toLowerCase(),
        phone: editPhone ? editPhone.trim() : null,
        position: editPosition ? editPosition.trim() : null,
        companyId: editCompanyId || null,
        isLead: editIsLead,
      }),
    });
    setIsUpdating(false);

    if (res.success) {
      toast.success('Contacto actualizado', 'Los datos del contacto se han guardado correctamente.');
      setEditingContact(null);
      loadContacts();
    } else {
      setEditFormError(res.message || 'Error al actualizar el contacto');
    }
  };

  const handleDeleteContact = async () => {
    if (!deletingContact) return;
    setIsDeleting(true);
    const res = await apiRequest(`/contacts/${deletingContact.id}`, {
      method: 'DELETE',
    });
    setIsDeleting(false);

    if (res.success) {
      toast.success('Contacto eliminado', `${deletingContact.firstName} ${deletingContact.lastName} fue eliminado.`);
      setDeletingContact(null);
      loadContacts();
    } else {
      toast.error('Error al eliminar', res.message || 'No se pudo eliminar el contacto');
    }
  };

  const openTimeline = async (id: string) => {
    const res = await apiRequest(`/contacts/${id}`);
    if (res.success) {
      setSelectedContact(res.data);
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
      setDetailCompanyId(c.companyId || c.company?.id || '');
      setDetailIsLead(Boolean(c.isLead));
      setDetailNotes(c.notes || '');
    } else {
      toast.error('Error al cargar', 'No se pudieron obtener los datos completos del contacto.');
      setIsDetailModalOpen(false);
    }
    setIsDetailLoading(false);
  };

  const handleSaveDetail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailModalContact) return;
    setDetailFormError('');

    if (!detailFirstName.trim() || !detailLastName.trim() || !detailEmail.trim()) {
      setDetailFormError('Nombre, apellidos y correo electrónico son obligatorios (*).');
      return;
    }

    if (!isValidEmail(detailEmail)) {
      setDetailFormError('El correo electrónico no tiene un formato válido.');
      return;
    }

    if (detailPhone && !isValidPhone(detailPhone)) {
      setDetailFormError('El teléfono fijo no tiene un formato válido.');
      return;
    }

    if (detailMobile && !isValidPhone(detailMobile)) {
      setDetailFormError('El teléfono móvil no tiene un formato válido.');
      return;
    }

    setIsSavingDetail(true);
    const res = await apiRequest(`/contacts/${detailModalContact.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        firstName: detailFirstName.trim(),
        lastName: detailLastName.trim(),
        email: detailEmail.trim().toLowerCase(),
        phone: detailPhone ? detailPhone.trim() : null,
        mobile: detailMobile ? detailMobile.trim() : null,
        position: detailPosition ? detailPosition.trim() : null,
        department: detailDepartment ? detailDepartment.trim() : null,
        companyId: detailCompanyId || null,
        isLead: detailIsLead,
        notes: detailNotes ? detailNotes.trim() : null,
      }),
    });
    setIsSavingDetail(false);

    if (res.success && res.data) {
      toast.success('Contacto Actualizado', 'Los datos del contacto se han guardado con éxito.');
      setDetailModalContact((prev: any) => ({ ...prev, ...res.data }));
      setIsEditingInModal(false);
      loadContacts();
    } else {
      setDetailFormError(res.message || 'Error al actualizar el contacto');
    }
  };

  // Filter and sort contacts
  const filteredAndSortedContacts = useMemo(() => {
    return contacts
      .filter((contact) => {
        // Search filter
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          const fullName = `${contact.firstName || ''} ${contact.lastName || ''}`.toLowerCase();
          const email = (contact.email || '').toLowerCase();
          const phone = (contact.phone || '').toLowerCase();
          const compName = (contact.company?.name || '').toLowerCase();
          const pos = (contact.position || '').toLowerCase();
          if (!fullName.includes(q) && !email.includes(q) && !phone.includes(q) && !compName.includes(q) && !pos.includes(q)) {
            return false;
          }
        }

        // Type filter
        if (typeFilter === 'LEAD' && !contact.isLead) return false;
        if (typeFilter === 'CLIENT' && contact.isLead) return false;

        // Company filter
        if (companyFilter !== 'ALL') {
          const cId = contact.companyId || contact.company?.id;
          if (cId !== companyFilter) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'NAME_ASC') {
          const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
          const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
          return nameA.localeCompare(nameB);
        }
        if (sortBy === 'NAME_DESC') {
          const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
          const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
          return nameB.localeCompare(nameA);
        }
        if (sortBy === 'EMAIL_ASC') {
          return (a.email || '').localeCompare(b.email || '');
        }
        if (sortBy === 'NEWEST') {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        if (sortBy === 'OLDEST') {
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        }
        return 0;
      });
  }, [contacts, search, typeFilter, companyFilter, sortBy]);

  return (
    <div className="space-y-4">
      {/* Header & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t('contacts')}
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Directorio unificado de personas de contacto y leads con gestión CRUD y filtrado integral
          </p>
        </div>

        <button
          onClick={() => {
            setFormError('');
            setIsModalOpen(true);
          }}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t('newContact')}</span>
        </button>
      </div>

      {/* Filter and Sorting Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, email, teléfono..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 transition-colors"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">Todos los tipos</option>
              <option value="LEAD">Leads</option>
              <option value="CLIENT">Clientes</option>
            </select>
          </div>

          {/* Company Filter */}
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 max-w-[180px] truncate"
          >
            <option value="ALL">Todas las empresas</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
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
            <option value="EMAIL_ASC">Email (A - Z)</option>
            <option value="NEWEST">Más recientes</option>
            <option value="OLDEST">Más antiguos</option>
          </select>
        </div>
      </div>

      {/* High Density Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
            <thead className="bg-gray-50 dark:bg-slate-800/60 text-[11px] font-semibold text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Puesto</th>
                <th className="px-4 py-3">Email & Teléfono</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    Cargando directorio de contactos...
                  </td>
                </tr>
              ) : filteredAndSortedContacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    No se encontraron contactos que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                filteredAndSortedContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    onClick={() => handleOpenDetailModal(contact.id)}
                    className="hover:bg-blue-50/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                    title="Haz clic para ver toda la información de este contacto"
                  >
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
                          <Building2 className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="truncate max-w-[150px]">{contact.company.name}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">{contact.position || '—'}</td>
                    <td className="px-4 py-2.5 space-y-0.5">
                      <div className="flex items-center space-x-1 text-gray-700 dark:text-slate-300">
                        <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{contact.email}</span>
                      </div>
                      {contact.phone && (
                        <div className="flex items-center space-x-1 text-[11px] text-gray-500">
                          <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {contact.isLead ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          Lead
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                          Cliente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="inline-flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenDetailModal(contact.id)}
                          title="Ver Ficha Completa"
                          className="inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 transition-colors"
                        >
                          <User className="w-3 h-3" />
                          <span className="hidden sm:inline">Detalles</span>
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEdit(contact)}
                            title="Editar Contacto"
                            className="p-1.5 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeletingContact(contact)}
                            title="Eliminar Contacto"
                            className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity, Custom Fields & Omnichannel Timeline Drawer */}
      {selectedContact && (
        <RecordDrawer
          isOpen={!!selectedContact}
          onClose={() => setSelectedContact(null)}
          entityType="CONTACT"
          entityId={selectedContact.id}
          title={`${selectedContact.firstName} ${selectedContact.lastName}`}
          subtitle={`${selectedContact.company?.name ? selectedContact.company.name + ' • ' : ''}${selectedContact.email}`}
          extraBadge={selectedContact.isLead ? 'Lead' : 'Cliente'}
          omniMessages={selectedContact.omniMessages || []}
        />
      )}

      {/* Create Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t('newContact')}</h2>
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

            <form onSubmit={handleCreateContact} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ej. Laura"
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Apellidos <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ej. Gómez"
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@empresa.com"
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+34 600 000 000"
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Cargo</label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Directora de Operaciones"
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Empresa</label>
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

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="createIsLead"
                  checked={isLead}
                  onChange={(e) => setIsLead(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="createIsLead" className="text-xs text-gray-700 dark:text-slate-300">
                  Marcar como Lead potencial (no cliente formal aún)
                </label>
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

      {/* Edit Contact Modal */}
      {editingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Editar Contacto</h2>
              <button onClick={() => setEditingContact(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {editFormError && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center space-x-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editFormError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateContact} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Apellidos <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Cargo</label>
                  <input
                    type="text"
                    value={editPosition}
                    onChange={(e) => setEditPosition(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Empresa</label>
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

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsLead"
                  checked={editIsLead}
                  onChange={(e) => setEditIsLead(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="editIsLead" className="text-xs text-gray-700 dark:text-slate-300">
                  Marcar como Lead potencial
                </label>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-gray-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingContact(null)}
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
      {deletingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-800 p-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">Eliminar Contacto</h2>
            <p className="text-xs text-gray-600 dark:text-slate-400 mb-5">
              ¿Estás seguro de que deseas eliminar a{' '}
              <strong className="text-gray-900 dark:text-white">
                {deletingContact.firstName} {deletingContact.lastName}
              </strong>
              ? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDeletingContact(null)}
                disabled={isDeleting}
                className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteContact}
                disabled={isDeleting}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg shadow-xs"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Contact Detail & In-Place Edit Modal */}
      {isDetailModalOpen && (
        <div
          onClick={() => setIsDetailModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/50 flex items-start justify-between gap-3">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-extrabold text-base flex items-center justify-center shadow-md shrink-0">
                  {detailModalContact?.firstName ? detailModalContact.firstName.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                      {detailModalContact ? `${detailModalContact.firstName} ${detailModalContact.lastName}` : 'Cargando contacto...'}
                    </h2>
                    {detailModalContact && (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          detailModalContact.isLead
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300'
                        }`}
                      >
                        {detailModalContact.isLead ? 'Lead' : 'Cliente Oficial'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    {detailModalContact?.position && <span>{detailModalContact.position}</span>}
                    {detailModalContact?.company && (
                      <span className="flex items-center gap-1 font-semibold text-gray-700 dark:text-slate-300">
                        • <Building2 className="w-3 h-3 text-gray-400" /> {detailModalContact.company.name}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center space-x-2 shrink-0">
                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingInModal(!isEditingInModal);
                      setDetailFormError('');
                    }}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      isEditingInModal
                        ? 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200'
                        : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-100'
                    }`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{isEditingInModal ? 'Ver Detalles' : 'Editar Ficha'}</span>
                  </button>
                ) : (
                  <span className="hidden sm:inline-flex items-center space-x-1 text-[11px] font-medium text-gray-400 bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                    <Shield className="w-3 h-3 text-gray-400" />
                    <span>Solo lectura</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  title="Cerrar ventana"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-1 px-4 py-2 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto text-xs">
              <button
                type="button"
                onClick={() => setDetailTab('info')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  detailTab === 'info'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                Información Personal
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('company')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  detailTab === 'company'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                Empresa Asignada
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('deals')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  detailTab === 'deals'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                Ventas ({detailModalContact?.deals?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('invoicing')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  detailTab === 'invoicing'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                Facturación ({(detailModalContact?.invoices?.length || 0) + (detailModalContact?.quotes?.length || 0)})
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('messages')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  detailTab === 'messages'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                Comunicaciones ({detailModalContact?.omniMessages?.length || 0})
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {isDetailLoading ? (
                <div className="p-12 text-center text-xs text-gray-400 space-y-2">
                  <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p>Cargando información del contacto...</p>
                </div>
              ) : detailModalContact ? (
                <div>
                  {/* TAB 1: Información Personal (Lectura o Edición) */}
                  {detailTab === 'info' && (
                    <div>
                      {isEditingInModal ? (
                        /* In-Place Editing Form */
                        <form onSubmit={handleSaveDetail} className="space-y-4">
                          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
                            <span className="text-xs font-bold text-gray-800 dark:text-slate-200">
                              Modificar Datos del Contacto
                            </span>
                            <span className="text-[11px] text-blue-600 font-semibold">
                              Permisos de edición activos
                            </span>
                          </div>

                          {detailFormError && (
                            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center space-x-2 text-xs text-red-600 dark:text-red-400">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>{detailFormError}</span>
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                Nombre <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={detailFirstName}
                                onChange={(e) => setDetailFirstName(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                Apellidos <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={detailLastName}
                                onChange={(e) => setDetailLastName(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                Correo Electrónico <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="email"
                                required
                                value={detailEmail}
                                onChange={(e) => setDetailEmail(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                Teléfono Fijo
                              </label>
                              <input
                                type="text"
                                value={detailPhone}
                                onChange={(e) => setDetailPhone(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                Teléfono Móvil
                              </label>
                              <input
                                type="text"
                                value={detailMobile}
                                onChange={(e) => setDetailMobile(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                Cargo o Puesto
                              </label>
                              <input
                                type="text"
                                value={detailPosition}
                                onChange={(e) => setDetailPosition(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                Departamento
                              </label>
                              <input
                                type="text"
                                value={detailDepartment}
                                onChange={(e) => setDetailDepartment(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                Empresa Vinculada
                              </label>
                              <select
                                value={detailCompanyId}
                                onChange={(e) => setDetailCompanyId(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                              >
                                <option value="">Sin empresa asociada</option>
                                {companies.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center pt-5">
                              <label className="relative flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={detailIsLead}
                                  onChange={(e) => setDetailIsLead(e.target.checked)}
                                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                                  Marcar como Lead Comercial
                                </span>
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                              Notas Internas
                            </label>
                            <textarea
                              rows={2}
                              value={detailNotes}
                              onChange={(e) => setDetailNotes(e.target.value)}
                              placeholder="Anotaciones clave sobre este contacto..."
                              className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
                            />
                          </div>

                          <div className="pt-3 flex justify-end space-x-2 border-t border-gray-200 dark:border-slate-800">
                            <button
                              type="button"
                              onClick={() => setIsEditingInModal(false)}
                              className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              disabled={isSavingDetail}
                              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs"
                            >
                              {isSavingDetail ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                          </div>
                        </form>
                      ) : (
                        /* Read-Only Structured View */
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 space-y-2.5">
                              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                                Canales de Contacto
                              </span>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Email:</span>
                                <div className="flex items-center space-x-1.5">
                                  <a href={`mailto:${detailModalContact.email}`} className="font-semibold text-blue-600 hover:underline">
                                    {detailModalContact.email}
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(detailModalContact.email);
                                      setIsCopiedEmail(true);
                                      setTimeout(() => setIsCopiedEmail(false), 2000);
                                    }}
                                    className="p-1 rounded text-gray-400 hover:text-gray-600"
                                    title="Copiar email"
                                  >
                                    {isCopiedEmail ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Teléfono:</span>
                                <span className="font-semibold text-gray-800 dark:text-slate-200">
                                  {detailModalContact.phone ? (
                                    <a href={`tel:${detailModalContact.phone}`} className="text-blue-600 hover:underline">
                                      {detailModalContact.phone}
                                    </a>
                                  ) : (
                                    'No especificado'
                                  )}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Móvil:</span>
                                <span className="font-semibold text-gray-800 dark:text-slate-200">
                                  {detailModalContact.mobile ? (
                                    <a href={`tel:${detailModalContact.mobile}`} className="text-blue-600 hover:underline">
                                      {detailModalContact.mobile}
                                    </a>
                                  ) : (
                                    'No especificado'
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 space-y-2.5">
                              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                                Posición & Clasificación
                              </span>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Cargo:</span>
                                <span className="font-semibold text-gray-800 dark:text-slate-200">
                                  {detailModalContact.position || 'No especificado'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Departamento:</span>
                                <span className="font-semibold text-gray-800 dark:text-slate-200">
                                  {detailModalContact.department || 'No especificado'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Empresa:</span>
                                <span className="font-semibold text-gray-800 dark:text-slate-200">
                                  {detailModalContact.company?.name || 'Independiente'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Notes */}
                          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                              Notas Internas
                            </span>
                            <p className="text-xs text-gray-700 dark:text-slate-300 whitespace-pre-wrap">
                              {detailModalContact.notes || 'No se han registrado notas internas para este contacto.'}
                            </p>
                          </div>

                          {/* Metadata */}
                          <div className="flex items-center justify-between text-[11px] text-gray-400 px-1">
                            <span>Registrado el: {new Date(detailModalContact.createdAt).toLocaleString()}</span>
                            <span>Última modificación: {new Date(detailModalContact.updatedAt).toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: Empresa Asignada */}
                  {detailTab === 'company' && (
                    <div className="space-y-4">
                      {detailModalContact.company ? (
                        <div className="space-y-3">
                          <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-2.5 rounded-xl bg-blue-600 text-white">
                                <Building2 className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                  {detailModalContact.company.name}
                                </h3>
                                <p className="text-xs text-gray-500">
                                  {detailModalContact.company.industry || 'Sector no especificado'}
                                </p>
                              </div>
                            </div>
                            {detailModalContact.company.taxId && (
                              <span className="text-xs font-mono px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 font-semibold">
                                CIF: {detailModalContact.company.taxId}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-xl border border-gray-200 dark:border-slate-800">
                              <span className="text-gray-400 block mb-0.5">Ubicación</span>
                              <span className="font-semibold text-gray-800 dark:text-slate-200">
                                {[detailModalContact.company.address, detailModalContact.company.city, detailModalContact.company.country].filter(Boolean).join(', ') || 'No indicada'}
                              </span>
                            </div>
                            <div className="p-3 rounded-xl border border-gray-200 dark:border-slate-800">
                              <span className="text-gray-400 block mb-0.5">Sitio Web</span>
                              {detailModalContact.company.website ? (
                                <a href={detailModalContact.company.website} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 hover:underline flex items-center space-x-1">
                                  <span>{detailModalContact.company.website}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-gray-500 font-semibold">No registrado</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-8 text-center text-xs text-gray-400">
                          Este contacto no está vinculado a ninguna empresa.
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: Deals & Oportunidades */}
                  {detailTab === 'deals' && (
                    <div className="space-y-3">
                      {detailModalContact.deals && detailModalContact.deals.length > 0 ? (
                        detailModalContact.deals.map((deal: any) => (
                          <div key={deal.id} className="p-3 rounded-xl border border-gray-200 dark:border-slate-800 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-center space-x-2.5">
                              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                                <DollarSign className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-gray-900 dark:text-white">{deal.title}</h4>
                                <span className="text-[11px] text-gray-400">
                                  Fase: {deal.stage?.name || 'Pipeline'} • Estado: {deal.status}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs font-bold font-mono text-gray-900 dark:text-white">
                              {deal.value?.toLocaleString('es-ES', { style: 'currency', currency: deal.currency || 'EUR' })}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-xs text-gray-400">
                          No hay oportunidades comerciales (deals) asociadas a este contacto.
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: Facturación */}
                  {detailTab === 'invoicing' && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-gray-700 dark:text-slate-300">Facturas</span>
                        {detailModalContact.invoices && detailModalContact.invoices.length > 0 ? (
                          detailModalContact.invoices.map((inv: any) => (
                            <div key={inv.id} className="p-2.5 rounded-lg border border-gray-200 dark:border-slate-800 flex items-center justify-between text-xs">
                              <div className="flex items-center space-x-2">
                                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                                <span className="font-semibold">{inv.invoiceNumber}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 font-medium">{inv.status}</span>
                              </div>
                              <span className="font-bold font-mono">{inv.total?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-400 italic">Sin facturas emitidas a este contacto.</p>
                        )}
                      </div>

                      <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                        <span className="text-xs font-bold text-gray-700 dark:text-slate-300">Presupuestos / Cotizaciones</span>
                        {detailModalContact.quotes && detailModalContact.quotes.length > 0 ? (
                          detailModalContact.quotes.map((q: any) => (
                            <div key={q.id} className="p-2.5 rounded-lg border border-gray-200 dark:border-slate-800 flex items-center justify-between text-xs">
                              <div className="flex items-center space-x-2">
                                <Receipt className="w-3.5 h-3.5 text-teal-500" />
                                <span className="font-semibold">{q.quoteNumber}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 font-medium">{q.status}</span>
                              </div>
                              <span className="font-bold font-mono">{q.total?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-400 italic">Sin presupuestos emitidos.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 5: Comunicaciones / Timeline */}
                  {detailTab === 'messages' && (
                    <div className="space-y-2.5">
                      {detailModalContact.omniMessages && detailModalContact.omniMessages.length > 0 ? (
                        detailModalContact.omniMessages.map((msg: any) => (
                          <div key={msg.id} className="p-3 rounded-xl border border-gray-200 dark:border-slate-800 text-xs space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-gray-400">
                              <span className="font-semibold text-blue-600 dark:text-blue-400">{msg.channel} ({msg.direction})</span>
                              <span>{new Date(msg.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-gray-800 dark:text-slate-200">{msg.content || msg.text}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-xs text-gray-400">
                          No se han registrado mensajes u omnicanalidad para este contacto.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-slate-400">
                {canEdit ? 'Puedes editar todos los campos pulsando "Editar Ficha"' : 'Modo consulta (permisos de lectura)'}
              </span>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-1.5 rounded-xl font-semibold bg-gray-200 dark:bg-slate-800 text-gray-800 dark:text-slate-200 hover:bg-gray-300 dark:hover:bg-slate-700 transition-colors"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
