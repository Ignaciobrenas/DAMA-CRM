import fs from 'fs';
import path from 'path';
import { wsService } from '../../../services/websocket.service';
import { config as appConfig } from '../../../config';
import { IntegrationsConfig } from '../integrations.types';

const INTEGRATIONS_FILE = path.join(__dirname, '..', '..', '..', '..', 'integrations.json');

export const DEFAULT_INTEGRATIONS_CONFIG: IntegrationsConfig = {
  a3erp: {
    enabled: false,
    baseUrl: 'http://172.30.4.129:4433',
    username: 'SA',
    password: '',
    environmentName: 'Producción',
    defaultSerie: 'BORRADOR',
    defaultWarehouse: '1',
    defaultCurrency: 'EURO',
    defaultPaymentMethod: 'C',
    defaultPaymentDoc: 'T',
    defaultRegIva: 'VNAC',
    tipoContable: '1',
    ivaIncluido: true,
    fallbackCustomerCode: 'CONTADO',
    fallbackArticleCode: '0',
    autoCreateCustomer: true,
    autoCreateAddress: false,
    pollAttempts: 10,
    pollIntervalSeconds: 2,
    pageSize: 50,
    syncProducts: true,
    syncOrders: true,
    syncStock: true,
    syncPrices: true,
    status: 'disconnected',
  },
  odoo: {
    enabled: false,
    url: 'https://odoo.example.com',
    db: 'odoo_db',
    username: '',
    apiKey: '',
    syncContacts: true,
    syncInvoices: true,
    syncProducts: true,
    status: 'disconnected',
  },
  woocommerce: {
    enabled: false,
    storeUrl: 'https://tienda.example.com',
    consumerKey: '',
    consumerSecret: '',
    webhookSecret: '',
    apiVersion: 'wc/v3',
    pricesIncludeTax: true,
    defaultTaxClass: 'standard',
    reducedTaxClass: 'reduced-rate',
    holdOrderOnCustomerMismatch: true,
    batchSize: 100,
    syncProducts: true,
    syncOrders: true,
    syncStock: true,
    syncPrices: true,
    status: 'disconnected',
  },
  shopify: {
    enabled: false,
    shopDomain: 'mi-tienda.myshopify.com',
    accessToken: '',
    apiSecretKey: '',
    webhookSecret: '',
    apiVersion: '2026-04',
    skuField: 'sku',
    locationId: 'gid://shopify/Location/1',
    publicationId: 'gid://shopify/Publication/1',
    b2bEnabled: true,
    b2bRequiredTag: 'validado',
    b2bSubtotalThreshold: 500,
    ivaIncluido: false,
    syncProducts: true,
    syncOrders: true,
    syncStock: true,
    syncPrices: true,
    status: 'disconnected',
  },
  opencart: {
    enabled: false,
    storeUrl: 'https://tienda-opencart.example.com',
    apiUsername: 'dama_api_user',
    apiKey: '',
    syncProducts: true,
    syncOrders: true,
    syncCustomers: true,
    status: 'disconnected',
  },
  prestashop: {
    enabled: false,
    storeUrl: 'https://tienda-prestashop.example.com',
    wsKey: '',
    adminApiEnabled: true,
    adminClientId: '',
    adminClientSecret: '',
    defaultLocale: 'es-ES',
    defaultShopId: 1,
    skuField: 'reference',
    orderStatesReady: [2, 3],
    excludeOrderStates: [6, 7, 8],
    ivaIncluido: false,
    syncProducts: true,
    syncOrders: true,
    syncCustomers: true,
    syncStock: true,
    syncPrices: true,
    status: 'disconnected',
  },
  n8n: {
    enabled: false,
    webhookUrl: '',
    apiKey: '',
    subscribedEvents: ['contact.created', 'deal.won', 'invoice.paid', 'activity.created'],
    status: 'disconnected',
  },
  stripe: {
    enabled: false,
    publishableKey: '',
    secretKey: '',
    webhookSecret: '',
    status: 'disconnected',
  },
  zapier: {
    enabled: false,
    webhookUrl: '',
    apiKey: '',
    status: 'disconnected',
  },
  google_calendar: {
    enabled: false,
    email: '',
    clientId: '',
    clientSecret: '',
    status: 'disconnected',
  },
  sage_one: {
    enabled: false,
    apiUrl: 'https://api.accounting.sage.com/v3.1',
    apiKey: '',
    clientId: '',
    clientSecret: '',
    businessId: '',
    syncContacts: true,
    syncInvoices: true,
    syncProducts: true,
    status: 'disconnected',
  },
  sage_50: {
    enabled: false,
    endpointUrl: 'http://localhost:5493/sdata/sage50',
    companyName: 'Empresa Sage 50 S.L.',
    username: 'admin',
    password: '',
    apiKey: '',
    fiscalYear: '2026',
    syncCustomers: true,
    syncInvoices: true,
    syncStock: true,
    status: 'disconnected',
  },
  sage_200: {
    enabled: false,
    baseUrl: 'https://api.sage.com/sage200/v1',
    graphqlEndpoint: 'https://api.sage.com/sage200/graphql',
    subscriptionKey: '',
    clientId: '',
    clientSecret: '',
    companyId: 'SAGE200-CORP-ES',
    codigoEmpresa: 9999,
    defaultDocumentType: 'PVE',
    defaultSerie: 'WEB',
    defaultWarehouse: '001',
    usarContadorSage: 1,
    pollAttempts: 10,
    pollIntervalSeconds: 2,
    scopes: ['rest:read', 'rest:write', 'graphql:query', 'graphql:mutate'],
    syncCustomers: true,
    syncInvoices: true,
    syncLedgers: true,
    syncOrders: true,
    syncStockMovements: true,
    status: 'disconnected',
  },
};

const SECRET_KEYS = [
  'apiKey',
  'password',
  'consumerKey',
  'consumerSecret',
  'accessToken',
  'apiSecretKey',
  'webhookSecret',
  'secretKey',
  'clientSecret',
  'subscriptionKey',
  'wsKey',
  'adminClientSecret',
];

export class IntegrationsConfigStore {
  private static config: IntegrationsConfig | null = null;

  public static loadConfig(): IntegrationsConfig {
    if (this.config) return this.config;

    let parsed: any = {};
    try {
      if (fs.existsSync(INTEGRATIONS_FILE)) {
        const raw = fs.readFileSync(INTEGRATIONS_FILE, 'utf-8');
        parsed = JSON.parse(raw);
      }
    } catch {
      // Fallback to defaults
    }

    const env = (appConfig as any)?.integrations || {};
    const odooEnv = env.odoo || {};
    const wcEnv = env.woocommerce || {};
    const shopifyEnv = env.shopify || {};
    const n8nEnv = env.n8n || {};
    const stripeEnv = env.stripe || {};
    const zapierEnv = env.zapier || {};
    const gcalEnv = env.googleCalendar || {};

    this.config = {
      a3erp: {
        ...DEFAULT_INTEGRATIONS_CONFIG.a3erp,
        ...(parsed.a3erp || {}),
        baseUrl: parsed.a3erp?.baseUrl || DEFAULT_INTEGRATIONS_CONFIG.a3erp.baseUrl,
        username: parsed.a3erp?.username || DEFAULT_INTEGRATIONS_CONFIG.a3erp.username,
        password: parsed.a3erp?.password || '',
        enabled: parsed.a3erp?.enabled ?? !!(parsed.a3erp?.baseUrl && parsed.a3erp?.password),
        status: parsed.a3erp?.status || (parsed.a3erp?.password ? 'connected' : 'disconnected'),
      },
      odoo: {
        ...DEFAULT_INTEGRATIONS_CONFIG.odoo,
        ...(parsed.odoo || {}),
        url: parsed.odoo?.url || odooEnv.url || DEFAULT_INTEGRATIONS_CONFIG.odoo.url,
        db: parsed.odoo?.db || odooEnv.db || DEFAULT_INTEGRATIONS_CONFIG.odoo.db,
        username: parsed.odoo?.username || odooEnv.username || '',
        apiKey: parsed.odoo?.apiKey || odooEnv.apiKey || '',
        syncContacts: parsed.odoo?.syncContacts ?? true,
        syncInvoices: parsed.odoo?.syncInvoices ?? true,
        syncProducts: parsed.odoo?.syncProducts ?? true,
        enabled: parsed.odoo?.enabled ?? !!(odooEnv.url && (odooEnv.apiKey || odooEnv.username)),
        status: parsed.odoo?.status || (parsed.odoo?.apiKey || odooEnv.apiKey ? 'connected' : 'disconnected'),
      },
      woocommerce: {
        ...DEFAULT_INTEGRATIONS_CONFIG.woocommerce,
        ...(parsed.woocommerce || {}),
        storeUrl: parsed.woocommerce?.storeUrl || wcEnv.storeUrl || DEFAULT_INTEGRATIONS_CONFIG.woocommerce.storeUrl,
        consumerKey: parsed.woocommerce?.consumerKey || wcEnv.consumerKey || '',
        consumerSecret: parsed.woocommerce?.consumerSecret || wcEnv.consumerSecret || '',
        webhookSecret: parsed.woocommerce?.webhookSecret || wcEnv.webhookSecret || '',
        enabled: parsed.woocommerce?.enabled ?? !!(wcEnv.storeUrl && wcEnv.consumerKey),
        status: parsed.woocommerce?.status || (parsed.woocommerce?.consumerKey || wcEnv.consumerKey ? 'connected' : 'disconnected'),
      },
      shopify: {
        ...DEFAULT_INTEGRATIONS_CONFIG.shopify,
        ...(parsed.shopify || {}),
        shopDomain: parsed.shopify?.shopDomain || shopifyEnv.shopDomain || DEFAULT_INTEGRATIONS_CONFIG.shopify.shopDomain,
        accessToken: parsed.shopify?.accessToken || shopifyEnv.accessToken || '',
        apiSecretKey: parsed.shopify?.apiSecretKey || shopifyEnv.apiSecretKey || '',
        webhookSecret: parsed.shopify?.webhookSecret || shopifyEnv.webhookSecret || '',
        enabled: parsed.shopify?.enabled ?? !!(shopifyEnv.shopDomain && shopifyEnv.accessToken),
        status: parsed.shopify?.status || (parsed.shopify?.accessToken || shopifyEnv.accessToken ? 'connected' : 'disconnected'),
      },
      opencart: {
        ...DEFAULT_INTEGRATIONS_CONFIG.opencart!,
        ...(parsed.opencart || {}),
        storeUrl: parsed.opencart?.storeUrl || DEFAULT_INTEGRATIONS_CONFIG.opencart?.storeUrl || '',
        apiUsername: parsed.opencart?.apiUsername || '',
        apiKey: parsed.opencart?.apiKey || '',
        syncProducts: parsed.opencart?.syncProducts ?? true,
        syncOrders: parsed.opencart?.syncOrders ?? true,
        syncCustomers: parsed.opencart?.syncCustomers ?? true,
        enabled: parsed.opencart?.enabled ?? !!(parsed.opencart?.storeUrl && parsed.opencart?.apiKey),
        status: parsed.opencart?.status || (parsed.opencart?.apiKey ? 'connected' : 'disconnected'),
      },
      prestashop: {
        ...DEFAULT_INTEGRATIONS_CONFIG.prestashop!,
        ...(parsed.prestashop || {}),
        storeUrl: parsed.prestashop?.storeUrl || DEFAULT_INTEGRATIONS_CONFIG.prestashop!.storeUrl,
        wsKey: parsed.prestashop?.wsKey || '',
        adminClientId: parsed.prestashop?.adminClientId || '',
        adminClientSecret: parsed.prestashop?.adminClientSecret || '',
        syncProducts: parsed.prestashop?.syncProducts ?? true,
        syncOrders: parsed.prestashop?.syncOrders ?? true,
        syncCustomers: parsed.prestashop?.syncCustomers ?? true,
        enabled:
          parsed.prestashop?.enabled ??
          !!(parsed.prestashop?.storeUrl && (parsed.prestashop?.wsKey || parsed.prestashop?.adminClientSecret)),
        status:
          parsed.prestashop?.status ||
          (parsed.prestashop?.wsKey || parsed.prestashop?.adminClientSecret ? 'connected' : 'disconnected'),
      },
      n8n: {
        ...DEFAULT_INTEGRATIONS_CONFIG.n8n,
        ...(parsed.n8n || {}),
        webhookUrl: parsed.n8n?.webhookUrl || n8nEnv.webhookUrl || '',
        apiKey: parsed.n8n?.apiKey || n8nEnv.apiKey || '',
        subscribedEvents: parsed.n8n?.subscribedEvents || DEFAULT_INTEGRATIONS_CONFIG.n8n.subscribedEvents,
        enabled: parsed.n8n?.enabled ?? !!(n8nEnv.webhookUrl),
        status: parsed.n8n?.status || (parsed.n8n?.webhookUrl || n8nEnv.webhookUrl ? 'connected' : 'disconnected'),
      },
      stripe: {
        ...DEFAULT_INTEGRATIONS_CONFIG.stripe!,
        ...(parsed.stripe || {}),
        enabled: parsed.stripe?.enabled ?? !!(stripeEnv.secretKey),
        status: parsed.stripe?.status || (parsed.stripe?.secretKey || stripeEnv.secretKey ? 'connected' : 'disconnected'),
        publishableKey: parsed.stripe?.publishableKey || stripeEnv.publishableKey || '',
        secretKey: parsed.stripe?.secretKey || stripeEnv.secretKey || '',
        webhookSecret: parsed.stripe?.webhookSecret || stripeEnv.webhookSecret || '',
      },
      zapier: {
        ...DEFAULT_INTEGRATIONS_CONFIG.zapier!,
        ...(parsed.zapier || {}),
        enabled: parsed.zapier?.enabled ?? !!(zapierEnv.webhookUrl),
        status: parsed.zapier?.status || (parsed.zapier?.webhookUrl || zapierEnv.webhookUrl ? 'connected' : 'disconnected'),
        webhookUrl: parsed.zapier?.webhookUrl || zapierEnv.webhookUrl || '',
        apiKey: parsed.zapier?.apiKey || zapierEnv.apiKey || '',
      },
      google_calendar: {
        ...DEFAULT_INTEGRATIONS_CONFIG.google_calendar!,
        ...(parsed.google_calendar || {}),
        enabled: parsed.google_calendar?.enabled ?? !!(gcalEnv.email),
        status: parsed.google_calendar?.status || (parsed.google_calendar?.email || gcalEnv.email ? 'connected' : 'disconnected'),
        email: parsed.google_calendar?.email || gcalEnv.email || '',
        clientId: parsed.google_calendar?.clientId || gcalEnv.clientId || '',
        clientSecret: parsed.google_calendar?.clientSecret || gcalEnv.clientSecret || '',
      },
      sage_one: {
        ...DEFAULT_INTEGRATIONS_CONFIG.sage_one!,
        ...(parsed.sage_one || {}),
        apiUrl: parsed.sage_one?.apiUrl || 'https://api.accounting.sage.com/v3.1',
        apiKey: parsed.sage_one?.apiKey || '',
        clientId: parsed.sage_one?.clientId || '',
        clientSecret: parsed.sage_one?.clientSecret || '',
        businessId: parsed.sage_one?.businessId || '',
        syncContacts: parsed.sage_one?.syncContacts ?? true,
        syncInvoices: parsed.sage_one?.syncInvoices ?? true,
        syncProducts: parsed.sage_one?.syncProducts ?? true,
        enabled: parsed.sage_one?.enabled ?? !!(parsed.sage_one?.apiKey || parsed.sage_one?.clientId),
        status: parsed.sage_one?.status || (parsed.sage_one?.apiKey || parsed.sage_one?.clientId ? 'connected' : 'disconnected'),
      },
      sage_50: {
        ...DEFAULT_INTEGRATIONS_CONFIG.sage_50!,
        ...(parsed.sage_50 || {}),
        endpointUrl: parsed.sage_50?.endpointUrl || 'http://localhost:5493/sdata/sage50',
        companyName: parsed.sage_50?.companyName || 'Empresa Sage 50 S.L.',
        username: parsed.sage_50?.username || 'admin',
        password: parsed.sage_50?.password || '',
        apiKey: parsed.sage_50?.apiKey || '',
        fiscalYear: parsed.sage_50?.fiscalYear || '2026',
        syncCustomers: parsed.sage_50?.syncCustomers ?? true,
        syncInvoices: parsed.sage_50?.syncInvoices ?? true,
        syncStock: parsed.sage_50?.syncStock ?? true,
        enabled: parsed.sage_50?.enabled ?? !!(parsed.sage_50?.endpointUrl && (parsed.sage_50?.password || parsed.sage_50?.apiKey)),
        status: parsed.sage_50?.status || (parsed.sage_50?.password || parsed.sage_50?.apiKey ? 'connected' : 'disconnected'),
      },
      sage_200: {
        ...DEFAULT_INTEGRATIONS_CONFIG.sage_200!,
        ...(parsed.sage_200 || {}),
        baseUrl: parsed.sage_200?.baseUrl || 'https://api.sage.com/sage200/v1',
        subscriptionKey: parsed.sage_200?.subscriptionKey || '',
        clientId: parsed.sage_200?.clientId || '',
        clientSecret: parsed.sage_200?.clientSecret || '',
        companyId: parsed.sage_200?.companyId || 'SAGE200-CORP-ES',
        codigoEmpresa: Number(parsed.sage_200?.codigoEmpresa || 9999),
        syncCustomers: parsed.sage_200?.syncCustomers ?? true,
        syncInvoices: parsed.sage_200?.syncInvoices ?? true,
        syncLedgers: parsed.sage_200?.syncLedgers ?? true,
        enabled: parsed.sage_200?.enabled ?? !!(parsed.sage_200?.subscriptionKey || parsed.sage_200?.clientId),
        status: parsed.sage_200?.status || (parsed.sage_200?.subscriptionKey || parsed.sage_200?.clientId ? 'connected' : 'disconnected'),
      },
    };

    return this.config;
  }

  public static saveConfig(newConfig: IntegrationsConfig): void {
    this.config = newConfig;
    try {
      fs.writeFileSync(INTEGRATIONS_FILE, JSON.stringify(newConfig, null, 2), 'utf-8');
      wsService.broadcast('integrations:update', this.getPublicConfig());
    } catch (err: any) {
      console.error('Error saving integrations.json:', err.message);
    }
  }

  public static getPublicConfig() {
    const raw = this.loadConfig();
    return {
      a3erp: {
        ...raw.a3erp,
        password: raw.a3erp.password ? '••••••••' : '',
        hasPassword: !!raw.a3erp.password,
      },
      odoo: {
        ...raw.odoo,
        apiKey: raw.odoo.apiKey ? '••••••••' : '',
        password: raw.odoo.password ? '••••••••' : '',
        hasApiKey: !!(raw.odoo.apiKey || raw.odoo.password),
      },
      woocommerce: {
        ...raw.woocommerce,
        consumerKey: raw.woocommerce.consumerKey ? '••••••••' : '',
        hasConsumerKey: !!raw.woocommerce.consumerKey,
        consumerSecret: raw.woocommerce.consumerSecret ? '••••••••' : '',
        hasConsumerSecret: !!raw.woocommerce.consumerSecret,
        webhookSecret: raw.woocommerce.webhookSecret ? '••••••••' : '',
      },
      shopify: {
        ...raw.shopify,
        accessToken: raw.shopify.accessToken ? '••••••••' : '',
        hasAccessToken: !!raw.shopify.accessToken,
        apiSecretKey: raw.shopify.apiSecretKey ? '••••••••' : '',
        hasApiSecretKey: !!raw.shopify.apiSecretKey,
        webhookSecret: raw.shopify.webhookSecret ? '••••••••' : '',
      },
      opencart: {
        ...(raw.opencart || DEFAULT_INTEGRATIONS_CONFIG.opencart!),
        apiKey: raw.opencart?.apiKey ? '••••••••' : '',
        hasApiKey: !!raw.opencart?.apiKey,
      },
      prestashop: {
        ...(raw.prestashop || DEFAULT_INTEGRATIONS_CONFIG.prestashop!),
        wsKey: raw.prestashop?.wsKey ? '••••••••' : '',
        hasWsKey: !!raw.prestashop?.wsKey,
        adminClientSecret: raw.prestashop?.adminClientSecret ? '••••••••' : '',
        hasAdminClientSecret: !!raw.prestashop?.adminClientSecret,
      },
      n8n: {
        ...raw.n8n,
        apiKey: raw.n8n.apiKey ? '••••••••' : '',
        hasApiKey: !!raw.n8n.apiKey,
      },
      stripe: {
        ...(raw.stripe || DEFAULT_INTEGRATIONS_CONFIG.stripe!),
        secretKey: raw.stripe?.secretKey ? '••••••••' : '',
        hasSecretKey: !!raw.stripe?.secretKey,
        publishableKey: raw.stripe?.publishableKey || '',
      },
      zapier: {
        ...(raw.zapier || DEFAULT_INTEGRATIONS_CONFIG.zapier!),
        apiKey: raw.zapier?.apiKey ? '••••••••' : '',
        hasApiKey: !!raw.zapier?.apiKey,
      },
      google_calendar: {
        ...(raw.google_calendar || DEFAULT_INTEGRATIONS_CONFIG.google_calendar!),
        clientSecret: raw.google_calendar?.clientSecret ? '••••••••' : '',
        hasClientSecret: !!raw.google_calendar?.clientSecret,
      },
      sage_one: {
        ...(raw.sage_one || DEFAULT_INTEGRATIONS_CONFIG.sage_one!),
        apiKey: raw.sage_one?.apiKey ? '••••••••' : '',
        hasApiKey: !!raw.sage_one?.apiKey,
        clientSecret: raw.sage_one?.clientSecret ? '••••••••' : '',
        hasClientSecret: !!raw.sage_one?.clientSecret,
      },
      sage_50: {
        ...(raw.sage_50 || DEFAULT_INTEGRATIONS_CONFIG.sage_50!),
        password: raw.sage_50?.password ? '••••••••' : '',
        hasPassword: !!raw.sage_50?.password,
        apiKey: raw.sage_50?.apiKey ? '••••••••' : '',
        hasApiKey: !!raw.sage_50?.apiKey,
      },
      sage_200: {
        ...(raw.sage_200 || DEFAULT_INTEGRATIONS_CONFIG.sage_200!),
        subscriptionKey: raw.sage_200?.subscriptionKey ? '••••••••' : '',
        hasSubscriptionKey: !!raw.sage_200?.subscriptionKey,
        clientSecret: raw.sage_200?.clientSecret ? '••••••••' : '',
        hasClientSecret: !!raw.sage_200?.clientSecret,
      },
    };
  }

  public static updateConnectorConfig<K extends keyof IntegrationsConfig>(
    connector: K,
    patch: Partial<IntegrationsConfig[K]>
  ): IntegrationsConfig[K] {
    const current = this.loadConfig();
    const existing = current[connector] || {};
    const unwrappedPatch = (patch as any)?.config && typeof (patch as any).config === 'object'
      ? { ...(patch as any).config, enabled: (patch as any).enabled ?? (patch as any).config.enabled }
      : patch;

    const merged: any = { ...existing, ...unwrappedPatch };
    for (const key of SECRET_KEYS) {
      const incoming = (unwrappedPatch as any)?.[key];
      if (
        (typeof incoming === 'string' && incoming.includes('••••')) ||
        (incoming === '' && (existing as any)[key])
      ) {
        merged[key] = (existing as any)[key];
      }
    }

    current[connector] = merged;
    this.saveConfig(current);
    return current[connector];
  }
}
