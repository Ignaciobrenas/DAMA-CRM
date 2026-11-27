import React from 'react';
import { Check, Copy, Eye, EyeOff } from 'lucide-react';
import { IntegrationsEndpoints } from '../../../services/integrations.service';

export interface ConnectorFieldsProps {
  connectorId: string;
  config: Record<string, any>;
  setConfig: (next: Record<string, any>) => void;
  isAdmin: boolean;
  showSecret: Record<string, boolean>;
  toggleShowSecret: (field: string) => void;
  endpoints: IntegrationsEndpoints | null;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
  t: (key: string, fallback?: string) => string;
}

const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-color outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed';

const inputMonoCls = `${inputCls} font-mono`;

const SAGE_DOC_TYPES = ['PVE', 'ALC', 'FAC', 'OFE', 'FPC', 'PCO', 'ALP', 'FAP', 'OFC', 'FPP'];

export const PlatformConfigFields: React.FC<ConnectorFieldsProps> = ({
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

  if (connectorId === 'a3erp') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Endpoint API REST a3ERP (Sit.a3ERP.Api)
            </label>
            <input
              type="url"
              disabled={!isAdmin}
              placeholder="http://172.30.4.129:4433"
              value={config.baseUrl || ''}
              onChange={(e) => patch({ baseUrl: e.target.value })}
              className={inputMonoCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Entorno
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              placeholder="Producción"
              value={config.environmentName || ''}
              onChange={(e) => patch({ environmentName: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              UserId a3ERP
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              placeholder="SA"
              value={config.username || ''}
              onChange={(e) => patch({ username: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            {renderSecretHeader('Contraseña (POST /api/Login)', 'a3Pass')}
            <input
              type={showSecret['a3Pass'] ? 'text' : 'password'}
              disabled={!isAdmin}
              placeholder={config.hasPassword ? '•••••••• (Preservada)' : 'Contraseña a3ERP'}
              value={config.password || ''}
              onChange={(e) => patch({ password: e.target.value })}
              className={inputMonoCls}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Serie Defecto
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              placeholder="BORRADOR"
              value={config.defaultSerie || 'BORRADOR'}
              onChange={(e) => patch({ defaultSerie: e.target.value })}
              className={inputMonoCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Almacén (CODALM)
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              placeholder="1"
              value={config.defaultWarehouse || '1'}
              onChange={(e) => patch({ defaultWarehouse: e.target.value })}
              className={inputMonoCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              TIPOCONT (Sin cuadrar)
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              placeholder="1"
              value={config.tipoContable || '1'}
              onChange={(e) => patch({ tipoContable: e.target.value })}
              className={inputMonoCls}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Cliente Fallback
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              placeholder="CONTADO"
              value={config.fallbackCustomerCode || 'CONTADO'}
              onChange={(e) => patch({ fallbackCustomerCode: e.target.value })}
              className={inputMonoCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Artículo Fallback
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              placeholder="0"
              value={config.fallbackArticleCode || '0'}
              onChange={(e) => patch({ fallbackArticleCode: e.target.value })}
              className={inputMonoCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Proc Búsqueda NIF
            </label>
            <select
              disabled={!isAdmin}
              value={config.lookupProc || 'ClientesPorNif'}
              onChange={(e) => patch({ lookupProc: e.target.value })}
              className={inputCls}
            >
              <option value="ClientesPorNif">ClientesPorNif (Fallback 403)</option>
              <option value="Clientes">Clientes (Listado completo)</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 pt-1">
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              disabled={!isAdmin}
              checked={config.ivaIncluido ?? true}
              onChange={(e) => patch({ ivaIncluido: e.target.checked })}
              className="rounded text-brand-color"
            />
            <span>IVAINCLUIDO=T (PRCMONEDAMASIVA)</span>
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              disabled={!isAdmin}
              checked={config.autoCreateCustomer ?? true}
              onChange={(e) => patch({ autoCreateCustomer: e.target.checked })}
              className="rounded text-brand-color"
            />
            <span>Alta automática de clientes</span>
          </label>
        </div>
      </div>
    );
  }

  if (connectorId === 'sage_200') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Endpoint REST API v1 (StoamConnectAPIv2)
            </label>
            <input
              type="url"
              disabled={!isAdmin}
              placeholder="https://api.sage.com/sage200/v1"
              value={config.baseUrl || ''}
              onChange={(e) => patch({ baseUrl: e.target.value })}
              className={inputMonoCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Endpoint GraphQL (/graphql)
            </label>
            <input
              type="url"
              disabled={!isAdmin}
              placeholder="https://api.sage.com/sage200/graphql"
              value={config.graphqlEndpoint || ''}
              onChange={(e) => patch({ graphqlEndpoint: e.target.value })}
              className={inputMonoCls}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              ID Empresa (Company)
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              placeholder="SAGE200-CORP-ES"
              value={config.companyId || ''}
              onChange={(e) => patch({ companyId: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Código Empresa (1..9999)
            </label>
            <input
              type="number"
              min={1}
              max={9999}
              disabled={!isAdmin}
              value={config.codigoEmpresa ?? 9999}
              onChange={(e) => patch({ codigoEmpresa: Number(e.target.value) })}
              className={inputMonoCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tipo Doc. Defecto
            </label>
            <select
              disabled={!isAdmin}
              value={config.defaultDocumentType || 'PVE'}
              onChange={(e) => patch({ defaultDocumentType: e.target.value })}
              className={inputMonoCls}
            >
              {SAGE_DOC_TYPES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              OAuth 2.0 Client ID (ES256)
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              placeholder="sage200_oauth_client"
              value={config.clientId || ''}
              onChange={(e) => patch({ clientId: e.target.value })}
              className={inputMonoCls}
            />
          </div>
          <div>
            {renderSecretHeader('OAuth 2.0 Client Secret', 'sage200Secret')}
            <input
              type={showSecret['sage200Secret'] ? 'text' : 'password'}
              disabled={!isAdmin}
              placeholder={config.hasClientSecret ? '•••••••• (Preservada)' : 'Client Secret ES256'}
              value={config.clientSecret || ''}
              onChange={(e) => patch({ clientSecret: e.target.value })}
              className={inputMonoCls}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Subscription Key
            </label>
            <input
              type="password"
              disabled={!isAdmin}
              placeholder={config.hasSubscriptionKey ? '•••••••• (Preservada)' : 'Ocp-Apim-Key'}
              value={config.subscriptionKey || ''}
              onChange={(e) => patch({ subscriptionKey: e.target.value })}
              className={inputMonoCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Serie Defecto
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              placeholder="WEB"
              value={config.defaultSerie || 'WEB'}
              onChange={(e) => patch({ defaultSerie: e.target.value })}
              className={inputMonoCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Almacén Defecto
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              placeholder="001"
              value={config.defaultWarehouse || '001'}
              onChange={(e) => patch({ defaultWarehouse: e.target.value })}
              className={inputMonoCls}
            />
          </div>
        </div>
        <div className="pt-1 space-y-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t('integrations.entitiesToSync')}
          </span>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                disabled={!isAdmin}
                checked={config.syncCustomers ?? true}
                onChange={(e) => patch({ syncCustomers: e.target.checked })}
                className="rounded text-brand-color"
              />
              <span>ClientesProveedores</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                disabled={!isAdmin}
                checked={config.syncInvoices ?? true}
                onChange={(e) => patch({ syncInvoices: e.target.checked })}
                className="rounded text-brand-color"
              />
              <span>Documentos (PVE/FAC)</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                disabled={!isAdmin}
                checked={config.syncLedgers ?? true}
                onChange={(e) => patch({ syncLedgers: e.target.checked })}
                className="rounded text-brand-color"
              />
              <span>Catálogo &amp; Stock</span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  if (connectorId === 'prestashop') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            URL de la Tienda PrestaShop (8 / 9)
          </label>
          <input
            type="url"
            disabled={!isAdmin}
            placeholder="https://tienda-prestashop.com"
            value={config.storeUrl || ''}
            onChange={(e) => patch({ storeUrl: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          {renderSecretHeader('Webservice Key Clásico (ws_key para /api/)', 'psWsKey')}
          <input
            type={showSecret['psWsKey'] ? 'text' : 'password'}
            disabled={!isAdmin}
            placeholder={config.hasWsKey ? '•••••••• (Preservada)' : 'Clave de 32 caracteres de Webservice'}
            value={config.wsKey || ''}
            onChange={(e) => patch({ wsKey: e.target.value })}
            className={inputMonoCls}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Admin API Client ID (PS 9 OAuth2)
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              placeholder="ps9_admin_client"
              value={config.adminClientId || ''}
              onChange={(e) => patch({ adminClientId: e.target.value })}
              className={inputMonoCls}
            />
          </div>
          <div>
            {renderSecretHeader('Admin API Client Secret (PS 9)', 'psAdminSecret')}
            <input
              type={showSecret['psAdminSecret'] ? 'text' : 'password'}
              disabled={!isAdmin}
              placeholder={config.hasAdminClientSecret ? '•••••••• (Preservada)' : 'Client Secret OAuth2'}
              value={config.adminClientSecret || ''}
              onChange={(e) => patch({ adminClientSecret: e.target.value })}
              className={inputMonoCls}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Locale Defecto
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              placeholder="es-ES"
              value={config.defaultLocale || 'es-ES'}
              onChange={(e) => patch({ defaultLocale: e.target.value })}
              className={inputMonoCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Campo SKU Dedupe
            </label>
            <select
              disabled={!isAdmin}
              value={config.skuField || 'reference'}
              onChange={(e) => patch({ skuField: e.target.value })}
              className={inputCls}
            >
              <option value="reference">reference</option>
              <option value="ean13">ean13</option>
              <option value="upc">upc</option>
              <option value="isbn">isbn</option>
              <option value="mpn">mpn</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Shop ID (Multitienda)
            </label>
            <input
              type="number"
              min={1}
              disabled={!isAdmin}
              value={config.defaultShopId ?? 1}
              onChange={(e) => patch({ defaultShopId: Number(e.target.value) })}
              className={inputMonoCls}
            />
          </div>
        </div>
      </div>
    );
  }

  if (connectorId === 'shopify') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Dominio de Shopify (myshopify.com)
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              placeholder="mi-tienda.myshopify.com"
              value={config.shopDomain || ''}
              onChange={(e) => patch({ shopDomain: e.target.value })}
              className={inputMonoCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Versión GraphQL
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              placeholder="2026-04"
              value={config.apiVersion || '2026-04'}
              onChange={(e) => patch({ apiVersion: e.target.value })}
              className={inputMonoCls}
            />
          </div>
        </div>
        <div>
          {renderSecretHeader('Admin API Access Token (shpat_...)', 'shopifyToken')}
          <input
            type={showSecret['shopifyToken'] ? 'text' : 'password'}
            disabled={!isAdmin}
            placeholder={config.hasAccessToken ? '•••••••• (Preservada en servidor)' : 'shpat_xxxxxxxxxxxx'}
            value={config.accessToken || ''}
            onChange={(e) => patch({ accessToken: e.target.value })}
            className={inputMonoCls}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Webhook Secret (HMAC-SHA256)
            </label>
            <input
              type="password"
              disabled={!isAdmin}
              placeholder="shpss_xxxxxxxxxxxx"
              value={config.webhookSecret || ''}
              onChange={(e) => patch({ webhookSecret: e.target.value })}
              className={inputMonoCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Campo Anti-Duplicado
            </label>
            <select
              disabled={!isAdmin}
              value={config.skuField || 'sku'}
              onChange={(e) => patch({ skuField: e.target.value })}
              className={inputCls}
            >
              <option value="sku">sku (Código SKU)</option>
              <option value="barcode">barcode (EAN / Código barras)</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Location GID (Inventario)
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              placeholder="gid://shopify/Location/1"
              value={config.locationId || ''}
              onChange={(e) => patch({ locationId: e.target.value })}
              className={inputMonoCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Publication GID (Canal Ventas)
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              placeholder="gid://shopify/Publication/1"
              value={config.publicationId || ''}
              onChange={(e) => patch({ publicationId: e.target.value })}
              className={inputMonoCls}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-4 pt-1">
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              disabled={!isAdmin}
              checked={config.b2bEnabled ?? true}
              onChange={(e) => patch({ b2bEnabled: e.target.checked })}
              className="rounded text-brand-color"
            />
            <span>Soporte B2B (PurchasingCompany &amp; PriceList)</span>
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              disabled={!isAdmin}
              checked={config.ivaIncluido ?? false}
              onChange={(e) => patch({ ivaIncluido: e.target.checked })}
              className="rounded text-brand-color"
            />
            <span>Precios con IVA incluido</span>
          </label>
        </div>
        {endpoints?.shopifyWebhook && (
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              URL de Webhook para Shopify:
            </span>
            <div className="flex items-center gap-2">
              <code className="text-xs text-brand-color font-mono break-all flex-1 select-all">
                {endpoints.shopifyWebhook}
              </code>
              <button
                onClick={() => onCopy(endpoints.shopifyWebhook, 'sh-hook')}
                className="p-1.5 bg-white dark:bg-slate-700 rounded-lg hover:bg-slate-200 text-slate-700 dark:text-slate-200"
              >
                {copiedKey === 'sh-hook' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (connectorId === 'woocommerce') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            URL de la Tienda (WordPress / REST API v3)
          </label>
          <input
            type="url"
            disabled={!isAdmin}
            placeholder="https://tienda.com"
            value={config.storeUrl || ''}
            onChange={(e) => patch({ storeUrl: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          {renderSecretHeader('Consumer Key (ck_...)', 'wcKey')}
          <input
            type={showSecret['wcKey'] ? 'text' : 'password'}
            disabled={!isAdmin}
            placeholder={config.hasConsumerKey ? '•••••••• (Preservada en servidor)' : 'ck_xxxxxxxxxxxx'}
            value={config.consumerKey || ''}
            onChange={(e) => patch({ consumerKey: e.target.value })}
            className={inputMonoCls}
          />
        </div>
        <div>
          {renderSecretHeader('Consumer Secret (cs_...)', 'wcSecret')}
          <input
            type={showSecret['wcSecret'] ? 'text' : 'password'}
            disabled={!isAdmin}
            placeholder={config.hasConsumerSecret ? '•••••••• (Preservada en servidor)' : 'cs_xxxxxxxxxxxx'}
            value={config.consumerSecret || ''}
            onChange={(e) => patch({ consumerSecret: e.target.value })}
            className={inputMonoCls}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Clase Fiscal Estándar (tax_class)
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              placeholder="Estándard"
              value={config.defaultTaxClass || 'Estándard'}
              onChange={(e) => patch({ defaultTaxClass: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Clase Fiscal Reducida (10%)
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              placeholder="IVA alimentación"
              value={config.reducedTaxClass || 'IVA alimentación'}
              onChange={(e) => patch({ reducedTaxClass: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-4 pt-1">
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              disabled={!isAdmin}
              checked={config.pricesIncludeTax ?? true}
              onChange={(e) => patch({ pricesIncludeTax: e.target.checked })}
              className="rounded text-brand-color"
            />
            <span>regular_price con IVA incluido</span>
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              disabled={!isAdmin}
              checked={config.holdOrderOnCustomerMismatch ?? true}
              onChange={(e) => patch({ holdOrderOnCustomerMismatch: e.target.checked })}
              className="rounded text-brand-color"
            />
            <span>Retener en on_hold si cambia cliente (_billing_nif)</span>
          </label>
        </div>
        {endpoints?.woocommerceWebhook && (
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              URL de Webhook para WooCommerce:
            </span>
            <div className="flex items-center gap-2">
              <code className="text-xs text-brand-color font-mono break-all flex-1 select-all">
                {endpoints.woocommerceWebhook}
              </code>
              <button
                onClick={() => onCopy(endpoints.woocommerceWebhook, 'wc-hook')}
                className="p-1.5 bg-white dark:bg-slate-700 rounded-lg hover:bg-slate-200 text-slate-700 dark:text-slate-200"
              >
                {copiedKey === 'wc-hook' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};
