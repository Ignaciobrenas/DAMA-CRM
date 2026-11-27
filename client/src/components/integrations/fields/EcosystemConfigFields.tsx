import React from 'react';
import { Check, Copy, Eye, EyeOff } from 'lucide-react';
import { ConnectorFieldsProps } from './PlatformConfigFields';

const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed';

const inputMonoCls = `${inputCls} font-mono`;

export const EcosystemConfigFields: React.FC<ConnectorFieldsProps> = ({
  connectorId,
  config,
  setConfig,
  isAdmin,
  showSecret,
  toggleShowSecret,
  endpoints,
  copiedKey,
  onCopy,
  t,
}) => {
  const patch = (partial: Record<string, any>) => setConfig({ ...config, ...partial });

  const renderSecretHeader = (label: string, secretKey: string) => (
    <div className="flex items-center justify-between mb-1.5">
      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</label>
      {isAdmin && (
        <button
          type="button"
          onClick={() => toggleShowSecret(secretKey)}
          className="text-xs text-slate-500 hover:text-brand-color flex items-center gap-1"
        >
          {showSecret[secretKey] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{showSecret[secretKey] ? 'Ocultar' : 'Mostrar'}</span>
        </button>
      )}
    </div>
  );

  const renderWebhookBox = (label: string, url: string, copyId: string) => (
    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
      <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</span>
      <div className="flex items-center gap-2">
        <code className="text-xs text-brand-color font-mono break-all flex-1 select-all">{url}</code>
        <button
          onClick={() => onCopy(url, copyId)}
          className="p-1.5 bg-white dark:bg-slate-700 rounded-lg hover:bg-slate-200 text-slate-700 dark:text-slate-200"
        >
          {copiedKey === copyId ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  switch (connectorId) {
    case 'odoo':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              URL de la Instancia Odoo
            </label>
            <input type="url" disabled={!isAdmin} placeholder="https://mi-empresa.odoo.com" value={config.url || ''} onChange={(e) => patch({ url: e.target.value })} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Base de Datos (DB)</label>
              <input type="text" disabled={!isAdmin} placeholder="odoo_db" value={config.db || ''} onChange={(e) => patch({ db: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Usuario / Email API</label>
              <input type="text" disabled={!isAdmin} placeholder="admin@mi-empresa.com" value={config.username || ''} onChange={(e) => patch({ username: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            {renderSecretHeader('API Key / Contraseña', 'odooApiKey')}
            <input type={showSecret['odooApiKey'] ? 'text' : 'password'} disabled={!isAdmin} placeholder={config.hasApiKey ? '•••••••• (Preservada en servidor)' : 'Clave de acceso Odoo'} value={config.apiKey || ''} onChange={(e) => patch({ apiKey: e.target.value })} className={inputMonoCls} />
          </div>
          <div className="pt-2 space-y-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('integrations.entitiesToSync')}</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input type="checkbox" disabled={!isAdmin} checked={config.syncContacts ?? true} onChange={(e) => patch({ syncContacts: e.target.checked })} className="rounded text-brand-color" />
                <span>{t('integrations.entityContacts')}</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input type="checkbox" disabled={!isAdmin} checked={config.syncInvoices ?? true} onChange={(e) => patch({ syncInvoices: e.target.checked })} className="rounded text-brand-color" />
                <span>{t('integrations.entityInvoices')}</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input type="checkbox" disabled={!isAdmin} checked={config.syncProducts ?? true} onChange={(e) => patch({ syncProducts: e.target.checked })} className="rounded text-brand-color" />
                <span>{t('integrations.entityProducts')}</span>
              </label>
            </div>
          </div>
        </div>
      );

    case 'opencart':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">URL de la Tienda OpenCart</label>
            <input type="url" disabled={!isAdmin} placeholder="https://tienda-opencart.com" value={config.storeUrl || ''} onChange={(e) => patch({ storeUrl: e.target.value })} className={inputMonoCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Usuario API de OpenCart</label>
            <input type="text" disabled={!isAdmin} placeholder="dama_api_user" value={config.apiUsername || ''} onChange={(e) => patch({ apiUsername: e.target.value })} className={inputCls} />
          </div>
          <div>
            {renderSecretHeader('API Key / Token de Acceso OpenCart', 'ocApiKey')}
            <input type={showSecret['ocApiKey'] ? 'text' : 'password'} disabled={!isAdmin} placeholder={config.hasApiKey ? '•••••••• (Preservada en servidor)' : 'oc_api_key_xxxxxxxx'} value={config.apiKey || ''} onChange={(e) => patch({ apiKey: e.target.value })} className={inputMonoCls} />
          </div>
          {endpoints?.opencartWebhook && renderWebhookBox('URL de Webhook para OpenCart:', endpoints.opencartWebhook, 'oc-hook')}
        </div>
      );

    case 'n8n':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">URL de Webhook n8n (Flujo de entrada hacia n8n)</label>
            <input type="url" disabled={!isAdmin} placeholder="https://n8n.mi-servidor.com/webhook/crm-trigger" value={config.webhookUrl || ''} onChange={(e) => patch({ webhookUrl: e.target.value })} className={inputMonoCls} />
          </div>
          <div>
            {renderSecretHeader('API Key n8n (Opcional / Cabecera de autenticación)', 'n8nApiKey')}
            <input type={showSecret['n8nApiKey'] ? 'text' : 'password'} disabled={!isAdmin} placeholder={config.hasApiKey ? '•••••••• (Preservada en servidor)' : 'n8n_api_key_xxxxxxxx'} value={config.apiKey || ''} onChange={(e) => patch({ apiKey: e.target.value })} className={inputMonoCls} />
          </div>
          {endpoints?.n8nActionEndpoint && renderWebhookBox('Endpoint para que n8n ejecute acciones en DAMA-CRM:', endpoints.n8nActionEndpoint, 'n8n-in')}
        </div>
      );

    case 'stripe':
      return (
        <div className="space-y-4">
          <div>
            {renderSecretHeader('Secret Key (sk_live_... / sk_test_...)', 'stripeSecretKey')}
            <input type={showSecret['stripeSecretKey'] ? 'text' : 'password'} disabled={!isAdmin} placeholder={config.hasSecretKey ? '•••••••• (Preservada en servidor)' : 'sk_live_xxxxxxxx'} value={config.secretKey || ''} onChange={(e) => patch({ secretKey: e.target.value })} className={inputMonoCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Publishable Key (pk_live_... / pk_test_...)</label>
            <input type="text" disabled={!isAdmin} placeholder="pk_live_xxxxxxxx" value={config.publishableKey || ''} onChange={(e) => patch({ publishableKey: e.target.value })} className={inputMonoCls} />
          </div>
        </div>
      );

    case 'zapier':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">URL de Webhook de Zapier (Catch Hook)</label>
            <input type="url" disabled={!isAdmin} placeholder="https://hooks.zapier.com/hooks/catch/xxxxxx/yyyyyy/" value={config.webhookUrl || ''} onChange={(e) => patch({ webhookUrl: e.target.value })} className={inputMonoCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">API Key de Integración (Opcional)</label>
            <input type="password" disabled={!isAdmin} placeholder={config.hasApiKey ? '•••••••• (Preservada en servidor)' : 'zapier_key_xxxx'} value={config.apiKey || ''} onChange={(e) => patch({ apiKey: e.target.value })} className={inputMonoCls} />
          </div>
        </div>
      );

    case 'google_calendar':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email Corporativo de Google Workspace / Calendar</label>
            <input type="email" disabled={!isAdmin} placeholder="ventas@tuempresa.com" value={config.email || ''} onChange={(e) => patch({ email: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Client ID (Google Cloud Console OAuth2)</label>
            <input type="text" disabled={!isAdmin} placeholder="xxxxxx-yyyyyy.apps.googleusercontent.com" value={config.clientId || ''} onChange={(e) => patch({ clientId: e.target.value })} className={inputMonoCls} />
          </div>
          <div>
            {renderSecretHeader('Client Secret', 'gcalSecret')}
            <input type={showSecret['gcalSecret'] ? 'text' : 'password'} disabled={!isAdmin} placeholder={config.hasClientSecret ? '•••••••• (Preservada en servidor)' : 'GOCSPX-xxxxxxxx'} value={config.clientSecret || ''} onChange={(e) => patch({ clientSecret: e.target.value })} className={inputMonoCls} />
          </div>
        </div>
      );

    case 'sage_one':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">URL de la API (Sage Business Cloud v3.1)</label>
            <input type="url" disabled={!isAdmin} placeholder="https://api.accounting.sage.com/v3.1" value={config.apiUrl || ''} onChange={(e) => patch({ apiUrl: e.target.value })} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">ID de Empresa / Negocio</label>
              <input type="text" disabled={!isAdmin} placeholder="SBC-ES-00123" value={config.businessId || ''} onChange={(e) => patch({ businessId: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Client ID (OAuth2)</label>
              <input type="text" disabled={!isAdmin} placeholder="sage-client-id-xxxx" value={config.clientId || ''} onChange={(e) => patch({ clientId: e.target.value })} className={inputMonoCls} />
            </div>
          </div>
          <div>
            {renderSecretHeader('API Key / Access Token', 'sageOneKey')}
            <input type={showSecret['sageOneKey'] ? 'text' : 'password'} disabled={!isAdmin} placeholder={config.hasApiKey ? '•••••••• (Preservada en servidor)' : 'Bearer Token / API Key'} value={config.apiKey || ''} onChange={(e) => patch({ apiKey: e.target.value })} className={inputMonoCls} />
          </div>
        </div>
      );

    case 'sage_50':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Endpoint SData / Desktop Service</label>
              <input type="text" disabled={!isAdmin} placeholder="http://localhost:5493/sdata/sage50" value={config.endpointUrl || ''} onChange={(e) => patch({ endpointUrl: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nombre Empresa en Sage 50</label>
              <input type="text" disabled={!isAdmin} placeholder="Empresa Sage 50 S.L." value={config.companyName || ''} onChange={(e) => patch({ companyName: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Usuario SData / Operador</label>
              <input type="text" disabled={!isAdmin} placeholder="admin" value={config.username || ''} onChange={(e) => patch({ username: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Ejercicio Fiscal</label>
              <input type="text" disabled={!isAdmin} placeholder="2026" value={config.fiscalYear || ''} onChange={(e) => patch({ fiscalYear: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            {renderSecretHeader('Contraseña de Conexión / API Key', 'sage50Pass')}
            <input type={showSecret['sage50Pass'] ? 'text' : 'password'} disabled={!isAdmin} placeholder={config.hasPassword || config.hasApiKey ? '•••••••• (Preservada en servidor)' : 'Contraseña Sage 50'} value={config.password || config.apiKey || ''} onChange={(e) => patch({ password: e.target.value, apiKey: e.target.value })} className={inputMonoCls} />
          </div>
        </div>
      );

    case 'unopim':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">URL Endpoint Servidor UnoPIM</label>
            <input type="url" disabled={!isAdmin} placeholder="https://pim.miempresa.com/api" value={config.endpoint || ''} onChange={(e) => patch({ endpoint: e.target.value })} className={inputCls} />
          </div>
          <div>
            {renderSecretHeader('Webhook Secret Key (x-unopim-secret)', 'unopimSecret')}
            <input type={showSecret['unopimSecret'] ? 'text' : 'password'} disabled={!isAdmin} placeholder="uno_sec_xxxxxxxx" value={config.webhookSecret || ''} onChange={(e) => patch({ webhookSecret: e.target.value })} className={inputMonoCls} />
          </div>
          {endpoints?.unopimWebhook && renderWebhookBox('URL de Webhook para UnoPIM:', endpoints.unopimWebhook, 'unopim-hook')}
        </div>
      );

    case 'whatsapp':
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">ID Número de Teléfono (Phone Number ID)</label>
            <input type="text" disabled={!isAdmin} placeholder="109283746192834" value={config.phoneNumberId || ''} onChange={(e) => patch({ phoneNumberId: e.target.value })} className={inputMonoCls} />
          </div>
          <div>
            {renderSecretHeader('Permanent Access Token (EAAB...)', 'waToken')}
            <input type={showSecret['waToken'] ? 'text' : 'password'} disabled={!isAdmin} placeholder="EAABxxxxxxxx...." value={config.accessToken || ''} onChange={(e) => patch({ accessToken: e.target.value })} className={inputMonoCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Webhook Verify Token</label>
            <input type="text" disabled={!isAdmin} placeholder="dama_webhook_verify_2026" value={config.verifyToken || ''} onChange={(e) => patch({ verifyToken: e.target.value })} className={inputMonoCls} />
          </div>
          {endpoints?.whatsappWebhook && renderWebhookBox('Callback URL de Webhook en Meta Developers:', endpoints.whatsappWebhook, 'wa-hook')}
        </div>
      );

    default:
      return null;
  }
};
