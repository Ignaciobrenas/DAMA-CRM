export type ConnectorType =
  | 'odoo'
  | 'woocommerce'
  | 'shopify'
  | 'n8n'
  | 'unopim'
  | 'whatsapp'
  | 'stripe'
  | 'zapier'
  | 'google_calendar';

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

export interface IntegrationsConfig {
  odoo: OdooConfig;
  woocommerce: WooCommerceConfig;
  shopify: ShopifyConfig;
  n8n: N8nConfig;
  stripe?: StripeConfig;
  zapier?: ZapierConfig;
  google_calendar?: GoogleCalendarConfig;
}
