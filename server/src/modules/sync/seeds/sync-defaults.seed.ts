import { prisma } from '../../../prisma';
import { getDefaultCapabilities } from '../config-schema/capability-config.schema';
import { ChannelCategory } from '../types/sync.types';

interface DefaultChannelTypeSeed {
  name: string;
  description: string;
  type: ChannelCategory;
  connectorKey?: string;
  versions: Array<{ version: string; description: string }>;
}

const DEFAULT_ENVIRONMENTS = [
  {
    name: 'Production',
    description: 'Primary live production environment for active synchronization flows.',
    status: 'active',
    health: 'healthy',
    version: '2.0.0',
    uptime: '99.98%',
  },
  {
    name: 'Staging',
    description: 'Pre-production staging environment for integration validation and QA.',
    status: 'active',
    health: 'healthy',
    version: '2.0.0-rc',
    uptime: '99.90%',
  },
  {
    name: 'Sandbox',
    description: 'Isolated sandbox environment for testing credentials, mappings, and dry runs.',
    status: 'active',
    health: 'healthy',
    version: '2.0.0-dev',
    uptime: '99.50%',
  },
];

const DEFAULT_CHANNEL_TYPES: DefaultChannelTypeSeed[] = [
  {
    name: 'Shopify',
    description: 'Cloud e-commerce platform using GraphQL Admin API with cursor pagination and MoneyBag pricing.',
    type: 'B2C',
    connectorKey: 'shopify',
    versions: [
      { version: '2026-04', description: 'Shopify Admin GraphQL API 2026-04' },
      { version: '2025-10', description: 'Shopify Admin GraphQL API 2025-10' },
    ],
  },
  {
    name: 'Shopify B2B',
    description: 'Shopify Plus B2B channels with company locations, catalogs, price lists, and metafields.',
    type: 'B2B',
    connectorKey: 'shopify',
    versions: [
      { version: '2026-04', description: 'Shopify Plus B2B GraphQL Admin API 2026-04' },
    ],
  },
  {
    name: 'WooCommerce',
    description: 'WordPress e-commerce platform powered by REST API v3 with batch operations and variation stock.',
    type: 'B2C',
    connectorKey: 'woocommerce',
    versions: [
      { version: 'v3', description: 'WooCommerce REST API v3' },
      { version: 'v10.1.2', description: 'WooCommerce Core 10.1.2 (REST API v3)' },
    ],
  },
  {
    name: 'PrestaShop',
    description: 'Open-source e-commerce platform supporting Classic XML Webservice and PrestaShop 9 Admin API.',
    type: 'B2C',
    connectorKey: 'prestashop',
    versions: [
      { version: '9.0', description: 'PrestaShop 9 Admin API (OAuth2 client_credentials)' },
      { version: '8.2', description: 'PrestaShop 8.2 Classic Webservice (ws_key)' },
    ],
  },
  {
    name: 'Sage 200',
    description: 'Enterprise ERP supporting hybrid REST TmpIME asynchronous tasks and GraphQL ES256 queries.',
    type: 'ERP',
    connectorKey: 'sage_200',
    versions: [
      { version: 'v1.5.4', description: 'Sage 200 Hybrid REST + GraphQL Integration v1.5.4' },
      { version: '200', description: 'Sage 200 Standard ERP Connector' },
    ],
  },
  {
    name: 'a3ERP',
    description: 'Wolters Kluwer a3ERP REST API with procedure pagination, custom async tasks, and right-aligned codes.',
    type: 'ERP',
    connectorKey: 'a3erp',
    versions: [
      { version: 'v2.4', description: 'Sit.a3ERP.Api REST v2.4' },
      { version: 'v1.0', description: 'a3ERP Legacy Integration API v1.0' },
    ],
  },
  {
    name: 'Microsoft Dynamics 365 Business Central',
    description: 'Microsoft ERP supporting OData v4 and SOAP Web Services for items, customers, orders, and invoices.',
    type: 'ERP',
    versions: [
      { version: 'v4', description: 'Business Central OData v4' },
      { version: 'SOAP', description: 'Business Central SOAP Web Services' },
    ],
  },
  {
    name: 'HubSpot',
    description: 'CRM platform supporting companies, contacts, deals, products, and quote discounts.',
    type: 'CRM',
    versions: [
      { version: 'v3', description: 'HubSpot CRM API v3' },
    ],
  },
  {
    name: 'Mirakl',
    description: 'Marketplace platform for catalog offers, stock feeds, and order orchestration.',
    type: 'B2C',
    versions: [
      { version: '2025-10', description: 'Mirakl Seller/Operator REST API' },
    ],
  },
  {
    name: 'NopCommerce',
    description: 'Open-source .NET Core e-commerce platform for B2C and B2B storefronts.',
    type: 'B2C',
    versions: [
      { version: '4.90.3', description: 'NopCommerce Web API 4.90.3' },
    ],
  },
  {
    name: 'Nacex',
    description: 'Express courier and parcel tracking 3PL platform.',
    type: '3PL',
    versions: [
      { version: 'v1.0', description: 'Nacex Webservice API v1.0' },
    ],
  },
  {
    name: 'DHL',
    description: 'International parcel, freight, and shipment tracking logistics platform.',
    type: '3PL',
    versions: [
      { version: 'v1.0', description: 'DHL Shipping API v1.0' },
    ],
  },
  {
    name: 'CBL',
    description: 'Iberian logistics and transport expedition platform.',
    type: '3PL',
    versions: [
      { version: 'v1.0', description: 'CBL Expeditions API v1.0' },
    ],
  },
  {
    name: 'Outvio',
    description: 'Post-checkout fulfillment, shipment tracking, and returns management platform.',
    type: '3PL',
    versions: [
      { version: '2026-06', description: 'Outvio Fulfillment API 2026-06' },
    ],
  },
];

const DEFAULT_TASK_CATEGORIES = [
  {
    key: 'sync',
    name: 'Synchronization',
    description: 'Bidirectional data synchronization workflows across connected platforms.',
    icon: 'refresh-cw',
    color: '#2563eb',
    order: 1,
  },
  {
    key: 'import',
    name: 'Import',
    description: 'Inbound data ingestion tasks from external channels into DAMA-CRM.',
    icon: 'download',
    color: '#10b981',
    order: 2,
  },
  {
    key: 'export',
    name: 'Export',
    description: 'Outbound catalog, pricing, stock, and document publishing tasks.',
    icon: 'upload',
    color: '#f59e0b',
    order: 3,
  },
  {
    key: 'reconciliation',
    name: 'Reconciliation',
    description: 'Customer, tax ID, and ledger reconciliation workflows between ERP and storefronts.',
    icon: 'git-compare',
    color: '#6366f1',
    order: 4,
  },
  {
    key: 'backup',
    name: 'Backup & Snapshot',
    description: 'Scheduled data snapshot and archival workflows.',
    icon: 'shield',
    color: '#8b5cf6',
    order: 5,
  },
  {
    key: 'cleanup',
    name: 'Maintenance & Cleanup',
    description: 'Automated pruning of stale logs, expired states, and orphan mappings.',
    icon: 'trash-2',
    color: '#ef4444',
    order: 6,
  },
  {
    key: 'notification',
    name: 'Notifications & Alerts',
    description: 'Threshold alerts and operational health digest workflows.',
    icon: 'bell',
    color: '#06b6d4',
    order: 7,
  },
  {
    key: 'custom',
    name: 'Custom Workflows',
    description: 'User-defined custom synchronization templates and webhook pipelines.',
    icon: 'sliders',
    color: '#64748b',
    order: 8,
  },
];

const seededTenants = new Set<string>();

/**
 * Idempotently seeds default environments, channel types, channel versions,
 * task categories, and system task types for a tenant.
 */
export async function ensureTenantSyncDefaults(tenantId: string): Promise<void> {
  const normalizedTenant = tenantId || 'master';
  if (seededTenants.has(normalizedTenant)) return;

  // 1. Environments
  for (const env of DEFAULT_ENVIRONMENTS) {
    await prisma.syncEnvironment.upsert({
      where: { tenantId_name: { tenantId: normalizedTenant, name: env.name } },
      update: {},
      create: {
        tenantId: normalizedTenant,
        ...env,
      },
    });
  }

  // 2. Channel Types & Versions
  const channelTypeIdsByName = new Map<string, string>();
  for (const ct of DEFAULT_CHANNEL_TYPES) {
    const capabilities = JSON.stringify(getDefaultCapabilities(ct.type));
    const savedType = await prisma.syncChannelType.upsert({
      where: { tenantId_name: { tenantId: normalizedTenant, name: ct.name } },
      update: {},
      create: {
        tenantId: normalizedTenant,
        name: ct.name,
        description: ct.description,
        type: ct.type,
        capabilities,
        connectorKey: ct.connectorKey ?? null,
      },
    });
    channelTypeIdsByName.set(ct.name, savedType.id);

    for (const v of ct.versions) {
      await prisma.syncChannelVersionType.upsert({
        where: { typeId_version: { typeId: savedType.id, version: v.version } },
        update: {},
        create: {
          tenantId: normalizedTenant,
          typeId: savedType.id,
          version: v.version,
          description: v.description,
        },
      });
    }
  }

  // 3. Task Type Categories
  const categoryIdsByKey = new Map<string, string>();
  for (const cat of DEFAULT_TASK_CATEGORIES) {
    const savedCat = await prisma.syncTaskTypeCategory.upsert({
      where: { tenantId_key: { tenantId: normalizedTenant, key: cat.key } },
      update: {},
      create: {
        tenantId: normalizedTenant,
        ...cat,
        isActive: true,
        metadata: '{}',
      },
    });
    categoryIdsByKey.set(cat.key, savedCat.id);
  }

  // 4. Default System Task Types
  const erpIds = ['Sage 200', 'a3ERP', 'Microsoft Dynamics 365 Business Central']
    .map((n) => channelTypeIdsByName.get(n))
    .filter((id): id is string => Boolean(id));
  const ecomIds = ['Shopify', 'Shopify B2B', 'WooCommerce', 'PrestaShop']
    .map((n) => channelTypeIdsByName.get(n))
    .filter((id): id is string => Boolean(id));
  const allCommercialIds = [...erpIds, ...ecomIds];

  const defaultTaskTypes = [
    {
      name: 'Catalog Products Sync',
      description: 'Synchronizes product master data, variants, attributes, and SKUs between ERP and e-commerce channels.',
      categoryKey: 'sync',
      icon: 'package',
      color: '#2563eb',
      dataEntityType: 'products',
      operationType: 'incremental',
      direction: 'export',
      workflowConfig: { mode: 'connector', operation: 'sync_catalog', version: '1.0.0' },
      supportedChannelTypeIds: allCommercialIds,
      parameters: [
        { name: 'Batch Size', key: 'batchSize', type: 'number', required: false, defaultValue: '50', description: 'Records processed per batch', order: 1 },
        { name: 'Updated Since (ISO)', key: 'sinceDate', type: 'string', required: false, defaultValue: '', description: 'Optional incremental cursor timestamp', order: 2 },
        { name: 'Include Obsolete Items', key: 'includeInactive', type: 'boolean', required: false, defaultValue: 'false', description: 'Include blocked or archived SKUs', order: 3 },
      ],
    },
    {
      name: 'Orders Import to ERP',
      description: 'Imports validated storefront orders into ERP sales orders with customer tax ID reconciliation.',
      categoryKey: 'import',
      icon: 'shopping-cart',
      color: '#10b981',
      dataEntityType: 'orders',
      operationType: 'incremental',
      direction: 'import',
      workflowConfig: { mode: 'connector', operation: 'import_orders', version: '1.0.0' },
      supportedChannelTypeIds: allCommercialIds,
      parameters: [
        { name: 'Order Status Filter', key: 'orderStatus', type: 'select', required: false, defaultValue: '"processing"', options: [{ value: 'pending', label: 'Pending' }, { value: 'processing', label: 'Processing' }, { value: 'completed', label: 'Completed' }], description: 'Filter external orders by status', order: 1 },
        { name: 'Auto-Create Missing Customer', key: 'autoCreateCustomer', type: 'boolean', required: false, defaultValue: 'true', description: 'Automatically provision ERP customer when tax ID is absent', order: 2 },
      ],
    },
    {
      name: 'Inventory & Stock Sync',
      description: 'Updates real-time warehouse stock levels and variant availability across storefronts.',
      categoryKey: 'sync',
      icon: 'layers',
      color: '#0ea5e9',
      dataEntityType: 'stock',
      operationType: 'incremental',
      direction: 'bidirectional',
      workflowConfig: { mode: 'connector', operation: 'sync_stock', version: '1.0.0' },
      supportedChannelTypeIds: allCommercialIds,
      parameters: [
        { name: 'Warehouse Code', key: 'warehouseCode', type: 'string', required: false, defaultValue: '"MAIN"', description: 'Source warehouse identifier', order: 1 },
        { name: 'Safety Buffer', key: 'safetyBuffer', type: 'number', required: false, defaultValue: '0', description: 'Minimum units withheld from storefronts', order: 2 },
      ],
    },
    {
      name: 'Prices & B2B Tariffs Export',
      description: 'Publishes ERP price lists, customer tariffs, and VAT-aware pricing rules to B2B/B2C channels.',
      categoryKey: 'export',
      icon: 'tag',
      color: '#f59e0b',
      dataEntityType: 'prices',
      operationType: 'full_sync',
      direction: 'export',
      workflowConfig: { mode: 'connector', operation: 'export_prices', version: '1.0.0' },
      supportedChannelTypeIds: allCommercialIds,
      parameters: [
        { name: 'Tariff Code', key: 'tariffCode', type: 'string', required: false, defaultValue: '"STD"', description: 'ERP tariff or Shopify B2B PriceList identifier', order: 1 },
        { name: 'Tax Mode', key: 'taxMode', type: 'select', required: false, defaultValue: '"tax_excluded"', options: [{ value: 'tax_excluded', label: 'Tax Excluded' }, { value: 'tax_included', label: 'Tax Included' }], description: 'Whether exported amounts include VAT', order: 2 },
      ],
    },
    {
      name: 'Customer & Tax ID Reconciliation',
      description: 'Matches storefront customers against ERP accounts by NIF/VAT number and flags discrepancies.',
      categoryKey: 'reconciliation',
      icon: 'users',
      color: '#6366f1',
      dataEntityType: 'customers',
      operationType: 'reconciliation',
      direction: 'bidirectional',
      workflowConfig: { mode: 'connector', operation: 'ensure_customer', version: '1.0.0' },
      supportedChannelTypeIds: allCommercialIds,
      parameters: [
        { name: 'Dry Run Only', key: 'dryRun', type: 'boolean', required: false, defaultValue: 'false', description: 'Simulate reconciliation without writing changes', order: 1 },
        { name: 'Hold On Mismatch', key: 'holdOnMismatch', type: 'boolean', required: false, defaultValue: 'true', description: 'Flag mismatched accounts for manual review', order: 2 },
      ],
    },
    {
      name: 'Invoices & Delivery Notes Sync',
      description: 'Synchronizes ERP delivery notes, billing documents, and invoice PDFs.',
      categoryKey: 'export',
      icon: 'file-text',
      color: '#8b5cf6',
      dataEntityType: 'invoices',
      operationType: 'incremental',
      direction: 'export',
      workflowConfig: { mode: 'connector', operation: 'sync_invoices', version: '1.0.0' },
      supportedChannelTypeIds: erpIds,
      parameters: [
        { name: 'Document Series', key: 'series', type: 'string', required: false, defaultValue: '"FAC"', description: 'Fiscal billing series code', order: 1 },
        { name: 'Include PDF Binary', key: 'includePdf', type: 'boolean', required: false, defaultValue: 'false', description: 'Retrieve printable PDF representation when supported', order: 2 },
      ],
    },
  ];

  for (const tt of defaultTaskTypes) {
    const categoryId = categoryIdsByKey.get(tt.categoryKey);
    if (!categoryId) continue;

    const existing = await prisma.syncTaskType.findUnique({
      where: { tenantId_name: { tenantId: normalizedTenant, name: tt.name } },
    });
    if (existing) continue;

    const created = await prisma.syncTaskType.create({
      data: {
        tenantId: normalizedTenant,
        name: tt.name,
        description: tt.description,
        categoryId,
        icon: tt.icon,
        color: tt.color,
        isActive: true,
        isSystem: true,
        dataEntityType: tt.dataEntityType,
        operationType: tt.operationType,
        direction: tt.direction,
        requiresFile: false,
        workflowConfig: JSON.stringify(tt.workflowConfig),
        supportedChannelTypeIds: JSON.stringify(tt.supportedChannelTypeIds),
        supportedChannelVersionIds: '[]',
        executionConfig: JSON.stringify({
          timeoutMinutes: 15,
          retryAttempts: 3,
          retryDelayMinutes: 2,
          concurrentExecutions: 1,
          priority: 'normal',
        }),
        monitoringConfig: JSON.stringify({
          successThreshold: 95,
          errorThreshold: 5,
          enableAlerts: true,
        }),
        version: '1.0.0',
      },
    });

    for (const p of tt.parameters) {
      await prisma.syncTaskTypeParameter.create({
        data: {
          taskTypeId: created.id,
          name: p.name,
          key: p.key,
          type: p.type,
          required: p.required,
          defaultValue: p.defaultValue ?? null,
          options: JSON.stringify((p as any).options || []),
          validation: '{}',
          description: p.description,
          order: p.order,
        },
      });
    }
  }

  seededTenants.add(normalizedTenant);
}

export function resetSeededTenantsCache(): void {
  seededTenants.clear();
}
