export type ShopifyGid = `gid://shopify/${string}/${string}`;

export interface ShopifyMoneyV2 {
  amount: string; // String decimal en unidades enteras de moneda (ej. "125.50")
  currencyCode: string;
}

export interface ShopifyMoneyBag {
  shopMoney: ShopifyMoneyV2;
  presentmentMoney?: ShopifyMoneyV2;
}

export interface ShopifyPageInfo {
  hasNextPage: boolean;
  endCursor?: string | null;
}

export interface ShopifyMailingAddress {
  id?: ShopifyGid;
  firstName?: string;
  lastName?: string;
  name?: string;
  company?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  provinceCode?: string;
  zip?: string;
  country?: string;
  countryCodeV2?: string; // Código ISO 2 letras (countryCode obsoleto)
  phone?: string;
}

export interface ShopifyOrderTransaction {
  id: ShopifyGid;
  kind?: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILURE' | 'ERROR' | 'AWAITING_RESPONSE';
  gateway: string;
  formattedGateway?: string;
  processedAt?: string;
  amountSet: ShopifyMoneyBag;
  paymentDetails?: Record<string, any>;
}

export interface ShopifyPurchasingCompany {
  __typename: 'PurchasingCompany';
  company: {
    id: ShopifyGid;
    name: string;
    externalId?: string;
  };
  contact?: {
    id: ShopifyGid;
    customer: {
      id: ShopifyGid;
      email: string;
      firstName?: string;
      lastName?: string;
    };
  };
  location: {
    id: ShopifyGid;
    name: string;
    externalId?: string;
    taxRegistrationId?: string;
    billingAddress?: ShopifyMailingAddress;
  };
}

export interface ShopifyPurchasingCustomer {
  __typename: 'Customer';
  id: ShopifyGid;
  email?: string;
}

export type ShopifyPurchasingEntity = ShopifyPurchasingCompany | ShopifyPurchasingCustomer;

export interface ShopifyLineItemNode {
  id: ShopifyGid;
  name: string;
  title?: string;
  variantTitle?: string;
  sku?: string;
  quantity: number;
  currentQuantity: number;
  originalUnitPriceSet: ShopifyMoneyBag;
  discountedTotalSet: ShopifyMoneyBag;
  totalDiscountSet?: ShopifyMoneyBag;
  taxLines?: Array<{
    title: string;
    rate?: number;
    ratePercentage?: number;
    priceSet: ShopifyMoneyBag;
  }>;
  product?: { id: ShopifyGid };
  variant?: { id: ShopifyGid; title?: string; sku?: string };
}

export interface ShopifyOrderNode {
  id: ShopifyGid;
  name: string; // ej. "#1001"
  legacyResourceId?: string;
  createdAt: string;
  processedAt: string;
  updatedAt?: string;
  cancelledAt?: string | null;
  email?: string;
  phone?: string;
  note?: string; // máx 5000 caracteres
  tags: string[];
  poNumber?: string;
  currencyCode: string;
  presentmentCurrencyCode?: string;
  taxesIncluded: boolean;
  totalWeight?: number;
  displayFinancialStatus?: string;
  displayFulfillmentStatus?: string;
  customAttributes?: Array<{ key: string; value: string }>;
  customer?: {
    id: ShopifyGid;
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    tags?: string[];
    taxExempt?: boolean;
    defaultAddress?: ShopifyMailingAddress;
  } | null;
  billingAddress?: ShopifyMailingAddress | null;
  shippingAddress?: ShopifyMailingAddress | null;
  subtotalPriceSet: ShopifyMoneyBag;
  totalPriceSet: ShopifyMoneyBag;
  totalTaxSet: ShopifyMoneyBag;
  totalDiscountsSet: ShopifyMoneyBag;
  totalShippingPriceSet: ShopifyMoneyBag;
  shippingLines?: {
    nodes: Array<{
      id: ShopifyGid;
      title: string;
      code?: string;
      carrierIdentifier?: string;
      source?: string;
      originalPriceSet: ShopifyMoneyBag;
    }>;
  };
  transactions?: ShopifyOrderTransaction[];
  purchasingEntity?: ShopifyPurchasingEntity | null;
  metafields?: {
    edges: Array<{
      node: {
        namespace: string;
        key: string;
        value: string;
      };
    }>;
  };
  lineItems: {
    edges: Array<{
      node: ShopifyLineItemNode;
    }>;
  };
}

export interface ShopifyProductOptionSetInput {
  name: string;
  position?: number;
  values: Array<{ name: string }>;
}

export interface ShopifyProductVariantSetInput {
  id?: ShopifyGid;
  sku?: string;
  barcode?: string;
  price?: string | number;
  compareAtPrice?: string | number;
  optionValues: Array<{ optionName: string; name: string }>;
  inventoryItem?: {
    sku: string;
    tracked: boolean;
    harmonizedSystemCode?: string; // 6 a 13 dígitos
    countryCodeOfOrigin?: string;
  };
}

export interface ShopifyProductSetInput {
  title: string;
  handle?: string;
  descriptionHtml?: string;
  status?: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  vendor?: string;
  productType?: string;
  tags?: string[]; // máx 250
  category?: ShopifyGid;
  collections?: ShopifyGid[];
  productOptions?: ShopifyProductOptionSetInput[]; // máx 3 opciones
  variants?: ShopifyProductVariantSetInput[]; // máx 2048 variantes
  metafields?: Array<{
    namespace: string;
    key: string;
    type: string;
    value: string;
  }>;
  files?: Array<{
    originalSource: string;
    alt?: string;
    contentType?: 'IMAGE' | 'VIDEO' | 'MODEL_3D';
  }>; // máx 250 medios
  seo?: {
    title?: string;
    description?: string;
  };
}

export interface ShopifyInventorySetQuantitiesInput {
  name: 'on_hand' | 'available';
  reason: 'correction' | 'cycle_count_available' | 'damaged' | 'movement_created' | 'other';
  ignoreCompareQuantity: boolean;
  referenceDocumentUri: string;
  quantities: Array<{
    inventoryItemId: ShopifyGid;
    locationId: ShopifyGid;
    quantity: number;
  }>;
}
