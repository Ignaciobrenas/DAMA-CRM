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
} from 'lucide-react';
import { useBranding } from '../context/BrandingContext';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../services/api';
import { LoadingSpinner } from '../components/common/Loading';

interface PrivacyPolicyProps {
  onBack?: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  const { t } = useLanguage();
  const { branding } = useBranding();
  const [activeTab, setActiveTab] = useState<'policy' | 'preferences' | 'export'>('policy');

  // RGPD Rights Interactive State
  const [userEmail, setUserEmail] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [consentStatus, setConsentStatus] = useState<string>('');
  const [isUpdatingConsent, setIsUpdatingConsent] = useState(false);

  // Data Export State
  const [exportEmail, setExportEmail] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string>('');

  const handleToggleConsent = async (nextVal: boolean) => {
    if (!userEmail) {
      setConsentStatus('Por favor, indica tu dirección de correo electrónico para actualizar tu preferencia.');
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
        setConsentStatus(res.message || 'Preferencia guardada con éxito.');
      } else {
        setConsentStatus(res.message || 'Error al actualizar el consentimiento.');
      }
    } catch (e: any) {
      setIsUpdatingConsent(false);
      setConsentStatus('Error de conexión con el servidor de privacidad.');
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

        setExportMessage('✅ Tus datos han sido recopilados y descargados en formato estructurado JSON.');
      } else {
        setExportMessage('⚠️ No se encontraron registros asociados al correo electrónico indicado.');
      }
    } catch {
      setIsExporting(false);
      setExportMessage('Error al generar la exportación de datos.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack || (() => window.history.back())}
            className="inline-flex items-center space-x-2 text-xs font-semibold text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('back')}</span>
          </button>

          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Conformidad RGPD (UE 2016/679) & LOPD-GDD</span>
          </div>
        </div>

        {/* Hero Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-8 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>{t('privacyPolicy')}</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Política de Privacidad de {branding.companyName}
              </h1>
              <p className="text-sm text-gray-600 dark:text-slate-400 max-w-xl">
                Transparencia total sobre cómo capturamos, procesamos y protegemos tus datos personales en nuestros formularios web, integraciones y plataforma CRM.
              </p>
              <div className="text-xs text-gray-500 dark:text-slate-400 pt-1">
                Última revisión: <span className="font-semibold text-gray-700 dark:text-slate-300">25 de Septiembre de 2026</span> • Versión: <span className="font-semibold text-gray-700 dark:text-slate-300">3.2-CRM</span>
              </div>
            </div>

            {branding.logoUrl && (
              <div className="shrink-0 p-3 bg-gray-50 dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs flex items-center justify-center">
                <img
                  src={branding.logoUrl}
                  alt={branding.companyName}
                  className="w-16 h-16 object-contain"
                />
              </div>
            )}
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex space-x-2 mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('policy')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'policy'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              Documento Legal Completo
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'preferences'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              Gestión de Consentimientos (Opt-in / Opt-out)
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'export'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              Descarga tus Datos (Portabilidad RGPD)
            </button>
          </div>
        </div>

        {/* Tab 1: Full Legal Policy */}
        {activeTab === 'policy' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-8 shadow-xs space-y-8">
            {/* Section 1 */}
            <section className="space-y-3">
              <div className="flex items-center space-x-2.5 text-blue-600 dark:text-blue-400">
                <Lock className="w-5 h-5" />
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  1. Responsable del Tratamiento y Delegado de Protección de Datos (DPO)
                </h2>
              </div>
              <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                El responsable del tratamiento de los datos recabados a través de esta plataforma es{' '}
                <strong className="text-gray-900 dark:text-white">{branding.companyName}</strong>, con domicilio social en la Unión Europea. Para cualquier cuestión relativa a la privacidad, puedes contactar con nuestro Delegado de Protección de Datos (DPO) a través de{' '}
                <span className="text-blue-600 dark:text-blue-400 font-medium">dpo@dama-crm.local</span>.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <div className="flex items-center space-x-2.5 text-blue-600 dark:text-blue-400">
                <Database className="w-5 h-5" />
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  2. Puntos de Captura y Finalidades del Tratamiento en el CRM
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 space-y-2">
                  <h3 className="font-bold text-gray-900 dark:text-white">Formularios Inteligentes & Leads</h3>
                  <p className="text-gray-600 dark:text-slate-400">
                    Al rellenar formularios de contacto, registro de webinars o descarga de recursos (Lead Magnets), tus datos se incorporan a nuestra base de datos para responder consultas y gestionar la relación comercial.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 space-y-2">
                  <h3 className="font-bold text-gray-900 dark:text-white">Perfilado Progresivo</h3>
                  <p className="text-gray-600 dark:text-slate-400">
                    Para no solicitar repetidamente la misma información, nuestro sistema reconoce visitantes previos y solicita de forma progresiva únicamente los datos necesarios para ajustar la propuesta comercial.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 space-y-2">
                  <h3 className="font-bold text-gray-900 dark:text-white">Píxel de Seguimiento del CRM</h3>
                  <p className="text-gray-600 dark:text-slate-400">
                    Utilizamos un script ligero de telemetría para medir el tiempo de permanencia, las páginas de producto visitadas y la interacción con botones, optimizando la experiencia de usuario y previniendo el fraude.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 space-y-2">
                  <h3 className="font-bold text-gray-900 dark:text-white">Sincronización E-commerce</h3>
                  <p className="text-gray-600 dark:text-slate-400">
                    Si inicias un proceso de compra o abandonas un carrito, el CRM registra la cesta para ofrecer asistencia en el pago o enviarte recordatorios si has prestado tu consentimiento.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <div className="flex items-center space-x-2.5 text-blue-600 dark:text-blue-400">
                <UserCheck className="w-5 h-5" />
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  3. Base Legal del Tratamiento
                </h2>
              </div>
              <ul className="text-xs text-gray-600 dark:text-slate-300 space-y-2 list-disc list-inside">
                <li><strong className="text-gray-900 dark:text-white">Consentimiento explícito (Art. 6.1.a RGPD):</strong> Para suscripción a boletines comerciales (Opt-in) y almacenamiento de cookies no esenciales.</li>
                <li><strong className="text-gray-900 dark:text-white">Ejecución contractual (Art. 6.1.b RGPD):</strong> Para la gestión de presupuestos, facturación y soporte técnico.</li>
                <li><strong className="text-gray-900 dark:text-white">Cumplimiento de obligaciones legales (Art. 6.1.c RGPD):</strong> Conservación de facturas según normativa mercantil y fiscal.</li>
                <li><strong className="text-gray-900 dark:text-white">Interés legítimo (Art. 6.1.f RGPD):</strong> Prevención del fraude y seguridad informática del software.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <div className="flex items-center space-x-2.5 text-blue-600 dark:text-blue-400">
                <FileText className="w-5 h-5" />
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  4. Tus Derechos ARCO+ (Acceso, Rectificación, Supresión y Portabilidad)
                </h2>
              </div>
              <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                El RGPD te otorga derechos plenos sobre tus datos. Puedes ejercerlos en cualquier momento:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-800">
                  <div className="font-bold text-gray-900 dark:text-white">Acceso</div>
                  <div className="text-[11px] text-gray-500 dark:text-slate-400">Saber qué datos conservamos sobre ti.</div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-800">
                  <div className="font-bold text-gray-900 dark:text-white">Rectificación</div>
                  <div className="text-[11px] text-gray-500 dark:text-slate-400">Modificar datos inexactos o incompletos.</div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-800">
                  <div className="font-bold text-gray-900 dark:text-white">Supresión (Olvido)</div>
                  <div className="text-[11px] text-gray-500 dark:text-slate-400">Borrado de tus datos cuando no sean necesarios.</div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-800">
                  <div className="font-bold text-gray-900 dark:text-white">Portabilidad</div>
                  <div className="text-[11px] text-gray-500 dark:text-slate-400">Descargar tus datos en formato digital JSON.</div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-800">
                  <div className="font-bold text-gray-900 dark:text-white">Oposición</div>
                  <div className="text-[11px] text-gray-500 dark:text-slate-400">Detener envíos comerciales al instante.</div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-800">
                  <div className="font-bold text-gray-900 dark:text-white">Limitación</div>
                  <div className="text-[11px] text-gray-500 dark:text-slate-400">Congelar el tratamiento temporalmente.</div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Tab 2: Preferences & Marketing Opt-out */}
        {activeTab === 'preferences' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Centro de Consentimiento & Preferencias de Comunicación
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Conforme al RGPD, puedes activar o revocar tu consentimiento comercial en un solo clic y de manera independiente a los avisos legales de servicio.
              </p>
            </div>

            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Tu Correo Electrónico
                </label>
                <input
                  type="email"
                  placeholder="ejemplo@empresa.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700/80 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-gray-900 dark:text-white">
                    Comunicaciones Comerciales (Opt-in)
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-slate-400">
                    Recibir novedades, descuentos exclusivos, lanzamientos y guías de CRM por correo electrónico.
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    disabled={isUpdatingConsent}
                    onClick={() => handleToggleConsent(!marketingConsent)}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                      marketingConsent ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-700'
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
                  <span>Sincronizando estado con el servidor de privacidad...</span>
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

        {/* Tab 3: Data Portability Export */}
        {activeTab === 'export' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Portabilidad de Datos (Artículo 20 RGPD)
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Descarga una copia completa de toda la información vinculada a tu cuenta (perfil, facturas, tickets de soporte y mensajes) en formato digital legible por máquina (JSON).
              </p>
            </div>

            <form onSubmit={handleExportData} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Introduce tu correo para verificar registros
                </label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@empresa.com"
                  value={exportEmail}
                  onChange={(e) => setExportEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <span>Empaquetando datos...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Descargar archivo de mis datos (JSON)</span>
                  </>
                )}
              </button>

              {exportMessage && (
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs">
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
