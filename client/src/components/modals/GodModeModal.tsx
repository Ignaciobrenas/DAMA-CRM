import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Plus,
  X,
  Building2,
  Users,
  Ticket,
  Link,
  Copy,
  Check,
  Sparkles,
  Send,
} from 'lucide-react';
import { api, apiRequest } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../context/LanguageContext';

interface Tenant {
  id: string;
  slug: string;
  name: string;
  domain?: string;
  isGodTenant: boolean;
  status: string;
  plan: string;
  maxUsers: number;
  usersCount?: number;
  dealsVolume?: number;
  paidInvoicesVolume?: number;
  openTicketsCount?: number;
  createdAt: string;
}

interface GodModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTenantSlug: string;
  onSelectTenant: (tenant: Tenant) => void;
}

export const GodModeModal: React.FC<GodModeModalProps> = ({
  isOpen,
  onClose,
  activeTenantSlug,
  onSelectTenant,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'create' | 'invite'>('list');

  // New tenant form state
  const [newSlug, setNewSlug] = useState('');
  const [newName, setNewName] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [newPlan, setNewPlan] = useState('PRO');
  const [newMaxUsers, setNewMaxUsers] = useState(25);
  const [submitting, setSubmitting] = useState(false);

  // Onboarding invitation state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteCompanyName, setInviteCompanyName] = useState('');
  const [inviteSlug, setInviteSlug] = useState('');
  const [invitePlan, setInvitePlan] = useState('PRO');
  const [inviteMaxUsers, setInviteMaxUsers] = useState(15);
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTenants();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await api.get('/god/tenants');
      if (res.data?.success) {
        setTenants(res.data.data);
      }
    } catch (err: any) {
      toast.error(t('godMode.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlug || !newName) {
      toast.error(t('godMode.requiredFields'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/god/tenants', {
        slug: newSlug,
        name: newName,
        domain: newDomain || `${newSlug}.damacrm.com`,
        plan: newPlan,
        maxUsers: newMaxUsers,
      });

      if (res.data?.success) {
        toast.success(t('godMode.tenantCreated'));
        setActiveSubTab('list');
        setNewSlug('');
        setNewName('');
        setNewDomain('');
        fetchTenants();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('godMode.createError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) {
      toast.error('Indica el email del administrador');
      return;
    }

    setIsGeneratingInvite(true);
    try {
      const res = await apiRequest('/onboarding/invite', {
        method: 'POST',
        body: JSON.stringify({
          adminEmail: inviteEmail,
          companyName: inviteCompanyName,
          suggestedSlug: inviteSlug,
          plan: invitePlan,
          maxUsers: Number(inviteMaxUsers),
        }),
      });

      if (res.success && res.data) {
        const link = res.data.onboardingUrl || `${window.location.origin}/onboarding?token=${res.data.token}`;
        setGeneratedInviteLink(link);
        toast.success('Enlace de Onboarding generado', 'Copia el enlace y envíaselo al cliente');
      } else {
        toast.error('Error', res.message || 'No se pudo generar la invitación');
      }
    } catch {
      toast.error('Error de conexión al generar invitación');
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedInviteLink) return;
    navigator.clipboard.writeText(generatedInviteLink);
    setIsCopied(true);
    toast.success('Enlace copiado al portapapeles');
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleToggleStatus = async (tenant: Tenant) => {
    if (tenant.isGodTenant) return;
    try {
      const res = await api.patch(`/god/tenants/${tenant.id}/status`, {
        status: tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
      });
      if (res.data?.success) {
        toast.success(res.data.message);
        fetchTenants();
      }
    } catch (err: any) {
      toast.error(t('godMode.statusError'));
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {t('godMode.title')}
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono font-medium">
                  SuperAdmin
                </span>
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('godMode.subtitle')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveSubTab('list')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeSubTab === 'list'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Empresas ({tenants.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('invite')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1 ${
                  activeSubTab === 'invite'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Link className="w-3 h-3" />
                <span>Invitar Empresa</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('create')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1 ${
                  activeSubTab === 'create'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Plus className="w-3 h-3" />
                <span>Aprovisionar Directo</span>
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Invite / Send Onboarding Link Form */}
          {activeSubTab === 'invite' && (
            <div className="space-y-4">
              <form
                onSubmit={handleGenerateInvite}
                className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-4"
              >
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Generar Enlace de Onboarding para Administrador de Empresa
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Crea una invitación tokenizada para que el cliente configure su tenant, suba su logo, elija su paleta de colores y cree los primeros usuarios de su equipo.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email del Administrador de la Empresa *
                    </label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="admin@empresa-cliente.com"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nombre de la Empresa (Opcional)
                    </label>
                    <input
                      type="text"
                      value={inviteCompanyName}
                      onChange={(e) => setInviteCompanyName(e.target.value)}
                      placeholder="p.ej. Innova Consulting SL"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Slug Sugerido (Opcional)
                    </label>
                    <input
                      type="text"
                      value={inviteSlug}
                      onChange={(e) => setInviteSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      placeholder="innova-consulting"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Plan Asignado
                    </label>
                    <select
                      value={invitePlan}
                      onChange={(e) => setInvitePlan(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                    >
                      <option value="STARTER">Starter (5 usuarios)</option>
                      <option value="PRO">Pro (25 usuarios)</option>
                      <option value="ENTERPRISE">Enterprise (100 usuarios)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isGeneratingInvite}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isGeneratingInvite ? 'Generando...' : 'Generar Enlace de Invitación'}</span>
                  </button>
                </div>
              </form>

              {/* Generated Link Display */}
              {generatedInviteLink && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      Enlace de Onboarding Listo
                    </span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Válido por 7 días</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedInviteLink}
                      className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg text-slate-800 dark:text-slate-200 font-mono select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shrink-0"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Create Tenant Directly Form */}
          {activeSubTab === 'create' && (
            <form
              onSubmit={handleCreateTenant}
              className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-4"
            >
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {t('godMode.provisionTitle')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    {t('godMode.companyName')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      if (!newSlug) {
                        setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                      }
                    }}
                    placeholder="e.g. Acme Corporation"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    {t('godMode.slug')} * (Subdominio)
                  </label>
                  <input
                    type="text"
                    required
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    placeholder="acme"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    {t('godMode.plan')}
                  </label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
                  >
                    <option value="STARTER">Starter</option>
                    <option value="PRO">Pro</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    {t('godMode.maxUsers')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={newMaxUsers}
                    onChange={(e) => setNewMaxUsers(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('list')}
                  className="px-4 py-2 text-sm rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50"
                >
                  {submitting ? t('common.saving') : t('godMode.createAction')}
                </button>
              </div>
            </form>
          )}

          {/* Tenants List */}
          {activeSubTab === 'list' && (
            <>
              {loading ? (
                <div className="py-12 text-center text-slate-400">
                  <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  {t('common.loading')}
                </div>
              ) : tenants.length === 0 ? (
                <div className="py-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
                  <Building2 className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-500" />
                  <p className="text-sm font-semibold">{t('godMode.noTenants') || 'No se han encontrado empresas registradas en esta plataforma.'}</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">Puedes aprovisionar la primera empresa directamente o invitar a un administrador.</p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('create')}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
                    >
                      Aprovisionar Empresa
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tenants.map((tenant) => {
                    const isActiveContext = tenant.slug === activeTenantSlug;
                    return (
                      <div
                        key={tenant.id}
                        className={`p-5 rounded-xl border transition relative flex flex-col justify-between ${
                          isActiveContext
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-md ring-2 ring-blue-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                                  {tenant.name}
                                </h4>
                                {tenant.isGodTenant && (
                                  <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold">
                                    GOD
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                {tenant.domain || `${tenant.slug}.damacrm.com`}
                              </span>
                            </div>
                            <span
                              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                tenant.status === 'ACTIVE'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {tenant.status}
                            </span>
                          </div>

                          {/* Metrics Pill Grid */}
                          <div className="grid grid-cols-3 gap-2 my-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg text-xs">
                            <div>
                              <span className="text-slate-400 block">{t('godMode.plan')}</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {tenant.plan}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">{t('godMode.users')}</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {tenant.usersCount || 0} / {tenant.maxUsers}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">{t('godMode.openTickets')}</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {tenant.openTicketsCount || 0}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                          {!tenant.isGodTenant && (
                            <button
                              onClick={() => handleToggleStatus(tenant)}
                              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
                            >
                              {tenant.status === 'ACTIVE' ? t('godMode.suspend') : t('godMode.reactivate')}
                            </button>
                          )}
                          <div className="ml-auto">
                            {isActiveContext ? (
                              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>{t('godMode.activeContext')}</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  onSelectTenant(tenant);
                                  onClose();
                                }}
                                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-black dark:bg-slate-700 dark:hover:bg-slate-600 text-white transition shadow-xs"
                              >
                                {t('godMode.switchTenant')} →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
