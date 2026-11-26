import { MappingFieldRule } from '../../core/mapping-engine';

/**
 * Plantilla declarativa B2B de Shopify (`channel-configs/shopify-b2b.json`):
 * - Reglas declarativas para `orders.headers.fields` y `lineItems.fields`
 * - Catálogo de metafields `sage.*` y `b2b.*`
 * - Mapeo de términos de pago hacia `PaymentTermsType` (`FIXED`, `NET_30`, `NET_60`, `NET_90`)
 */
export const SHOPIFY_B2B_ORDER_HEADER_RULES: MappingFieldRule[] = [
  { to: 'channelOrderId', from: 'id', settings: { type: 'string' } },
  { to: 'orderNumber', from: 'name', operations: [{ type: 'trim' }], settings: { maxLength: 64, type: 'string' } },
  { to: 'sourceCreatedAt', from: 'processedAt', settings: { type: 'string' } },
  { to: 'currency', from: 'currencyCode', operations: [{ type: 'uppercase' }], settings: { maxLength: 3, type: 'string' } },
  { to: 'taxesIncluded', from: 'taxesIncluded', settings: { type: 'boolean' } },
  { to: 'poNumber', from: 'poNumber', operations: [{ type: 'trim' }], settings: { maxLength: 100, type: 'string' } },
  { to: 'customer.firstName', from: 'customer.firstName', operations: [{ type: 'trim' }], settings: { maxLength: 255, type: 'string' } },
  { to: 'customer.lastName', from: 'customer.lastName', operations: [{ type: 'trim' }], settings: { maxLength: 255, type: 'string' } },
  { to: 'customer.email', from: [['customer.email'], ['email']], operations: [{ type: 'trim' }, { type: 'lowercase' }], settings: { maxLength: 255, type: 'string' } },
  { to: 'customer.phone', from: [['customer.phone'], ['phone'], ['billingAddress.phone']], operations: [{ type: 'trim' }], settings: { maxLength: 32, type: 'string' } },
  { to: 'billingAddress.firstName', from: 'billingAddress.firstName', settings: { maxLength: 255, type: 'string' } },
  { to: 'billingAddress.lastName', from: 'billingAddress.lastName', settings: { maxLength: 255, type: 'string' } },
  { to: 'billingAddress.company', from: 'billingAddress.company', settings: { maxLength: 255, type: 'string' } },
  { to: 'billingAddress.street1', from: 'billingAddress.address1', settings: { maxLength: 255, type: 'string' } },
  { to: 'billingAddress.street2', from: 'billingAddress.address2', settings: { maxLength: 255, type: 'string' } },
  { to: 'billingAddress.city', from: 'billingAddress.city', settings: { maxLength: 128, type: 'string' } },
  { to: 'billingAddress.postalCode', from: 'billingAddress.zip', settings: { maxLength: 20, type: 'string' } },
  { to: 'billingAddress.province', from: 'billingAddress.province', settings: { maxLength: 128, type: 'string' } },
  { to: 'billingAddress.country', from: 'billingAddress.countryCodeV2', operations: [{ type: 'uppercase' }], settings: { maxLength: 2, type: 'string' } },
  { to: 'shippingAddress.firstName', from: 'shippingAddress.firstName', settings: { maxLength: 255, type: 'string' } },
  { to: 'shippingAddress.lastName', from: 'shippingAddress.lastName', settings: { maxLength: 255, type: 'string' } },
  { to: 'shippingAddress.company', from: 'shippingAddress.company', settings: { maxLength: 255, type: 'string' } },
  { to: 'shippingAddress.street1', from: 'shippingAddress.address1', settings: { maxLength: 255, type: 'string' } },
  { to: 'shippingAddress.street2', from: 'shippingAddress.address2', settings: { maxLength: 255, type: 'string' } },
  { to: 'shippingAddress.city', from: 'shippingAddress.city', settings: { maxLength: 128, type: 'string' } },
  { to: 'shippingAddress.postalCode', from: 'shippingAddress.zip', settings: { maxLength: 20, type: 'string' } },
  { to: 'shippingAddress.province', from: 'shippingAddress.province', settings: { maxLength: 128, type: 'string' } },
  { to: 'shippingAddress.country', from: 'shippingAddress.countryCodeV2', operations: [{ type: 'uppercase' }], settings: { maxLength: 2, type: 'string' } },
  { to: 'totals.subtotal', from: 'subtotalPriceSet.shopMoney.amount', operations: [{ type: 'toNumber' }], settings: { type: 'number' } },
  { to: 'totals.shippingAmount', from: 'totalShippingPriceSet.shopMoney.amount', operations: [{ type: 'toNumber' }], settings: { type: 'number' } },
  { to: 'totals.discountAmount', from: 'totalDiscountsSet.shopMoney.amount', operations: [{ type: 'toNumber' }], settings: { type: 'number' } },
  { to: 'totals.taxAmount', from: 'totalTaxSet.shopMoney.amount', operations: [{ type: 'toNumber' }], settings: { type: 'number' } },
  { to: 'totals.total', from: 'totalPriceSet.shopMoney.amount', operations: [{ type: 'toNumber' }], settings: { type: 'number' } },
];

export const SHOPIFY_B2B_LINE_ITEM_RULES: MappingFieldRule[] = [
  { to: 'externalId', from: 'id', settings: { type: 'string' } },
  { to: 'productSku', from: [['sku'], ['variant.sku']], operations: [{ type: 'trim' }], settings: { maxLength: 64, type: 'string' } },
  { to: 'name', from: 'name', operations: [{ type: 'trim' }], settings: { maxLength: 255, type: 'string' } },
  { to: 'quantity', from: 'currentQuantity', operations: [{ type: 'toNumber' }], settings: { type: 'integer' } },
  { to: 'unitPrice', from: 'originalUnitPriceSet.shopMoney.amount', operations: [{ type: 'toNumber' }], settings: { type: 'number' } },
  { to: 'totalPrice', from: 'discountedTotalSet.shopMoney.amount', operations: [{ type: 'toNumber' }], settings: { type: 'number' } },
];

export const SHOPIFY_B2B_METAFIELDS_CATALOG = [
  { namespace: 'sage', key: 'cod_cliente_sage', type: 'single_line_text_field', description: 'Código de cliente en Sage 200' },
  { namespace: 'sage', key: 'nombre_cli_sage', type: 'single_line_text_field', description: 'Nombre comercial en Sage' },
  { namespace: 'sage', key: 'razon_social_2', type: 'single_line_text_field', description: 'Segunda línea de razón social' },
  { namespace: 'sage', key: 'cod_cadena', type: 'single_line_text_field', description: 'Código de cadena comercial' },
  { namespace: 'sage', key: 'fecha_alta_sage', type: 'date', description: 'Fecha de alta original en Sage' },
  { namespace: 'sage', key: 'tarifa_precio', type: 'number_integer', description: 'Tarifa de precio asignada' },
  { namespace: 'sage', key: 'tarifa_dto', type: 'number_integer', description: 'Tarifa de descuento asignada' },
  { namespace: 'sage', key: 'comercial_asig', type: 'single_line_text_field', description: 'Representante / Comercial asignado' },
  { namespace: 'sage', key: 'cod_contable', type: 'single_line_text_field', description: 'Subcuenta contable 430' },
  { namespace: 'sage', key: 'categoria_sage', type: 'single_line_text_field', description: 'Categoría de cliente en Sage' },
  { namespace: 'sage', key: 'delegacion', type: 'single_line_text_field', description: 'Delegación comercial' },
  { namespace: 'sage', key: 'forma_pago', type: 'single_line_text_field', description: 'Forma de pago en Sage' },
  { namespace: 'b2b', key: 'tipo_cliente', type: 'single_line_text_field', description: 'Tipología de cliente B2B' },
  { namespace: 'b2b', key: 'cod_comisionista', type: 'number_integer', description: 'Código de comisionista' },
  { namespace: 'b2b', key: 'distribuidor_real', type: 'boolean', description: 'Flag booleano de distribuidor oficial' },
] as const;

export type ShopifyPaymentTermsType = 'FIXED' | 'NET_30' | 'NET_60' | 'NET_90';

export const SHOPIFY_PAYMENT_TERMS_MAP: Record<string, ShopifyPaymentTermsType> = {
  CONTADO: 'FIXED',
  TRANSFERENCIA: 'FIXED',
  '30 DIAS': 'NET_30',
  '30 DÍAS': 'NET_30',
  'GIRO 30': 'NET_30',
  '60 DIAS': 'NET_60',
  '60 DÍAS': 'NET_60',
  'GIRO 60': 'NET_60',
  '90 DIAS': 'NET_90',
  '90 DÍAS': 'NET_90',
  'GIRO 90': 'NET_90',
};
