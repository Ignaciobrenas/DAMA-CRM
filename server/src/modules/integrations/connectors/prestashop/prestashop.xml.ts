/**
 * Utilidades de protocolo del Webservice clásico de PrestaShop (/api/<recurso>).
 */
export class PrestaShopWebserviceProtocol {
  /**
   * Construye una URL de consulta al Webservice clásico de PrestaShop:
   * - Añade siempre `display=full` o `display=[campo1,campo2]` (sin `display`, PrestaShop solo devuelve `id` y `link`).
   * - Formatea filtros OR como `filter[campo]=[a|b|c]` y rangos como `filter[campo]=[inicio,fin]`.
   * - Si hay filtro de fecha, añade `date=1` obligatorio con formato `YYYY-MM-DD HH:MM:SS`.
   * - Añade `output_format=JSON` para lecturas fiables.
   */
  public static buildWebserviceUrl(
    storeUrl: string,
    resource: string,
    options: {
      wsKey?: string;
      display?: 'full' | string[];
      filters?: Record<string, string | number | Array<string | number> | { from: string; to: string }>;
      dateFilter?: boolean;
      sort?: string; // ej. 'id_ASC' o 'date_upd_DESC'
      limit?: { offset: number; count: number };
      outputFormat?: 'JSON' | 'XML';
      schema?: 'synopsis' | 'blank';
    } = {}
  ): string {
    const cleanBase = (storeUrl || 'https://tienda-prestashop.example.com').replace(/\/$/, '');
    const cleanRes = resource.replace(/^\/?(api\/)?/, '');
    const params: string[] = [];

    if (options.wsKey) {
      params.push(`ws_key=${encodeURIComponent(options.wsKey)}`);
    }

    if (options.schema) {
      params.push(`schema=${options.schema}`);
    } else {
      const displayVal =
        options.display === undefined || options.display === 'full'
          ? 'full'
          : `[${options.display.join(',')}]`;
      params.push(`display=${displayVal}`);
    }

    if (options.filters) {
      for (const [field, val] of Object.entries(options.filters)) {
        if (val === undefined || val === null || val === '') continue;
        if (Array.isArray(val)) {
          params.push(`filter[${field}]=[${val.join('|')}]`);
        } else if (typeof val === 'object' && 'from' in val && 'to' in val) {
          params.push(`filter[${field}]=[${val.from},${val.to}]`);
        } else {
          params.push(`filter[${field}]=[${val}]`);
        }
      }
    }

    if (options.dateFilter) {
      params.push('date=1');
    }

    if (options.sort) {
      const cleanSort = options.sort.startsWith('[') ? options.sort : `[${options.sort}]`;
      params.push(`sort=${cleanSort}`);
    }

    if (options.limit) {
      params.push(`limit=${options.limit.offset},${options.limit.count}`);
    }

    if ((options.outputFormat || 'JSON') === 'JSON' && !options.schema) {
      params.push('output_format=JSON');
    }

    return `${cleanBase}/api/${cleanRes}?${params.join('&')}`;
  }

  /**
   * Genera el XML parcial para actualizar `stock_availables` (Stock_Update_v11):
   * Incluye ESTRICTAMENTE `<id>` y `<quantity>` para que `ObjectModel::update()` realice un update
   * parcial absoluto sin poner `out_of_stock`, `depends_on_stock` o `location` a NULL.
   */
  public static buildStockAvailablePartialXml(
    stockAvailableId: number | string,
    quantity: number
  ): string {
    const intQty = Math.trunc(Number(quantity) || 0);
    return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <stock_available>
    <id><![CDATA[${stockAvailableId}]]></id>
    <quantity><![CDATA[${intQty}]]></quantity>
  </stock_available>
</prestashop>`;
  }

  /**
   * Genera el XML para crear un nuevo valor de atributo (`POST /api/product_option_values`),
   * único mecanismo disponible ya que la Admin API de PrestaShop 9 no expone creación de valores.
   */
  public static buildProductOptionValueXml(params: {
    attributeGroupId: number | string;
    namesByLangId: Record<string | number, string>;
    color?: string;
    position?: number;
  }): string {
    const langNodes = Object.entries(params.namesByLangId)
      .map(([langId, val]) => `      <language id="${langId}"><![CDATA[${this.escapeCdata(val).slice(0, 128)}]]></language>`)
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <product_option_value>
    <id_attribute_group><![CDATA[${params.attributeGroupId}]]></id_attribute_group>
    ${params.color ? `<color><![CDATA[${params.color}]]></color>` : ''}
    ${params.position !== undefined ? `<position><![CDATA[${params.position}]]></position>` : ''}
    <name>
${langNodes}
    </name>
  </product_option_value>
</prestashop>`;
  }

  /**
   * Genera el XML para actualizar la `reference` (SKU) de una combinación (`PUT /api/combinations/{id}`),
   * necesario porque la Admin API de PrestaShop 9 no tiene operación PATCH sobre `Combination`.
   */
  public static buildCombinationReferenceXml(params: {
    combinationId: number | string;
    productId: number | string;
    reference: string;
    minimalQuantity?: number;
    priceImpact?: number;
    ean13?: string;
    optionValueIds?: Array<number | string>;
  }): string {
    const optionValuesXml =
      params.optionValueIds && params.optionValueIds.length > 0
        ? `    <associations>
      <product_option_values>
${params.optionValueIds.map((id) => `        <product_option_value><id><![CDATA[${id}]]></id></product_option_value>`).join('\n')}
      </product_option_values>
    </associations>`
        : '';

    return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <combination>
    <id><![CDATA[${params.combinationId}]]></id>
    <id_product><![CDATA[${params.productId}]]></id_product>
    <minimal_quantity><![CDATA[${params.minimalQuantity || 1}]]></minimal_quantity>
    <reference><![CDATA[${this.escapeCdata(params.reference).slice(0, 64)}]]></reference>
    ${params.ean13 ? `<ean13><![CDATA[${params.ean13.slice(0, 13)}]]></ean13>` : ''}
    ${params.priceImpact !== undefined ? `<price><![CDATA[${params.priceImpact}]]></price>` : ''}
${optionValuesXml}
  </combination>
</prestashop>`;
  }

  /**
   * Genera el XML para `POST /api/order_histories`, mecanismo oficial para cambiar el estado
   * de un pedido en el Webservice clásico de PrestaShop.
   */
  public static buildOrderHistoryXml(
    orderId: number | string,
    orderStateId: number | string,
    employeeId: number | string = 1
  ): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <order_history>
    <id_employee><![CDATA[${employeeId}]]></id_employee>
    <id_order><![CDATA[${orderId}]]></id_order>
    <id_order_state><![CDATA[${orderStateId}]]></id_order_state>
  </order_history>
</prestashop>`;
  }

  /**
   * Aplica exclusión de estados de pedido en memoria (`excludeStates`), ya que el Webservice
   * clásico de PrestaShop no tiene operador NOT.
   */
  public static filterExcludedStates<T extends { current_state?: number | string }>(
    orders: T[],
    excludeStates: Array<number | string> = []
  ): T[] {
    if (!excludeStates || excludeStates.length === 0) return orders;
    const excludedSet = new Set(excludeStates.map((s) => String(s)));
    return (orders || []).filter((o) => !excludedSet.has(String(o.current_state)));
  }

  private static escapeCdata(str: string): string {
    return String(str || '').replace(/]]>/g, ']]]]><![CDATA[>');
  }
}
