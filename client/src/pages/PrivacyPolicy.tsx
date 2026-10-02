import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Eye,
  FileText,
  Mail,
  Download,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  ArrowLeft,
  UserCheck,
  RefreshCw,
  Database,
  Globe,
  Cookie,
  Key,
  Send,
} from 'lucide-react';
import { useBranding } from '../context/BrandingContext';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../services/api';
import { LoadingSpinner } from '../components/common/Loading';
import { useToast } from '../context/ToastContext';

interface PrivacyPolicyProps {
  onBack?: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  const { t } = useLanguage();
  const { branding } = useBranding();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'policy' | 'arco_form' | 'cookies' | 'preferences' | 'export'>('policy');

  // RGPD Preferences State
  const [userEmail, setUserEmail] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [consentStatus, setConsentStatus] = useState<string>('');
  const [isUpdatingConsent, setIsUpdatingConsent] = useState(false);

  // Data Export State
  const [exportEmail, setExportEmail] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string>('');

  // ARCO Request Form State
  const [arcoType, setArcoType] = useState<'access' | 'rectification' | 'erasure' | 'opposition' | 'portability' | 'limitation'>('access');
  const [arcoName, setArcoName] = useState('');
  const [arcoEmail, setArcoEmail] = useState('');
  const [arcoDni, setArcoDni] = useState('');
  const [arcoDetails, setArcoDetails] = useState('');
  const [isSubmittingArco, setIsSubmittingArco] = useState(false);
  const [arcoTicketResult, setArcoTicketResult] = useState<string>('');

  const handleToggleConsent = async (nextVal: boolean) => {
    if (!userEmail) {
      setConsentStatus(t('privacy.enterEmailError', 'Por favor, indica tu dirección de correo electrónico.'));
      return;
    }

    setIsUpdatingConsent(true);
    setConsentStatus('');
    try {
      const res = await apiRequest('/lead-capture/consent', {
        method: 'POST',
        body: JSON.stringify({
          email: userEmail,
          consent: nextVal,
          source: 'privacy_policy_page',
        }),
      });

      setIsUpdatingConsent(false);
      if (res.success) {
        setMarketingConsent(nextVal);
        setConsentStatus(res.message || t('privacy.consentSaved', 'Preferencia guardada con éxito.'));
        toast.success(t('privacy.consentUpdated', 'Consentimiento Actualizado'), res.message);
      } else {
        setConsentStatus(res.message || t('privacy.consentError', 'Error al actualizar el consentimiento.'));
      }
    } catch {
      setIsUpdatingConsent(false);
      setConsentStatus(t('privacy.serverConnError', 'Error de conexión con el servidor de privacidad.'));
    }
  };

  const handleExportData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportEmail) return;

    setIsExporting(true);
    setExportMessage('');

    try {
      const res = await apiRequest(`/lead-capture/privacy-export?email=${encodeURIComponent(exportEmail)}`);
      setIsExporting(false);

      if (res.success && res.data) {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `datos-privacidad-${exportEmail}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        setExportMessage(t('privacy.exportSuccess', 'Tus datos han sido recopilados y descargados en formato estructurado JSON.'));
        toast.success(t('privacy.dataDownloaded', 'Datos Descargados'), t('privacy.jsonReady', 'Archivo JSON generado correctamente.'));
      } else {
        setExportMessage(res.message || t('privacy.noRecordsFound', 'No se encontraron registros asociados al correo indicado.'));
      }
    } catch {
      setIsExporting(false);
      setExportMessage(t('privacy.exportError', 'Error al generar la exportación de datos.'));
    }
  };

  const handleSubmitArco = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arcoEmail || !arcoName) return;

    setIsSubmittingArco(true);
    setArcoTicketResult('');

    try {
      const res = await apiRequest('/lead-capture/arco-request', {
        method: 'POST',
        body: JSON.stringify({
          rightType: arcoType,
          fullName: arcoName,
          email: arcoEmail,
          dniPassport: arcoDni,
          details: arcoDetails,
        }),
      });

      setIsSubmittingArco(false);
      if (res.success) {
        setArcoTicketResult(res.message || 'Solicitud registrada correctamente.');
        toast.success(t('privacy.arcoTicketCreated', 'Expediente ARCO Creado'), `Ticket ID: ${res.ticketNumber}`);
        setArcoDetails('');
      } else {
        toast.error(t('error'), res.message || t('privacy.arcoError', 'No se pudo enviar la solicitud.'));
      }
    } catch {
      setIsSubmittingArco(false);
      toast.error(t('error'), t('privacy.serverConnError', 'Error de conexión con el servidor.'));
    }
  };

  const cookiesList = [
    {
      name: 'dama_jwt',
      category: t('privacy.essential', 'Esencial / Técnico'),
      provider: t('privacy.own', 'Propio (DAMA-CRM)'),
      expiry: t('privacy.sessionDays', '7 días'),
      purpose: t('privacy.cookieJwtPurpose', 'Autenticación segura del usuario mediante token firmado JWT HTTP-Only.'),
    },
    {
      name: 'dama_lang',
      category: t('privacy.preferencesCategory', 'Preferencias'),
      provider: t('privacy.own', 'Propio (DAMA-CRM)'),
      expiry: t('privacy.oneYear', '1 año'),
      purpose: t('privacy.cookieLangPurpose', 'Almacenar el idioma seleccionado (ES/EN) para la interfaz.'),
    },
    {
      name: 'dama_theme',
      category: t('privacy.preferencesCategory', 'Preferencias'),
      provider: t('privacy.own', 'Propio (DAMA-CRM)'),
      expiry: t('privacy.oneYear', '1 año'),
      purpose: t('privacy.cookieThemePurpose', 'Recordar la preferencia de tema visual (Modo Claro / Modo Oscuro).'),
    },
    {
      name: 'dama_analytics_id',
      category: t('privacy.analyticsCategory', 'Analítica Interna'),
      provider: t('privacy.own', 'Propio (DAMA-CRM)'),
      expiry: t('privacy.thirtyDays', '30 días'),
      purpose: t('privacy.cookieAnalyticsPurpose', 'Identificador efímero anónimo para agregación de telemetría de rendimiento sin rastreo publicitario.'),
    },
    {
      name: 'dama_g_state',
      category: t('privacy.essential', 'Esencial / Técnico'),
      provider: 'Google Inc.',
      expiry: t('privacy.session', 'Sesión'),
      purpose: t('privacy.cookieGooglePurpose', 'Gestión de inicio de sesión seguro con Google OAuth 2.0.'),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100/90 dark:bg-slate-950 text-gray-900 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack || (() => window.history.back())}
            className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('back')}</span>
          </button>

          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t('privacy.gdprCompliance')}</span>
          </div>
        </div>

        {/* Hero Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>{t('privacyPolicy')}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {t('privacyPolicy')} - {branding.companyName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                Transparencia total sobre cómo capturamos, procesamos y protegemos tus datos personales en nuestros formularios web, integraciones y plataforma CRM.
              </p>
              <div className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                {t('privacy.lastReviewed')}: <span className="font-semibold text-slate-700 dark:text-slate-300">{t('privacy.lastUpdated')}</span> • {t('privacy.versionLabel')} <span className="font-semibold text-slate-700 dark:text-slate-300">3.2-CRM</span>
              </div>
            </div>

            {branding.logoUrl && (
              <div className="shrink-0 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-center">
                <img
                  src={branding.logoUrl}
                  alt={branding.companyName}
                  className="w-16 h-16 object-contain"
                />
              </div>
            )}
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('policy')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                activeTab === 'policy'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{t('privacy.tabPolicy')}</span>
            </button>

            <button
              onClick={() => setActiveTab('arco_form')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                activeTab === 'arco_form'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('privacy.tabArco')}</span>
            </button>

            <button
              onClick={() => setActiveTab('cookies')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                activeTab === 'cookies'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Cookie className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('privacy.tabCookies')}</span>
            </button>

            <button
              onClick={() => setActiveTab('preferences')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                activeTab === 'preferences'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              <span>{t('privacy.tabPreferences')}</span>
            </button>

            <button
              onClick={() => setActiveTab('export')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                activeTab === 'export'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('privacy.tabExport')}</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Full Legal Policy */}
        {activeTab === 'policy' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-8">
            {/* Section 1 */}
            <section className="space-y-3">
              <div className="flex items-center space-x-2.5 text-blue-600 dark:text-blue-400">
                <Lock className="w-5 h-5" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('privacy.dataControllerTitle')}
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('privacy.dataControllerDesc')}
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <div className="flex items-center space-x-2.5 text-blue-600 dark:text-blue-400">
                <Database className="w-5 h-5" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  2. Puntos de Captura y Finalidades del Tratamiento en el CRM
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                  <h3 className="font-bold text-slate-900 dark:text-white">{t('privacy.smartFormsAndLeads')}</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Al rellenar formularios de contacto, registro de webinars o descarga de recursos (Lead Magnets), tus datos se incorporan a nuestra base de datos para responder consultas y gestionar la relación comercial.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                  <h3 className="font-bold text-slate-900 dark:text-white">{t('privacy.progressiveProfiling')}</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Para no solicitar repetidamente la misma información, nuestro sistema reconoce visitantes previos y solicita de forma progresiva únicamente los datos necesarios para ajustar la propuesta comercial.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                  <h3 className="font-bold text-slate-900 dark:text-white">{t('privacy.crmTrackingPixel')}</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Utilizamos un script ligero de telemetría para medir el tiempo de permanencia, las páginas de producto visitadas y la interacción con botones, optimizando la experiencia de usuario y previniendo el fraude.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                  <h3 className="font-bold text-slate-900 dark:text-white">{t('privacy.ecommerceSync')}</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Si inicias un proceso de compra o abandonas un carrito, el CRM registra la cesta para ofrecer asistencia en el pago o enviarte recordatorios si has prestado tu consentimiento.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <div className="flex items-center space-x-2.5 text-blue-600 dark:text-blue-400">
                <UserCheck className="w-5 h-5" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  3. Base Legal del Tratamiento
                </h2>
              </div>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-disc list-inside">
                <li><strong className="text-slate-900 dark:text-white">{t('privacy.legalBasisConsent')}</strong> {t('privacy.legalBasisConsentDesc')}</li>
                <li><strong className="text-slate-900 dark:text-white">{t('privacy.legalBasisContract')}</strong> {t('privacy.legalBasisContractDesc')}</li>
                <li><strong className="text-slate-900 dark:text-white">{t('privacy.legalBasisObligation')}</strong> {t('privacy.legalBasisObligationDesc')}</li>
                <li><strong className="text-slate-900 dark:text-white">{t('privacy.legalBasisLegitimate')}</strong> {t('privacy.legalBasisLegitimateDesc')}</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <div className="flex items-center space-x-2.5 text-blue-600 dark:text-blue-400">
                <FileText className="w-5 h-5" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  4. Tus Derechos ARCO+ (Acceso, Rectificación, Supresión y Portabilidad)
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                El RGPD te otorga derechos plenos sobre tus datos. Puedes ejercerlos en cualquier momento:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white">{t('privacy.rightAccess')}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{t('privacy.rightAccessDesc')}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white">{t('privacy.rightRectification')}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{t('privacy.rightRectificationDesc')}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white">{t('privacy.rightErasure')}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{t('privacy.rightErasureDesc')}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white">{t('privacy.rightPortability')}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{t('privacy.rightPortabilityDesc')}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white">{t('privacy.rightOpposition')}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{t('privacy.rightOppositionDesc')}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white">{t('privacy.rightLimitation')}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{t('privacy.rightLimitationDesc')}</div>
                </div>
              </div>
            </section>

            {/* Section 5: Integraciones */}
            <section className="space-y-3">
              <div className="flex items-center space-x-2.5 text-blue-600 dark:text-blue-400">
                <Globe className="w-5 h-5" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  5. Transferencias y Conectores con Terceros (Odoo, WooCommerce, Shopify, n8n, Meta)
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Cuando habilitas conectores en el endpoint central <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">/api/integraciones-de-terceros</code>, los datos se sincronizan exclusivamente según tus instrucciones directas:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white block mb-1">Odoo ERP & WooCommerce</span>
                  <span className="text-slate-500 dark:text-slate-400">{t('privacy.integrationsOdooDesc')}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white block mb-1">Shopify & HMAC SHA-256</span>
                  <span className="text-slate-500 dark:text-slate-400">{t('privacy.integrationsShopifyDesc')}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white block mb-1">Automatizaciones n8n</span>
                  <span className="text-slate-500 dark:text-slate-400">{t('privacy.integrationsN8nDesc')}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white block mb-1">WhatsApp Cloud (Meta)</span>
                  <span className="text-slate-500 dark:text-slate-400">{t('privacy.integrationsWhatsappDesc')}</span>
                </div>
              </div>
            </section>

            {/* Section 6: Security */}
            <section className="space-y-3">
              <div className="flex items-center space-x-2.5 text-blue-600 dark:text-blue-400">
                <Key className="w-5 h-5" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('privacy.securityTitle')}
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('privacy.securityDesc')}
              </p>
            </section>
          </div>
        )}

        {/* Tab 2: Formulario ARCO/POL */}
        {activeTab === 'arco_form' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-500" />
                <span>{t('privacy.arcoTitle')}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('privacy.arcoSubtitle')}
              </p>
            </div>

            <form onSubmit={handleSubmitArco} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('privacy.selectRight')}
                </label>
                <select
                  value={arcoType}
                  onChange={(e) => setArcoType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="access">Acceso (Art. 15 RGPD)</option>
                  <option value="rectification">Rectificación (Art. 16 RGPD)</option>
                  <option value="erasure">Supresión / Olvido (Art. 17 RGPD)</option>
                  <option value="limitation">Limitación del Tratamiento (Art. 18 RGPD)</option>
                  <option value="portability">Portabilidad de Datos (Art. 20 RGPD)</option>
                  <option value="opposition">Oposición / Cancelación (Art. 21 RGPD)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('privacy.fullName')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="p.ej. Laura Gómez"
                    value={arcoName}
                    onChange={(e) => setArcoName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('privacy.email')}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="laura@ejemplo.com"
                    value={arcoEmail}
                    onChange={(e) => setArcoEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('privacy.dniPassport')}
                </label>
                <input
                  type="text"
                  placeholder="NIF / DNI / Pasaporte"
                  value={arcoDni}
                  onChange={(e) => setArcoDni(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('privacy.details')}
                </label>
                <textarea
                  rows={3}
                  placeholder="Escribe aquí cualquier aclaración específica respecto a tus datos..."
                  value={arcoDetails}
                  onChange={(e) => setArcoDetails(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingArco}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs disabled:opacity-50"
              >
                {isSubmittingArco ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    <span>{t('privacy.submittingArco')}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{t('privacy.submitArco')}</span>
                  </>
                )}
              </button>

              {arcoTicketResult && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                  {arcoTicketResult}
                </div>
              )}
            </form>
          </div>
        )}

        {/* Tab 3: Cookies Inventory */}
        {activeTab === 'cookies' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Cookie className="w-5 h-5 text-amber-500" />
                <span>{t('privacy.cookieTitle')}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('privacy.cookieSubtitle')}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[10px]">
                    <th className="py-2.5 px-3 font-semibold">{t('privacy.cookieName')}</th>
                    <th className="py-2.5 px-3 font-semibold">{t('privacy.cookieCategory')}</th>
                    <th className="py-2.5 px-3 font-semibold">{t('privacy.cookieProvider')}</th>
                    <th className="py-2.5 px-3 font-semibold">{t('privacy.cookieExpiry')}</th>
                    <th className="py-2.5 px-3 font-semibold">{t('privacy.cookiePurpose')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {cookiesList.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">{c.name}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {c.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{c.provider}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{c.expiry}</td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 max-w-xs">{c.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Preferences & Opt-out */}
        {activeTab === 'preferences' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Centro de Consentimiento & Preferencias de Comunicación
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Conforme al RGPD, puedes activar o revocar tu consentimiento comercial en un solo clic y de manera independiente a los avisos legales de servicio.
              </p>
            </div>

            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tu Correo Electrónico
                </label>
                <input
                  type="email"
                  placeholder="ejemplo@empresa.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Comunicaciones Comerciales (Opt-in)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Recibir novedades, descuentos exclusivos, lanzamientos y guías de CRM por correo electrónico.
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    disabled={isUpdatingConsent}
                    onClick={() => handleToggleConsent(!marketingConsent)}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                      marketingConsent ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                        marketingConsent ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {isUpdatingConsent && (
                <div className="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-400">
                  <LoadingSpinner size="sm" color="currentColor" />
                  <span>{t('privacy.syncingPrivacy')}</span>
                </div>
              )}

              {consentStatus && (
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300">
                  {consentStatus}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleToggleConsent(false)}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline font-semibold"
                >
                  Darme de baja total de comunicaciones comerciales (Opt-out en 1-clic)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Data Portability Export */}
        {activeTab === 'export' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Portabilidad de Datos (Artículo 20 RGPD)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Descarga una copia completa de toda la información vinculada a tu cuenta (perfil, facturas, tickets de soporte y mensajes) en formato digital legible por máquina (JSON).
              </p>
            </div>

            <form onSubmit={handleExportData} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Introduce tu correo para verificar registros
                </label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@empresa.com"
                  value={exportEmail}
                  onChange={(e) => setExportEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isExporting}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    <span>{t('privacy.packagingData')}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>{t('privacy.downloadMyDataJson')}</span>
                  </>
                )}
              </button>

              {exportMessage && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                  {exportMessage}
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
