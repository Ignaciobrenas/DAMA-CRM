export interface WooCommerceMetaDataItem {
  id?: number;
  key: string;
  value: any;
}

export interface WooCommerceAddress {
  first_name: string;
  last_name: string;
  company?: string;
  address_1: string;
  address_2?: string;
  city: string;
  state?: string;
  postcode: string;
  country: string; // ISO 3166-1 alpha-2
  email?: string;
  phone?: string;
}

export interface WooCommerceOrderLineItem {
  id?: number;
  name: string;
  product_id: number;
  variation_id?: number;
  quantity: number;
  tax_class?: string;
  subtotal: string; // Antes de descuentos (string decimal en WC)
  subtotal_tax?: string;
  total: string; // Después de descuentos (string decimal en WC)
  total_tax?: string;
  sku?: string;
  price?: number | string;
  meta_data?: WooCommerceMetaDataItem[];
}

export interface WooCommerceOrderShippingLine {
  id?: number;
  method_title: string;
  method_id: string;
  total: string;
  total_tax?: string;
  meta_data?: WooCommerceMetaDataItem[];
}

export interface WooCommerceOrder {
  id: number;
  parent_id?: number;
  number: string;
  order_key?: string;
  created_via?: string;
  version?: string;
  status: 'pending' | 'processing' | 'on-hold' | 'completed' | 'cancelled' | 'refunded' | 'failed' | 'trash' | null;
  currency: string;
  date_created: string;
  date_created_gmt?: string;
  date_modified?: string;
  date_modified_gmt?: string;
  discount_total: string;
  discount_tax?: string;
  shipping_total: string;
  shipping_tax?: string;
  cart_tax?: string;
  total: string;
  total_tax: string;
  prices_include_tax?: boolean;
  customer_id: number; // 0 para invitado
  customer_note?: string;
  billing: WooCommerceAddress;
  shipping?: WooCommerceAddress;
  payment_method?: string;
  payment_method_title?: string;
  transaction_id?: string;
  meta_data?: WooCommerceMetaDataItem[];
  line_items: WooCommerceOrderLineItem[];
  shipping_lines?: WooCommerceOrderShippingLine[];
  set_paid?: boolean;
}

export interface WooCommerceProductAttribute {
  id?: number;
  name: string;
  position?: number;
  visible?: boolean;
  variation?: boolean;
  options: string[];
}

export interface WooCommerceProduct {
  id?: number;
  name: string;
  slug?: string;
  permalink?: string;
  type: 'simple' | 'grouped' | 'external' | 'variable';
  status: 'draft' | 'pending' | 'private' | 'publish';
  featured?: boolean;
  catalog_visibility?: 'visible' | 'catalog' | 'search' | 'hidden';
  description?: string;
  short_description?: string;
  sku?: string;
  global_unique_id?: string; // GTIN/UPC/EAN/ISBN
  price?: string; // read-only
  regular_price?: string; // string decimal CON IVA incluido en España
  sale_price?: string;
  tax_status?: 'taxable' | 'shipping' | 'none';
  tax_class?: string; // Nombre libre configurado en la tienda (ej. "standard", "Estándard", "IVA alimentación")
  manage_stock?: boolean;
  stock_quantity?: number | null;
  stock_status?: 'instock' | 'outofstock' | 'onbackorder';
  backorders?: 'no' | 'notify' | 'yes';
  weight?: string;
  dimensions?: {
    length: string;
    width: string;
    height: string;
  };
  categories?: Array<{ id: number; name?: string; slug?: string }>;
  tags?: Array<{ id: number; name?: string; slug?: string }>;
  images?: Array<{ id?: number; src: string; name?: string; alt?: string }>;
  attributes?: WooCommerceProductAttribute[];
  variations?: number[];
  meta_data?: WooCommerceMetaDataItem[];
}

export interface WooCommerceProductVariation {
  id?: number;
  sku?: string;
  global_unique_id?: string;
  regular_price: string;
  sale_price?: string;
  status?: 'publish' | 'private' | 'draft';
  manage_stock?: boolean | 'parent';
  stock_quantity?: number;
  stock_status?: 'instock' | 'outofstock' | 'onbackorder';
  weight?: string;
  attributes: Array<{ id?: number; name: string; option: string }>;
  meta_data?: WooCommerceMetaDataItem[];
}

export interface WooCommerceBatchPayload<T> {
  create?: T[];
  update?: T[];
  delete?: number[];
}

export interface WooCommerceCustomerReconciliationResult {
  matchedByNif: boolean;
  nif?: string;
  status: 'approved' | 'new_customer' | 'pending_approval';
  orderHeldOnHold: boolean;
  heldBecause?: string;
  divergentFields: string[];
}
