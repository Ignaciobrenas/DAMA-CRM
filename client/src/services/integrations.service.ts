import { apiRequest } from './api';

export interface ConnectorPublicConfig {
  enabled: boolean;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  lastSyncAt?: string;
  lastError?: string;
  [key: string]: any;
}

export interface IntegrationsResponseData {
  odoo: ConnectorPublicConfig & {
    url: string;
    db: string;
    username: string;
    hasApiKey: boolean;
    syncContacts: boolean;
    syncInvoices: boolean;
    syncProducts: boolean;
  };
  woocommerce: ConnectorPublicConfig & {
    storeUrl: string;
    hasConsumerKey: boolean;
    hasConsumerSecret: boolean;
    webhookSecret?: string;
  };
  shopify: ConnectorPublicConfig & {
    shopDomain: string;
    hasAccessToken: boolean;
    hasApiSecretKey: boolean;
    webhookSecret?: string;
  };
  n8n: ConnectorPublicConfig & {
    webhookUrl: string;
    hasApiKey: boolean;
    subscribedEvents: string[];
    lastTriggerAt?: string;
  };
  stripe?: ConnectorPublicConfig & {
    secretKey?: string;
    hasSecretKey?: boolean;
    publishableKey?: string;
  };
  zapier?: ConnectorPublicConfig & {
    webhookUrl?: string;
    hasApiKey?: boolean;
    lastTriggerAt?: string;
  };
  google_calendar?: ConnectorPublicConfig & {
    email?: string;
    hasClientSecret?: boolean;
  };
}

export interface IntegrationsEndpoints {
  woocommerceWebhook: string;
  shopifyWebhook: string;
  n8nActionEndpoint: string;
  unopimWebhook: string;
  whatsappWebhook: string;
  zapierWebhook?: string;
}

export interface ThirdPartyAppItem {
  id: string;
  nombre: string;
  categoria: string;
  tipo: string;
  estado: 'connected' | 'disconnected' | 'error' | 'pending';
  activo: boolean;
  descripcion: string;
  capacidades: string[];
  documentacion: string;
  webhookUrl?: string;
  actionEndpointUrl?: string;
  eventosSoportados?: string[];
  accionesInboundSoportadas?: string[];
  configuracion?: Record<string, any>;
}

export interface ThirdPartyCatalogResponse {
  success: boolean;
  endpoint: string;
  total: number;
  timestamp: string;
  aplicaciones: ThirdPartyAppItem[];
}

export const integrationsService = {
  async getIntegrations(): Promise<{ data: IntegrationsResponseData; endpoints: IntegrationsEndpoints }> {
    const res = await apiRequest<{ data: IntegrationsResponseData; endpoints: IntegrationsEndpoints }>('/integrations');
    return {
      data: res.data as any,
      endpoints: (res as any).endpoints || {},
    };
  },

  async getThirdPartyIntegrationsCatalog(): Promise<ThirdPartyCatalogResponse> {
    const res = await apiRequest('/integraciones-de-terceros');
    return res as unknown as ThirdPartyCatalogResponse;
  },

  async updateConfig(connector: string, payload: any): Promise<any> {
    const res = await apiRequest(`/integrations/${connector}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res;
  },

  async testConnection(connector: string, payload?: any): Promise<{ success: boolean; message: string; details?: any }> {
    const res = await apiRequest(`/integrations/${connector}/test`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
    return res as any;
  },

  async syncNow(connector: string): Promise<{ success: boolean; message: string; count?: number }> {
    const res = await apiRequest(`/integrations/${connector}/sync`, {
      method: 'POST',
    });
    return res as any;
  },

  async testN8n(payload?: any): Promise<{ success: boolean; message: string; details?: any }> {
    const res = await apiRequest('/integrations/n8n/test', {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
    return res as any;
  },
};
