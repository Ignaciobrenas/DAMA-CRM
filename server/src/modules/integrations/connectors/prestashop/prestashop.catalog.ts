import { PrestaShopLocalizedMap } from './prestashop.types';

/**
 * Los 69 recursos oficiales del Webservice clásico de PrestaShop (/api/<recurso>).
 */
export const PRESTASHOP_CLASSIC_WEBSERVICE_69_RESOURCES = [
  'addresses',
  'attachments',
  'carriers',
  'cart_rules',
  'carts',
  'categories',
  'combinations',
  'configurations',
  'contacts',
  'content_management_system',
  'countries',
  'currencies',
  'customer_messages',
  'customer_threads',
  'customers',
  'customizations',
  'deliveries',
  'employees',
  'groups',
  'guests',
  'image_types',
  'images',
  'languages',
  'manufacturers',
  'messages',
  'order_carriers',
  'order_cart_rules',
  'order_details',
  'order_histories',
  'order_invoices',
  'order_payments',
  'order_slip',
  'order_states',
  'orders',
  'price_ranges',
  'product_customization_fields',
  'product_feature_values',
  'product_features',
  'product_option_values',
  'product_options',
  'product_suppliers',
  'products',
  'search',
  'shop_groups',
  'shop_urls',
  'shops',
  'specific_price_rules',
  'specific_prices',
  'states',
  'stock_availables',
  'stock_movement_reasons',
  'stock_movements',
  'stocks',
  'stores',
  'suppliers',
  'supply_order_details',
  'supply_order_histories',
  'supply_order_receipt_histories',
  'supply_order_states',
  'supply_orders',
  'tags',
  'tax_rule_groups',
  'tax_rules',
  'taxes',
  'translated_configurations',
  'warehouse_product_locations',
  'warehouses',
  'weight_ranges',
  'zones',
] as const;

/**
 * Los 33 dominios oficiales de la nueva Admin API de PrestaShop 9 (/admin-api/*, módulo ps_apiresources).
 * Nota: Orders y StockAvailable NO están expuestos en la Admin API v9 y usan siempre el Webservice clásico.
 */
export const PRESTASHOP_ADMIN_API_33_DOMAINS = [
  { domain: 'Address', basePath: '/admin-api/addresses', crud: true, notes: '4 variantes: cliente, pedido, carrito, fabricante' },
  { domain: 'ApiClient', basePath: '/admin-api/api-clients', crud: true, notes: 'Clientes OAuth2 y scopes <dominio>_read / <dominio>_write' },
  { domain: 'Attachment', basePath: '/admin-api/attachments', crud: false, notes: 'Solo lectura y búsqueda' },
  { domain: 'Attribute', basePath: '/admin-api/attributes', crud: true, notes: 'Grupos (/attributes/groups) y valores (/attributes/attributes)' },
  { domain: 'Carrier', basePath: '/admin-api/carriers', crud: true, notes: 'Incluye /set-tax-rule-group y /ranges' },
  { domain: 'Cart', basePath: '/admin-api/carts', crud: false, notes: 'Solo acción /carts/{id}/emails' },
  { domain: 'CartRule', basePath: '/admin-api/cart-rules/search', crud: false, notes: 'Solo búsqueda; alta/edición en Webservice clásico' },
  { domain: 'Category', basePath: '/admin-api/categories', crud: true, notes: 'Incluye /status, /cover, /thumbnail' },
  { domain: 'Contact', basePath: '/admin-api/contacts', crud: true, notes: 'Contactos de tienda' },
  { domain: 'Country', basePath: '/admin-api/countries', crud: true, notes: 'Geografía y formato de código postal' },
  { domain: 'Customer', basePath: '/admin-api/customers', crud: true, notes: 'CRUD completo POST/GET/PATCH/DELETE' },
  { domain: 'Discount', basePath: '/admin-api/discounts', crud: true, notes: 'Promociones y cupones modernos' },
  { domain: 'Employee', basePath: '/admin-api/employees/send-password-reset-email', crud: false, notes: 'Solo reseteo de contraseña' },
  { domain: 'ExtraPropertyDefinition', basePath: '/admin-api/extra-property-definitions', crud: true, notes: 'Campos personalizados del core' },
  { domain: 'Feature', basePath: '/admin-api/features', crud: true, notes: 'Fichas técnicas y valores (/features/values)' },
  { domain: 'Hook', basePath: '/admin-api/hooks', crud: false, notes: 'Lectura y activar/desactivar' },
  { domain: 'Manufacturer', basePath: '/admin-api/manufacturers', crud: true, notes: 'Marcas y fabricantes' },
  { domain: 'Module', basePath: '/admin-api/modules', crud: false, notes: 'Instalar/desinstalar/actualizar/subir multipart' },
  { domain: 'OrderMessage', basePath: '/admin-api/order-messages', crud: true, notes: 'Mensajes predefinidos de pedido' },
  { domain: 'OrderReturn', basePath: '/admin-api/order-returns', crud: false, notes: 'Solo lectura/edición de devolución' },
  { domain: 'OrderReturnState', basePath: '/admin-api/order-return-states', crud: true, notes: 'Estados de devolución' },
  { domain: 'Product', basePath: '/admin-api/products', crud: true, notes: '35 campos + 13 sub-recursos (POST solo toma type+names; PATCH actualiza el resto)' },
  { domain: 'Profile', basePath: '/admin-api/profiles', crud: false, notes: 'Alta/lectura/baja de roles sin edición' },
  { domain: 'SearchAlias', basePath: '/admin-api/search-aliases', crud: true, notes: 'Alias de búsqueda' },
  { domain: 'SearchEngine', basePath: '/admin-api/search-engines', crud: true, notes: 'Motores de búsqueda' },
  { domain: 'ShowcaseCard', basePath: '/admin-api/showcase-cards', crud: false, notes: 'Tarjetas de onboarding back-office' },
  { domain: 'Store', basePath: '/admin-api/stores', crud: false, notes: 'Tiendas físicas (alta/baja/toggle enabled)' },
  { domain: 'Supplier', basePath: '/admin-api/suppliers', crud: true, notes: 'Proveedores + /logo + /toggle-status' },
  { domain: 'Tab', basePath: '/admin-api/tabs', crud: false, notes: 'Activar/desactivar menús back-office' },
  { domain: 'Tax', basePath: '/admin-api/taxes', crud: true, notes: 'Impuestos' },
  { domain: 'TaxRule', basePath: '/admin-api/tax-rules', crud: false, notes: 'Alta/baja de regla de impuesto' },
  { domain: 'TaxRulesGroup', basePath: '/admin-api/tax-rules-groups', crud: true, notes: 'Grupos de reglas de impuestos (usado en Price_Update_v11)' },
  { domain: 'Title', basePath: '/admin-api/titles', crud: true, notes: 'Tratamientos Sr./Sra. (multipart)' },
  { domain: 'WebserviceKey', basePath: '/admin-api/webservice-keys', crud: false, notes: 'Alta/lectura/edición sin borrado' },
  { domain: 'Zone', basePath: '/admin-api/zones', crud: true, notes: 'Zonas geográficas' },
] as const;

export const DEFAULT_PRESTASHOP_ORDER_STATES = [
  { id: 1, name: 'Esperando pago', readyForImport: false, excluded: false },
  { id: 2, name: 'Pago aceptado', readyForImport: true, excluded: false },
  { id: 3, name: 'Preparación en curso', readyForImport: true, excluded: false },
  { id: 4, name: 'Enviado', readyForImport: false, excluded: false },
  { id: 5, name: 'Entregado', readyForImport: false, excluded: false },
  { id: 6, name: 'Cancelado', readyForImport: false, excluded: true },
  { id: 7, name: 'Reembolsado', readyForImport: false, excluded: true },
  { id: 8, name: 'Error de pago', readyForImport: false, excluded: true },
];

export class PrestaShopCatalogHelper {
  /**
   * Normaliza un texto o mapa multiidioma al formato de `#[LocalizedValue]` de la Admin API v9:
   * indexado por clave de locale string (ej. `{"es-ES": "Valor"}`).
   */
  public static toLocalizedValue(
    input: string | PrestaShopLocalizedMap | undefined,
    defaultLocale: string = 'es-ES',
    maxLength?: number
  ): PrestaShopLocalizedMap {
    if (!input) return { [defaultLocale]: '' };
    if (typeof input === 'string') {
      const val = maxLength ? input.slice(0, maxLength) : input;
      return { [defaultLocale]: val };
    }
    const result: PrestaShopLocalizedMap = {};
    for (const [locale, text] of Object.entries(input)) {
      const str = String(text || '');
      result[locale] = maxLength ? str.slice(0, maxLength) : str;
    }
    return Object.keys(result).length > 0 ? result : { [defaultLocale]: '' };
  }

  /**
   * Genera un `link_rewrite` válido en PrestaShop (máx 128 caracteres, solo [a-z0-9-]).
   */
  public static slugifyLinkRewrite(name: string): string {
    return (
      String(name || 'producto')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 128) || 'producto'
    );
  }

  /**
   * Resuelve el `taxRulesGroupId` de PrestaShop para los 3 tipos de IVA españoles
   * (`standard`=21%, `reduced`=10%, `super_reduced`=4% / "foodstuff") tal como hace `Price_Update_v11`.
   */
  public static resolveSpanishTaxRulesGroupId(
    taxClassOrRate: 'standard' | 'reduced' | 'super_reduced' | number,
    groups: Array<{ taxRulesGroupId?: number; id?: number; name: string }> = []
  ): number {
    const targetType =
      typeof taxClassOrRate === 'number'
        ? taxClassOrRate <= 4
          ? 'super_reduced'
          : taxClassOrRate <= 10
          ? 'reduced'
          : 'standard'
        : taxClassOrRate;

    for (const g of groups) {
      const lower = (g.name || '').toLowerCase();
      const id = Number(g.taxRulesGroupId ?? g.id ?? 1);
      if (targetType === 'standard' && (lower.includes('21') || lower.includes('standard'))) {
        return id;
      }
      if (targetType === 'reduced' && (lower.includes('10') || (lower.includes('reduced') && !lower.includes('super')))) {
        return id;
      }
      if (
        targetType === 'super_reduced' &&
        (lower.includes('4%') || lower.includes(' 4 ') || lower.includes('super') || lower.includes('foodstuff'))
      ) {
        return id;
      }
    }

    return targetType === 'standard' ? 1 : targetType === 'reduced' ? 2 : 3;
  }
}
