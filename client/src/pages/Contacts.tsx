import React, { useState, useEffect } from 'react';
import { Plus, Search, Mail, Phone, Building2, User, MessageSquare, X } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { RecordDrawer } from '../components/crm/RecordDrawer';
import { Modal } from '../components/common/Modal';
import { PermissionGate } from '../components/common/PermissionGate';

export const Contacts: React.FC = () => {
  const { t } = useLanguage();
  const [contacts, setContacts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [isLead, setIsLead] = useState(false);

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
      setIsModalOpen(false);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setPosition('');
      setCompanyId('');
      loadContacts();
    }
  };

  const openTimeline = async (id: string) => {
    const res = await apiRequest(`/contacts/${id}`);
    if (res.success) {
      setSelectedContact(res.data);
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

      {/* High Density Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-slate-300">
            <thead className="bg-gray-50 dark:bg-slate-800/60 text-[11px] font-semibold text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">{t('fullName')}</th>
                <th className="px-4 py-3">{t('companies')}</th>
                <th className="px-4 py-3">{t('jobTitle')}</th>
                <th className="px-4 py-3">{t('email')} & {t('phone')}</th>
                <th className="px-4 py-3">{t('status')}</th>
                <th className="px-4 py-3 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-2.5 font-bold text-gray-900 dark:text-white">
                    {contact.firstName} {contact.lastName}
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
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => openTimeline(contact.id)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Timeline</span>
                    </button>
                  </td>
                </tr>
              ))}
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
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('newContact')}
        size="md"
      >
        <form onSubmit={handleCreateContact} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('fullName')}</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('details')}</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
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
              className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('phone')}</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('jobTitle')}</label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('dealCompany')}</label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
            >
              <option value="">-- {t('noData')} --</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
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
