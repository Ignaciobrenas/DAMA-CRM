import React, { useState, useEffect } from 'react';
import { Plus, Search, Building2, Globe, Phone, Mail, MapPin, X } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { Modal } from '../components/common/Modal';
import { PermissionGate } from '../components/common/PermissionGate';

export const Companies: React.FC = () => {
  const { t } = useLanguage();
  const [companies, setCompanies] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [annualRevenue, setAnnualRevenue] = useState('');

  const loadCompanies = async () => {
    setIsLoading(true);
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await apiRequest(`/companies${query}`);
    if (res.success && res.data) {
      setCompanies(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadCompanies();
  }, [search]);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/companies', {
      method: 'POST',
      body: JSON.stringify({
        name,
        industry,
        website,
        phone,
        email,
        city,
        annualRevenue: annualRevenue ? parseFloat(annualRevenue) : null,
      }),
    });

    if (res.success) {
      setIsModalOpen(false);
      setName('');
      setIndustry('');
      setWebsite('');
      setPhone('');
      setEmail('');
      setCity('');
      setAnnualRevenue('');
      loadCompanies();
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
            {t('companiesSubtitle')}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchCompanies')}
              className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <PermissionGate resource="companies" action="create">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('newCompany')}</span>
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Grid of Companies */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((company) => (
          <div
            key={company.id}
            className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                    {company.name}
                  </h3>
                  <span className="text-[10px] text-gray-500 dark:text-slate-400">
                    {company.industry || t('noData')}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1 text-xs text-gray-600 dark:text-slate-300">
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
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline truncate"
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
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-gray-500 dark:text-slate-400">
              <span>Contactos: {company._count?.contacts || 0}</span>
              <span>Oportunidades: {company._count?.deals || 0}</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {company.annualRevenue
                  ? company.annualRevenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
                  : '—'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('newCompany')}
        size="md"
      >
        <form onSubmit={handleCreateCompany} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('companyName')}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('industry')}</label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('city')}</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('annualRevenue')}</label>
              <input
                type="number"
                value={annualRevenue}
                onChange={(e) => setAnnualRevenue(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('website')}</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('phone')}</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white"
              />
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
