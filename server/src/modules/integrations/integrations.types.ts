export type ConnectorType =
  | 'odoo'
  | 'woocommerce'
  | 'shopify'
  | 'opencart'
  | 'prestashop'
  | 'n8n'
  | 'unopim'
  | 'whatsapp'
  | 'stripe'
  | 'zapier'
  | 'google_calendar'
  | 'sage_one'
  | 'sage_50'
  | 'sage_200';

export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'pending';

export interface OdooConfig {
  enabled: boolean;
  url: string;
  db: string;
  username: string;
  password?: string;
  apiKey?: string;
  hasApiKey?: boolean;
  syncContacts: boolean;
  syncInvoices: boolean;
  syncProducts: boolean;
  status: IntegrationStatus;
  lastSyncAt?: string;
  lastError?: string;
}

export interface WooCommerceConfig {
  enabled: boolean;
  storeUrl: string;
  consumerKey?: string;
  hasConsumerKey?: boolean;
  consumerSecret?: string;
  hasConsumerSecret?: boolean;
  webhookSecret?: string;
  status: IntegrationStatus;
  lastSyncAt?: string;
  lastError?: string;
}

export interface ShopifyConfig {
  enabled: boolean;
  shopDomain: string;
  accessToken?: string;
  hasAccessToken?: boolean;
  apiSecretKey?: string;
  hasApiSecretKey?: boolean;
  webhookSecret?: string;
  status: IntegrationStatus;
  lastSyncAt?: string;
  lastError?: string;
}

export interface N8nConfig {
  enabled: boolean;
  webhookUrl: string;
  apiKey?: string;
  hasApiKey?: boolean;
  subscribedEvents: string[];
  status: IntegrationStatus;
  lastTriggerAt?: string;
  lastError?: string;
}

export interface StripeConfig {
  enabled: boolean;
  publishableKey?: string;
  secretKey?: string;
  hasSecretKey?: boolean;
  webhookSecret?: string;
  status: IntegrationStatus;
  lastSyncAt?: string;
  lastError?: string;
}

export interface ZapierConfig {
  enabled: boolean;
  webhookUrl?: string;
  apiKey?: string;
  hasApiKey?: boolean;
  status: IntegrationStatus;
  lastTriggerAt?: string;
  lastError?: string;
}

export interface GoogleCalendarConfig {
  enabled: boolean;
  email?: string;
  clientId?: string;
  clientSecret?: string;
  hasClientSecret?: boolean;
  status: IntegrationStatus;
  lastSyncAt?: string;
  lastError?: string;
}

export interface SageOneConfig {
  enabled: boolean;
  apiUrl: string;
  apiKey?: string;
  hasApiKey?: boolean;
  clientId?: string;
  clientSecret?: string;
  hasClientSecret?: boolean;
  businessId?: string;
  syncContacts: boolean;
  syncInvoices: boolean;
  syncProducts: boolean;
  status: IntegrationStatus;
  lastSyncAt?: string;
  lastError?: string;
}

export interface Sage50Config {
  enabled: boolean;
  endpointUrl: string;
  companyName: string;
  username?: string;
  password?: string;
  hasPassword?: boolean;
  apiKey?: string;
  hasApiKey?: boolean;
  fiscalYear?: string;
  syncCustomers: boolean;
  syncInvoices: boolean;
  syncStock: boolean;
  status: IntegrationStatus;
  lastSyncAt?: string;
  lastError?: string;
}

export interface OpenCartConfig {
  enabled: boolean;
  storeUrl: string;
  apiUsername: string;
  apiKey?: string;
  hasApiKey?: boolean;
  syncProducts: boolean;
  syncOrders: boolean;
  syncCustomers: boolean;
  status: IntegrationStatus;
  lastSyncAt?: string;
  lastError?: string;
}

export interface Sage200Config {
  enabled: boolean;
  baseUrl: string;
  subscriptionKey?: string;
  hasSubscriptionKey?: boolean;
  clientId?: string;
  clientSecret?: string;
  hasClientSecret?: boolean;
  companyId?: string;
  syncCustomers: boolean;
  syncInvoices: boolean;
  syncLedgers: boolean;
  status: IntegrationStatus;
  lastSyncAt?: string;
  lastError?: string;
}

export interface PrestashopConfig {
  enabled: boolean;
  storeUrl: string;
  wsKey?: string;
  hasWsKey?: boolean;
  syncProducts: boolean;
  syncOrders: boolean;
  syncCustomers: boolean;
  status: IntegrationStatus;
  lastSyncAt?: string;
  lastError?: string;
}

export interface ProductAttributeMapping {
  unopim?: Record<string, any>;
  opencart?: Record<string, any>;
  sage?: Record<string, any>;
  odoo?: Record<string, any>;
  shopify?: Record<string, any>;
  woocommerce?: Record<string, any>;
  custom?: Record<string, any>;
  lastAutoMappedAt?: string;
}

export interface IntegrationsConfig {
  odoo: OdooConfig;
  woocommerce: WooCommerceConfig;
  shopify: ShopifyConfig;
  opencart?: OpenCartConfig;
  prestashop?: PrestashopConfig;
  n8n: N8nConfig;
  stripe?: StripeConfig;
  zapier?: ZapierConfig;
  google_calendar?: GoogleCalendarConfig;
  sage_one?: SageOneConfig;
  sage_50?: Sage50Config;
  sage_200?: Sage200Config;
}

