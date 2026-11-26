import { ConnectorType } from '../integrations.types';

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
  details?: Record<string, any>;
}

export interface SyncOperationResult {
  success: boolean;
  message: string;
  count?: number;
  syncedProducts?: number;
  syncedOrders?: number;
  syncedCustomers?: number;
  syncedStock?: number;
  syncedPrices?: number;
  details?: Record<string, any>;
}

export interface ConnectorOperationResult<T = any> {
  success: boolean;
  operation: string;
  connector: ConnectorType;
  message: string;
  data?: T;
  taskId?: string | number;
  taskStatus?: string;
  pagination?: {
    totalCount: number;
    pageSize: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage?: boolean;
    endCursor?: string | null;
  };
  warnings?: string[];
  errors?: string[];
}

export interface WebhookProcessResult {
  handled: boolean;
  action: string;
  entityId?: string;
  status?: string;
  details?: Record<string, any>;
}

export interface CanonicalAddress {
  firstName?: string;
  lastName?: string;
  company?: string;
  vatNumber?: string;
  dni?: string;
  street1: string;
  street2?: string;
  city: string;
  postalCode: string;
  province?: string;
  provinceCode?: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface CanonicalCustomer {
  externalId?: string;
  code?: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  nifCif?: string;
  email: string;
  phone?: string;
  isGuest?: boolean;
  isB2B?: boolean;
  tags?: string[];
  billingAddress?: CanonicalAddress;
  shippingAddress?: CanonicalAddress;
  metadata?: Record<string, any>;
}

export interface CanonicalOrderLine {
  externalId?: string;
  productId?: string;
  variantId?: string;
  productSku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  unitPriceTaxIncl?: number;
  unitPriceTaxExcl?: number;
  subtotal: number;
  discountAmount: number;
  discountPercentage: number;
  taxRate: number;
  taxAmount: number;
  totalPrice: number;
  warehouseCode?: string;
  metadata?: Record<string, any>;
}

export interface CanonicalOrder {
  channelOrderId: string;
  orderNumber: string;
  sourceCreatedAt: string;
  status: string;
  fulfillmentStatus?: string;
  financialStatus?: string;
  currency: string;
  taxesIncluded: boolean;
  poNumber?: string;
  customer: CanonicalCustomer;
  billingAddress?: CanonicalAddress;
  shippingAddress?: CanonicalAddress;
  lineItems: CanonicalOrderLine[];
  totals: {
    subtotal: number;
    shippingAmount: number;
    discountAmount: number;
    taxAmount: number;
    total: number;
  };
  payments?: Array<{
    method: string;
    provider: string;
    amount: number;
    currency: string;
    transactionId?: string;
    status?: string;
  }>;
  shippings?: Array<{
    method: string;
    provider: string;
    cost: number;
    trackingNumber?: string;
  }>;
  notes?: Array<{
    content: string;
    author: string;
    authorName: string;
    type: string;
    createdAt: string;
  }>;
  metadata?: Record<string, any>;
}

export interface CanonicalProductVariant {
  externalId?: string;
  sku: string;
  barcode?: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  weight?: number;
  options: Array<{ name: string; value: string }>;
  inventoryItemId?: string;
}

export interface CanonicalProduct {
  externalId?: string;
  sku: string;
  name: string;
  description?: string;
  shortDescription?: string;
  handle?: string;
  type: 'simple' | 'configurable' | 'variable';
  status: 'active' | 'draft' | 'archived';
  basePrice: number;
  salePrice?: number;
  costPrice?: number;
  taxClass: 'standard' | 'reduced' | 'super_reduced' | 'exempt';
  taxRate: number;
  stockQuantity: number;
  weight?: number;
  barcode?: string;
  brand?: string;
  category?: string;
  tags?: string[];
  options?: Array<{ name: string; position?: number; values: string[] }>;
  variants?: CanonicalProductVariant[];
  images?: Array<{ url: string; alt?: string; position?: number; isPrimary?: boolean }>;
  metadata?: Record<string, any>;
}

export interface IPlatformConnector<TConfig = any> {
  readonly id: ConnectorType;
  readonly name: string;
  readonly category: string;
  readonly protocol: string;
  readonly supportedOperations: string[];

  testConnection(config?: Partial<TConfig>): Promise<ConnectionTestResult>;
  sync(tenantId?: string, options?: Record<string, any>): Promise<SyncOperationResult>;
  getCatalog(): Record<string, any>;
  executeOperation(operation: string, payload?: any, tenantId?: string): Promise<ConnectorOperationResult>;
  handleWebhook?(
    topicOrEvent: string,
    payload: any,
    headers?: Record<string, any>,
    tenantId?: string
  ): Promise<WebhookProcessResult>;
}
