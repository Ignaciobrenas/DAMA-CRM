export type PrestaShopLocalizedMap = Record<string, string>; // ej. { "es-ES": "Camiseta Técnica" }

export interface PrestaShopWebserviceOrderRow {
  id?: string | number;
  product_id: string | number;
  product_attribute_id?: string | number;
  product_quantity: string | number;
  product_name: string;
  product_reference?: string;
  product_ean13?: string;
  product_isbn?: string;
  product_upc?: string;
  product_price: string | number;
  unit_price_tax_incl?: string | number;
  unit_price_tax_excl?: string | number;
}

export interface PrestaShopWebserviceOrder {
  id: number | string;
  reference: string;
  id_address_delivery: number | string;
  id_address_invoice: number | string;
  id_cart: number | string;
  id_currency: number | string;
  id_lang: number | string;
  id_customer: number | string;
  id_carrier: number | string;
  current_state: number | string;
  module: string;
  payment: string;
  total_paid: string | number;
  total_paid_real: string | number;
  total_paid_tax_incl: string | number;
  total_paid_tax_excl: string | number;
  total_products: string | number;
  total_products_wt: string | number;
  total_shipping_tax_incl: string | number;
  total_shipping_tax_excl: string | number;
  total_discounts_tax_incl: string | number;
  total_discounts_tax_excl: string | number;
  conversion_rate: string | number;
  invoice_number?: string;
  delivery_number?: string;
  shipping_number?: string;
  note?: string;
  valid?: string | number;
  id_shop?: number | string;
  date_add: string;
  date_upd: string;
  associations?: {
    order_rows?: PrestaShopWebserviceOrderRow[];
  };
}

export interface PrestaShopWebserviceOrderDetail {
  id: number | string;
  id_order: number | string;
  product_id: number | string;
  product_attribute_id: number | string;
  product_name: string;
  product_quantity: number | string;
  product_price: string | number;
  product_reference: string;
  product_ean13?: string;
  product_weight?: string | number;
  unit_price_tax_incl: string | number;
  unit_price_tax_excl: string | number;
  total_price_tax_incl: string | number;
  total_price_tax_excl: string | number;
  reduction_percent?: string | number;
  reduction_amount_tax_incl?: string | number;
  reduction_amount_tax_excl?: string | number;
}

export interface PrestaShopWebserviceCustomer {
  id: number | string;
  firstname: string;
  lastname: string;
  email: string;
  company?: string;
  siret?: string;
  ape?: string;
  is_guest?: string | number;
  active?: string | number;
  id_default_group?: number | string;
  date_add?: string;
  date_upd?: string;
}

export interface PrestaShopWebserviceAddress {
  id: number | string;
  id_customer: number | string;
  id_country: number | string;
  id_state?: number | string;
  alias: string;
  company?: string;
  lastname: string;
  firstname: string;
  address1: string;
  address2?: string;
  postcode?: string;
  city: string;
  other?: string;
  phone?: string;
  phone_mobile?: string;
  vat_number?: string;
  dni?: string;
}

export interface PrestaShopAdminApiProduct {
  productId?: number;
  type: 'standard' | 'pack' | 'virtual' | 'combinations';
  enabled?: boolean;
  names: PrestaShopLocalizedMap;
  descriptions?: PrestaShopLocalizedMap;
  shortDescriptions?: PrestaShopLocalizedMap;
  tags?: Record<string, string[]>;
  priceTaxExcluded?: string | number;
  priceTaxIncluded?: string | number;
  ecotaxTaxExcluded?: string | number;
  ecotaxTaxIncluded?: string | number;
  taxRulesGroupId?: number;
  onSale?: boolean;
  wholesalePrice?: string | number;
  unitPriceTaxExcluded?: string | number;
  unitPriceTaxIncluded?: string | number;
  unity?: string;
  unitPriceRatio?: string | number;
  visibility?: 'both' | 'catalog' | 'search' | 'none';
  availableForOrder?: boolean;
  onlineOnly?: boolean;
  showPrice?: boolean;
  condition?: 'new' | 'used' | 'refurbished';
  showCondition?: boolean;
  manufacturerId?: number;
  isbn?: string;
  upc?: string;
  gtin?: string;
  mpn?: string;
  reference?: string; // máx 64
  redirectType?: string;
  redirectTarget?: number | null;
  packStockType?: number;
  outOfStockType?: number;
  quantity?: number;
  minimalQuantity?: number;
  lowStockThreshold?: number;
  lowStockAlertEnabled?: boolean;
  availableNowLabels?: PrestaShopLocalizedMap;
  location?: string;
  availableLaterLabels?: PrestaShopLocalizedMap;
  availableDate?: string | null;
  coverThumbnailUrl?: string;
  shopIds?: number[];
  categories?: Array<{ categoryId: number; name?: string; displayName?: string }>;
  defaultCategoryId?: number;
  carrierReferenceIds?: number[];
  deliveryTimeNoteType?: number;
  deliveryTimeInStockNotes?: PrestaShopLocalizedMap;
  deliveryTimeOutOfStockNotes?: PrestaShopLocalizedMap;
  metaTitles?: PrestaShopLocalizedMap;
  metaDescriptions?: PrestaShopLocalizedMap;
  linkRewrites?: PrestaShopLocalizedMap;
  width?: string | number;
  height?: string | number;
  depth?: string | number;
  weight?: string | number;
  additionalShippingCost?: string | number;
}

export interface PrestaShopDuplicatesReport {
  scannedProducts: number;
  duplicateGroupsByReference: Array<{
    reference: string;
    count: number;
    isQaTestProduct: boolean;
    productIds: number[];
  }>;
  duplicateGroupsByEan13: Array<{
    ean13: string;
    count: number;
    productIds: number[];
  }>;
  productsWithoutReference: Array<{
    id: number;
    name: string;
    active: boolean;
  }>;
}
