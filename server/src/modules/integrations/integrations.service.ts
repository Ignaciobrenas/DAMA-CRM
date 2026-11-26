import { prisma } from '../../prisma';
import {
  A3ErpConfig,
  ConnectorType,
  IntegrationsConfig,
  N8nConfig,
  OdooConfig,
  OpenCartConfig,
  PrestashopConfig,
  ProductAttributeMapping,
  Sage200Config,
  Sage50Config,
  SageOneConfig,
  ShopifyConfig,
  WooCommerceConfig,
} from './integrations.types';
import {
  ConnectionTestResult,
  ConnectorOperationResult,
  ConnectorRegistry,
  IntegrationHttpClient,
  IntegrationsConfigStore,
  MappingEngine,
  SyncOperationResult,
} from './core';
import {
  a3erpConnector,
  googleCalendarConnector,
  n8nConnector,
  odooConnector,
  opencartConnector,
  prestashopConnector,
  sage200Connector,
  sage50Connector,
  sageOneConnector,
  shopifyConnector,
  stripeConnector,
  woocommerceConnector,
  zapierConnector,
} from './connectors';

/**
 * Fachada modular de integraciones de DAMA-CRM.
 * Delega toda la lógica específica de cada plataforma en su propio conector registrado en ConnectorRegistry.
 */
export class IntegrationsService {
  public static loadConfig(): IntegrationsConfig {
    return IntegrationsConfigStore.loadConfig();
  }

  public static saveConfig(newConfig: IntegrationsConfig): void {
    IntegrationsConfigStore.saveConfig(newConfig);
  }

  public static getPublicConfig() {
    return IntegrationsConfigStore.getPublicConfig();
  }

  public static updateConnectorConfig<K extends keyof IntegrationsConfig>(
    connector: K,
    patch: Partial<IntegrationsConfig[K]>
  ): IntegrationsConfig[K] {
    return IntegrationsConfigStore.updateConnectorConfig(connector, patch);
  }

  // ---------------------------------------------------------------------------
  // Connectivity Tests (Delegated to Modular Connectors)
  // ---------------------------------------------------------------------------

  public static async testConnector(
    connector: ConnectorType,
    config?: Record<string, any>
  ): Promise<ConnectionTestResult> {
    if (connector === 'unopim' || connector === 'whatsapp') {
      return {
        success: true,
        message: `Conector nativo ${connector} activo y respondiendo.`,
      };
    }
    const instance = ConnectorRegistry.get(connector);
    if (!instance) {
      return { success: false, message: `Conector no soportado para test: ${connector}` };
    }
    return instance.testConnection(config);
  }

  public static async testA3Erp(config?: Partial<A3ErpConfig>): Promise<ConnectionTestResult> {
    return a3erpConnector.testConnection(config);
  }

  public static async testOdoo(config?: Partial<OdooConfig>): Promise<ConnectionTestResult> {
    return odooConnector.testConnection(config);
  }

  public static async testWooCommerce(config?: Partial<WooCommerceConfig>): Promise<ConnectionTestResult> {
    return woocommerceConnector.testConnection(config);
  }

  public static async testPrestashop(config?: Partial<PrestashopConfig>): Promise<ConnectionTestResult> {
    return prestashopConnector.testConnection(config);
  }

  public static async testShopify(config?: Partial<ShopifyConfig>): Promise<ConnectionTestResult> {
    return shopifyConnector.testConnection(config);
  }

  public static async testOpenCart(config?: Partial<OpenCartConfig>): Promise<ConnectionTestResult> {
    return opencartConnector.testConnection(config);
  }

  public static async testN8n(config?: Partial<N8nConfig>): Promise<ConnectionTestResult> {
    return n8nConnector.testConnection(config);
  }

  public static async testStripe(config?: any): Promise<ConnectionTestResult> {
    return stripeConnector.testConnection(config);
  }

  public static async testZapier(config?: any): Promise<ConnectionTestResult> {
    return zapierConnector.testConnection(config);
  }

  public static async testGoogleCalendar(config?: any): Promise<ConnectionTestResult> {
    return googleCalendarConnector.testConnection(config);
  }

  public static async testSageOne(config?: Partial<SageOneConfig>): Promise<ConnectionTestResult> {
    return sageOneConnector.testConnection(config);
  }

  public static async testSage50(config?: Partial<Sage50Config>): Promise<ConnectionTestResult> {
    return sage50Connector.testConnection(config);
  }

  public static async testSage200(config?: Partial<Sage200Config>): Promise<ConnectionTestResult> {
    return sage200Connector.testConnection(config);
  }

  // ---------------------------------------------------------------------------
  // Synchronization & Platform Operations
  // ---------------------------------------------------------------------------

  public static async syncConnector(
    connector: ConnectorType,
    tenantId: string = 'master'
  ): Promise<SyncOperationResult> {
    const instance = ConnectorRegistry.get(connector);
    if (!instance) {
      return { success: false, message: `Conector no soportado para sincronización: ${connector}` };
    }
    return instance.sync(tenantId);
  }

  public static async syncOpenCart(tenantId: string = 'master') {
    return opencartConnector.sync(tenantId);
  }

  public static async syncOdooAgilePlanner() {
    return odooConnector.syncAgilePlanner();
  }

  public static getConnectorCatalog(connector: ConnectorType): Record<string, any> | null {
    const instance = ConnectorRegistry.get(connector);
    if (!instance) return null;
    return instance.getCatalog();
  }

  public static async executeConnectorOperation(
    connector: ConnectorType,
    operation: string,
    payload: any = {},
    tenantId: string = 'master'
  ): Promise<ConnectorOperationResult> {
    const instance = ConnectorRegistry.get(connector);
    if (!instance) {
      return {
        success: false,
        operation,
        connector,
        message: `Conector '${connector}' no registrado en ConnectorRegistry.`,
      };
    }
    return instance.executeOperation(operation, payload, tenantId);
  }

  // ---------------------------------------------------------------------------
  // Webhooks & Inbound Action Receivers
  // ---------------------------------------------------------------------------

  public static async processWooCommerceWebhook(topic: string, body: any) {
    return woocommerceConnector.handleWebhook(topic, body);
  }

  public static verifyShopifyHmac(rawBody: string, hmacHeader: string, secret?: string): boolean {
    return shopifyConnector.verifyShopifyHmac(rawBody, hmacHeader, secret);
  }

  public static async processShopifyWebhook(topic: string, body: any) {
    return shopifyConnector.handleWebhook(topic, body);
  }

  public static async processN8nAction(action: string, payload: any) {
    return n8nConnector.processInboundAction(action, payload);
  }

  public static async dispatchN8nEvent(eventName: string, payload: any): Promise<void> {
    return n8nConnector.dispatchEvent(eventName, payload);
  }

  public static async processStripeWebhook(body: any) {
    return stripeConnector.handleWebhook('stripe', body);
  }

  public static async processZapierWebhook(body: any) {
    return zapierConnector.handleWebhook('zapier', body);
  }

  public static async handleOpenCartWebhook(payload: any, tenantId: string = 'master') {
    const res = await opencartConnector.handleWebhook(payload?.event || 'unknown', payload, {}, tenantId);
    return { success: res.handled, event: res.action };
  }

  public static async sendHttpRequest(
    targetUrl: string,
    method: 'GET' | 'POST' = 'POST',
    body?: any,
    headers: Record<string, string> = {}
  ): Promise<string> {
    const res = await IntegrationHttpClient.request({
      url: targetUrl,
      method,
      body,
      headers,
    });
    return res.rawBody;
  }

  // ---------------------------------------------------------------------------
  // Multi-App Product Attribute Auto-Mapper
  // ---------------------------------------------------------------------------

  public static autoMapProductAttributes(
    product: any,
    sourceApp?: string,
    rawData?: any
  ): ProductAttributeMapping {
    return MappingEngine.autoMapProductAttributes(product, sourceApp, rawData);
  }

  public static getConnectorsAttributesSchema(): Record<
    string,
    { label: string; icon: string; fields: Array<{ key: string; label: string; type: string; example: string }> }
  > {
    return {
      a3erp: {
        label: 'a3ERP (Wolters Kluwer)',
        icon: 'Building2',
        fields: [
          { key: 'CODART', label: 'Código Artículo (15 cuadrado)', type: 'string', example: '              1' },
          { key: 'DESCART', label: 'Descripción Artículo', type: 'string', example: 'Kit Recambio Industrial' },
          { key: 'PRCVENTA', label: 'Precio de Venta (PVP sin IVA)', type: 'number', example: '612.25' },
          { key: 'TIPIVA', label: 'Código Tipo IVA', type: 'string', example: 'ORD21' },
          { key: 'UNIDADESSTOCK', label: 'Stock Total Almacenes', type: 'number', example: '36' },
        ],
      },
      prestashop: {
        label: 'PrestaShop 8 / 9 Dual API',
        icon: 'ShoppingBag',
        fields: [
          { key: 'reference', label: 'Referencia SKU (máx 64)', type: 'string', example: 'PS-JKT-01' },
          { key: 'priceTaxExcluded', label: 'Precio Base sin IVA', type: 'number', example: '100.000000' },
          { key: 'taxRulesGroupId', label: 'Grupo Regla Impuestos', type: 'number', example: '1 (ES Standard 21%)' },
          { key: 'names.es-ES', label: 'Nombre Localizado (es-ES)', type: 'string', example: 'Chaqueta Técnica' },
        ],
      },
      unopim: {
        label: 'UnoPIM PIM Catalog',
        icon: 'Boxes',
        fields: [
          { key: 'family', label: 'Familia PIM', type: 'string', example: 'electronica_general' },
          { key: 'attributes.brand', label: 'Marca / Fabricante', type: 'string', example: 'Sony' },
          { key: 'attributes.weight_kg', label: 'Peso (Kg)', type: 'number', example: '0.45' },
          { key: 'attributes.dimensions_cm', label: 'Dimensiones', type: 'string', example: '20x15x10 cm' },
          { key: 'attributes.completeness_percentage', label: 'Completitud PIM', type: 'number', example: '100%' },
        ],
      },
      opencart: {
        label: 'OpenCart eCommerce',
        icon: 'ShoppingBag',
        fields: [
          { key: 'model', label: 'Modelo OpenCart', type: 'string', example: 'OC-PROD-01' },
          { key: 'location', label: 'Ubicación en Almacén', type: 'string', example: 'Pasillo A - Est. 3' },
          { key: 'upc', label: 'Código UPC / EAN', type: 'string', example: '8435123456789' },
          { key: 'weight_class_id', label: 'Unidad de Peso', type: 'string', example: 'Kg' },
          { key: 'tax_class_id', label: 'Clase de Impuesto', type: 'string', example: '21% IVA General' },
        ],
      },
      sage: {
        label: 'Sage ERP (1, 50, 200)',
        icon: 'Calculator',
        fields: [
          { key: 'codigoArticulo', label: 'Código Artículo Sage 200 (máx 20)', type: 'string', example: 'SAGE200-ENT-01' },
          { key: 'nominal_code', label: 'Cuenta Contable Ventas (PGC)', type: 'string', example: '700000' },
          { key: 'cost_nominal_code', label: 'Cuenta Contable Compras (PGC)', type: 'string', example: '600000' },
          { key: 'tax_code', label: 'Código de IVA Sage', type: 'string', example: 'IVA21' },
          { key: 'warehouse_bin', label: 'Ubicación / Gaveta Sage', type: 'string', example: 'A-01-01' },
          { key: 'commodity_code', label: 'Código Arancelario Intrastat', type: 'string', example: '8471300090' },
        ],
      },
      odoo: {
        label: 'Odoo ERP (v16, v17, v18)',
        icon: 'Building2',
        fields: [
          { key: 'default_code', label: 'Referencia Interna (default_code)', type: 'string', example: 'PROD-001' },
          { key: 'categ_id', label: 'Categoría Odoo', type: 'string', example: 'All / Saleable' },
          { key: 'type', label: 'Tipo de Producto', type: 'string', example: 'product (Almacenable)' },
          { key: 'taxes_id', label: 'Impuestos de Cliente', type: 'string', example: '21% IVA' },
        ],
      },
      shopify: {
        label: 'Shopify Store (GraphQL & B2B)',
        icon: 'Store',
        fields: [
          { key: 'handle', label: 'Handle URL', type: 'string', example: 'camara-uhd-pro-4k' },
          { key: 'vendor', label: 'Proveedor / Vendor', type: 'string', example: 'Sony' },
          { key: 'product_type', label: 'Tipo de Producto', type: 'string', example: 'Electrónica' },
          { key: 'metafields.custom.brand', label: 'Metafield: Marca', type: 'string', example: 'Sony' },
        ],
      },
      woocommerce: {
        label: 'WooCommerce REST v3',
        icon: 'ShoppingCart',
        fields: [
          { key: 'sku', label: 'SKU Tienda', type: 'string', example: 'CAM-PRO-4K' },
          { key: 'regular_price', label: 'Precio Regular (con IVA)', type: 'string', example: '229.89' },
          { key: 'manage_stock', label: 'Gestión de Inventario', type: 'boolean', example: 'true' },
          { key: 'tax_class', label: 'Tipo Impositivo', type: 'string', example: 'standard' },
        ],
      },
    };
  }

  public static async bulkAutoMapProducts(
    tenantId: string = 'master'
  ): Promise<{ mappedCount: number; success: boolean }> {
    const products = await prisma.product.findMany({
      where: tenantId === 'master' ? {} : { tenantId },
    });

    let count = 0;
    for (const prod of products) {
      const mapped = this.autoMapProductAttributes(prod);
      await prisma.product.update({
        where: { id: prod.id },
        data: {
          attributes: JSON.stringify(mapped),
        },
      });
      count++;
    }

    return { mappedCount: count, success: true };
  }
}
