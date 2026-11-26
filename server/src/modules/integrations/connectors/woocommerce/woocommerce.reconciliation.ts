import { CanonicalAddress, CanonicalOrder } from '../../core/connector.interface';
import { MappingEngine, MappingFieldRule } from '../../core/mapping-engine';
import {
  WooCommerceCustomerReconciliationResult,
  WooCommerceMetaDataItem,
  WooCommerceOrder,
} from './woocommerce.types';

export const WOOCOMMERCE_REST_V3_16_ENTITIES = [
  { resource: 'coupons', endpoint: '/wp-json/wc/v3/coupons', batchSupported: true, description: 'Cupones de descuento (percent, fixed_cart, fixed_product)' },
  { resource: 'customers', endpoint: '/wp-json/wc/v3/customers', batchSupported: true, description: 'Clientes registrados, direcciones billing/shipping y descargas' },
  { resource: 'orders', endpoint: '/wp-json/wc/v3/orders', batchSupported: true, description: 'Pedidos, line_items, tax_lines, shipping_lines, fee_lines, coupon_lines y meta_data (_billing_nif)' },
  { resource: 'order_notes', endpoint: '/wp-json/wc/v3/orders/{id}/notes', batchSupported: false, description: 'Notas internas o notificadas al cliente' },
  { resource: 'order_refunds', endpoint: '/wp-json/wc/v3/orders/{id}/refunds', batchSupported: false, description: 'Reembolsos con api_refund, api_restock y compute_totals (WC 11.1+)' },
  { resource: 'products', endpoint: '/wp-json/wc/v3/products', batchSupported: true, description: 'Productos simple, grouped, external y variable' },
  { resource: 'product_variations', endpoint: '/wp-json/wc/v3/products/{id}/variations', batchSupported: true, description: 'Variaciones de producto variable (stock y precio propio)' },
  { resource: 'product_attributes', endpoint: '/wp-json/wc/v3/products/attributes', batchSupported: true, description: 'Atributos globales de catálogo (Talla, Color)' },
  { resource: 'product_attribute_terms', endpoint: '/wp-json/wc/v3/products/attributes/{id}/terms', batchSupported: true, description: 'Términos de cada atributo' },
  { resource: 'product_categories', endpoint: '/wp-json/wc/v3/products/categories', batchSupported: true, description: 'Árbol jerárquico de categorías' },
  { resource: 'product_shipping_classes', endpoint: '/wp-json/wc/v3/products/shipping_classes', batchSupported: true, description: 'Clases logísticas de envío' },
  { resource: 'product_tags', endpoint: '/wp-json/wc/v3/products/tags', batchSupported: true, description: 'Etiquetas de producto' },
  { resource: 'product_reviews', endpoint: '/wp-json/wc/v3/products/reviews', batchSupported: true, description: 'Valoraciones verificadas de compradores' },
  { resource: 'taxes', endpoint: '/wp-json/wc/v3/taxes', batchSupported: true, description: 'Tasas de impuestos (postcodes[] y cities[] desde WC 5.3) y /taxes/classes' },
  { resource: 'webhooks', endpoint: '/wp-json/wc/v3/webhooks', batchSupported: true, description: 'Webhooks firmados por evento' },
  { resource: 'system_status', endpoint: '/wp-json/wc/v3/system_status', batchSupported: false, description: 'Estado de entorno WordPress/WooCommerce, BD, plugins y /wc/v3/data' },
] as const;

/**
 * Plantilla declarativa DSL para `orders.headers.fields` en WooCommerce (compartiendo el motor `_Mapping_Engine` con Shopify B2B).
 */
export const DEFAULT_WOOCOMMERCE_ORDER_HEADER_RULES: MappingFieldRule[] = [
  { to: 'channelOrderId', from: 'id', settings: { type: 'string' } },
  { to: 'orderNumber', from: [['number'], ['id']], operations: [{ type: 'toString' }, { type: 'trim' }], settings: { maxLength: 64, type: 'string' } },
  { to: 'sourceCreatedAt', from: [['date_created_gmt'], ['date_created']], settings: { type: 'string' } },
  { to: 'currency', from: 'currency', operations: [{ type: 'uppercase' }], settings: { maxLength: 3, type: 'string' } },
  { to: 'taxesIncluded', from: 'prices_include_tax', settings: { type: 'boolean' } },
  { to: 'customer.firstName', from: 'billing.first_name', operations: [{ type: 'trim' }], settings: { maxLength: 255, type: 'string' } },
  { to: 'customer.lastName', from: 'billing.last_name', operations: [{ type: 'trim' }], settings: { maxLength: 255, type: 'string' } },
  { to: 'customer.email', from: 'billing.email', operations: [{ type: 'trim' }, { type: 'lowercase' }], settings: { maxLength: 255, type: 'string' } },
  { to: 'customer.phone', from: 'billing.phone', operations: [{ type: 'trim' }], settings: { maxLength: 32, type: 'string' } },
  { to: 'customer.nifCif', from: [['meta._billing_nif'], ['meta._billing_cif'], ['meta.billing_nif'], ['meta.nif']], operations: [{ type: 'normalizeNif' }], settings: { maxLength: 20, type: 'string' } },
  { to: 'billingAddress.firstName', from: 'billing.first_name', settings: { maxLength: 255, type: 'string' } },
  { to: 'billingAddress.lastName', from: 'billing.last_name', settings: { maxLength: 255, type: 'string' } },
  { to: 'billingAddress.company', from: 'billing.company', settings: { maxLength: 255, type: 'string' } },
  { to: 'billingAddress.street1', from: 'billing.address_1', settings: { maxLength: 255, type: 'string' } },
  { to: 'billingAddress.street2', from: 'billing.address_2', settings: { maxLength: 255, type: 'string' } },
  { to: 'billingAddress.city', from: 'billing.city', settings: { maxLength: 128, type: 'string' } },
  { to: 'billingAddress.postalCode', from: 'billing.postcode', settings: { maxLength: 20, type: 'string' } },
  { to: 'billingAddress.province', from: 'billing.state', settings: { maxLength: 128, type: 'string' } },
  { to: 'billingAddress.country', from: 'billing.country', operations: [{ type: 'uppercase' }], settings: { maxLength: 2, type: 'string' } },
  { to: 'billingAddress.phone', from: 'billing.phone', settings: { maxLength: 32, type: 'string' } },
  { to: 'shippingAddress.firstName', from: 'shipping.first_name', settings: { maxLength: 255, type: 'string' } },
  { to: 'shippingAddress.lastName', from: 'shipping.last_name', settings: { maxLength: 255, type: 'string' } },
  { to: 'shippingAddress.company', from: 'shipping.company', settings: { maxLength: 255, type: 'string' } },
  { to: 'shippingAddress.street1', from: 'shipping.address_1', settings: { maxLength: 255, type: 'string' } },
  { to: 'shippingAddress.street2', from: 'shipping.address_2', settings: { maxLength: 255, type: 'string' } },
  { to: 'shippingAddress.city', from: 'shipping.city', settings: { maxLength: 128, type: 'string' } },
  { to: 'shippingAddress.postalCode', from: 'shipping.postcode', settings: { maxLength: 20, type: 'string' } },
  { to: 'shippingAddress.province', from: 'shipping.state', settings: { maxLength: 128, type: 'string' } },
  { to: 'shippingAddress.country', from: 'shipping.country', operations: [{ type: 'uppercase' }], settings: { maxLength: 2, type: 'string' } },
];

export class WooCommerceReconciliationEngine {
  /**
   * Aplana `meta_data[]` de WooCommerce a un objeto `{ [key]: value }` para extraer campos custom
   * de plugins españoles de facturación como `_billing_nif`.
   */
  public static flattenMetaData(metaData?: WooCommerceMetaDataItem[]): Record<string, any> {
    const map: Record<string, any> = {};
    for (const item of metaData || []) {
      if (item && item.key) {
        map[item.key] = item.value;
      }
    }
    return map;
  }

  /**
   * Convierte todos los importes string de WooCommerce a `number` ANTES de pasar por el motor de mapeo
   * y calcula `totalsSubtotal` sumando `line_items[].subtotal`.
   */
  public static normalizeOrderNumbers(rawOrder: WooCommerceOrder): Record<string, any> {
    const meta = this.flattenMetaData(rawOrder.meta_data);
    const linesSubtotal = (rawOrder.line_items || []).reduce(
      (sum, item) => sum + (parseFloat(String(item.subtotal || '0')) || 0),
      0
    );

    return {
      ...rawOrder,
      meta,
      totalsSubtotal: Number(linesSubtotal.toFixed(2)),
      shipping_total_num: parseFloat(String(rawOrder.shipping_total || '0')) || 0,
      discount_total_num: parseFloat(String(rawOrder.discount_total || '0')) || 0,
      total_tax_num: parseFloat(String(rawOrder.total_tax || '0')) || 0,
      total_num: parseFloat(String(rawOrder.total || '0')) || 0,
    };
  }

  /**
   * Poda de seguridad de un pedido de WooCommerce antes de persistirlo / enviarlo a ERP (`Order_Process_v10`):
   * - `payments[]` requiere `method + provider + amount + currency` no vacíos o se elimina el array entero.
   * - `shippings[]` requiere `method + provider + cost` definidos o se elimina el array entero.
   * - `notes[]` requiere `content + author + authorName + type + createdAt` no vacíos o se elimina.
   * - Direcciones (`billingAddress` / `shippingAddress`) sin `street1`, `city` o `postalCode` se eliminan.
   * - Si no hay `shippingAddress` válida, se elimina también `shippings` (evita error HTTP 400).
   */
  public static pruneOrderBlocks(order: CanonicalOrder): CanonicalOrder {
    const pruned: CanonicalOrder = { ...order };

    const isAddressComplete = (addr?: CanonicalAddress): boolean => {
      if (!addr) return false;
      return Boolean(
        addr.street1 &&
          addr.street1.trim() !== '' &&
          addr.city &&
          addr.city.trim() !== '' &&
          addr.postalCode &&
          addr.postalCode.trim() !== ''
      );
    };

    if (!isAddressComplete(pruned.billingAddress)) {
      delete pruned.billingAddress;
    }

    if (!isAddressComplete(pruned.shippingAddress)) {
      delete pruned.shippingAddress;
      // Regla estricta: sin shippingAddress no puede haber shippings
      delete pruned.shippings;
    }

    if (Array.isArray(pruned.payments)) {
      const validPayments = pruned.payments.filter(
        (p) =>
          p &&
          Boolean(p.method && String(p.method).trim()) &&
          Boolean(p.provider && String(p.provider).trim()) &&
          typeof p.amount === 'number' &&
          p.amount > 0 &&
          Boolean(p.currency && String(p.currency).trim())
      );
      if (validPayments.length === 0) {
        delete pruned.payments;
      } else {
        pruned.payments = validPayments;
      }
    }

    if (Array.isArray(pruned.shippings)) {
      const validShippings = pruned.shippings.filter(
        (s) =>
          s &&
          Boolean(s.method && String(s.method).trim()) &&
          Boolean(s.provider && String(s.provider).trim()) &&
          typeof s.cost === 'number' &&
          !isNaN(s.cost)
      );
      if (validShippings.length === 0) {
        delete pruned.shippings;
      } else {
        pruned.shippings = validShippings;
      }
    }

    if (Array.isArray(pruned.notes)) {
      const validNotes = pruned.notes.filter(
        (n) =>
          n &&
          Boolean(n.content && String(n.content).trim()) &&
          Boolean(n.author && String(n.author).trim()) &&
          Boolean(n.authorName && String(n.authorName).trim()) &&
          Boolean(n.type && String(n.type).trim()) &&
          Boolean(n.createdAt && String(n.createdAt).trim())
      );
      if (validNotes.length === 0) {
        delete pruned.notes;
      } else {
        pruned.notes = validNotes;
      }
    }

    return pruned;
  }

  /**
   * Reconciliación avanzada de cliente por NIF (`meta._billing_nif` en `Order_Process_v10`):
   * Compara campo a campo (nombre, email, dirección) con el cliente existente y si detecta
   * cambios pendientes de validar, retiene el pedido (`status: "on_hold"`, `customerReconciliation: "pending_approval"`,
   * `metadata.heldBecause`).
   */
  public static reconcileCustomerByNif(
    order: CanonicalOrder,
    existingKnownCustomer?: {
      nifCif: string;
      firstName: string;
      lastName: string;
      email: string;
      street1?: string;
      city?: string;
      postalCode?: string;
    } | null,
    holdOrderOnMismatch: boolean = true
  ): { order: CanonicalOrder; reconciliation: WooCommerceCustomerReconciliationResult } {
    const nif = MappingEngine.normalizeNif(order.customer?.nifCif);

    if (!existingKnownCustomer || !nif) {
      return {
        order,
        reconciliation: {
          matchedByNif: false,
          nif: nif || undefined,
          status: 'new_customer',
          orderHeldOnHold: false,
          divergentFields: [],
        },
      };
    }

    const divergentFields: string[] = [];
    const incomingFullName = `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim().toLowerCase();
    const existingFullName = `${existingKnownCustomer.firstName || ''} ${existingKnownCustomer.lastName || ''}`
      .trim()
      .toLowerCase();

    if (incomingFullName && existingFullName && incomingFullName !== existingFullName) {
      divergentFields.push('name');
    }

    if (
      order.customer.email &&
      existingKnownCustomer.email &&
      order.customer.email.trim().toLowerCase() !== existingKnownCustomer.email.trim().toLowerCase()
    ) {
      divergentFields.push('email');
    }

    const incomingStreet = (order.billingAddress?.street1 || '').trim().toLowerCase();
    const existingStreet = (existingKnownCustomer.street1 || '').trim().toLowerCase();
    if (incomingStreet && existingStreet && incomingStreet !== existingStreet) {
      divergentFields.push('address.street1');
    }

    const incomingZip = (order.billingAddress?.postalCode || '').trim();
    const existingZip = (existingKnownCustomer.postalCode || '').trim();
    if (incomingZip && existingZip && incomingZip !== existingZip) {
      divergentFields.push('address.postalCode');
    }

    if (divergentFields.length > 0 && holdOrderOnMismatch) {
      const heldBecause = `Pedido retenido (pending_approval): el cliente con NIF ${nif} presenta cambios pendientes de validar en [${divergentFields.join(', ')}].`;
      const updatedOrder: CanonicalOrder = {
        ...order,
        status: 'on_hold',
        metadata: {
          ...(order.metadata || {}),
          customerApprovalStatus: 'pending_approval',
          heldBecause,
          divergentFields,
        },
      };
      return {
        order: updatedOrder,
        reconciliation: {
          matchedByNif: true,
          nif,
          status: 'pending_approval',
          orderHeldOnHold: true,
          heldBecause,
          divergentFields,
        },
      };
    }

    return {
      order,
      reconciliation: {
        matchedByNif: true,
        nif,
        status: 'approved',
        orderHeldOnHold: false,
        divergentFields: [],
      },
    };
  }

  /**
   * Calcula el `regular_price` de WooCommerce (`Price_Update_v4`):
   * A diferencia de PrestaShop (que envía precio base sin IVA), WooCommerce almacena `regular_price`
   * CON IVA incluido (`basePrice * 1.21` para standard, `* 1.10` para reduced, `* 1.04` para super_reduced).
   */
  public static calculateVatIncludedPrice(
    basePriceWithoutTax: number,
    taxType: 'standard' | 'reduced' | 'super_reduced' | number = 'standard',
    customStoreTaxClassNames?: { standard?: string; reduced?: string; superReduced?: string }
  ): { regularPrice: string; taxRateMultiplier: number; taxClass: string } {
    let multiplier = 1.21;
    let taxClass = customStoreTaxClassNames?.standard || 'Estándard';

    if (taxType === 'reduced' || taxType === 10) {
      multiplier = 1.1;
      taxClass = customStoreTaxClassNames?.reduced || 'IVA alimentación';
    } else if (taxType === 'super_reduced' || taxType === 4) {
      multiplier = 1.04;
      taxClass = customStoreTaxClassNames?.superReduced || 'Superreducido';
    }

    const finalPrice = Number((Number(basePriceWithoutTax || 0) * multiplier).toFixed(2));
    return {
      regularPrice: finalPrice.toFixed(2),
      taxRateMultiplier: multiplier,
      taxClass,
    };
  }
}
