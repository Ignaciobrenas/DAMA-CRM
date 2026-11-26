import { ProductAttributeMapping } from '../integrations.types';

export interface MappingOperation {
  type:
    | 'uppercase'
    | 'lowercase'
    | 'trim'
    | 'toNumber'
    | 'toString'
    | 'formatDate'
    | 'padLeft'
    | 'booleanTF'
    | 'normalizeNif';
  format?: 'ISO_LOCAL' | 'DATE_ONLY' | 'DATETIME_SPACE' | string;
  timezone?: string;
  length?: number;
  padChar?: string;
}

export interface MappingRuleSettings {
  maxLength?: number;
  min?: number;
  max?: number;
  type?: 'string' | 'number' | 'integer' | 'boolean';
  required?: boolean;
}

export interface MappingFieldRule {
  to: string;
  from?: string | string[] | string[][];
  value?: any;
  maxLength?: number;
  min?: number;
  max?: number;
  operations?: MappingOperation[];
  settings?: MappingRuleSettings;
}

const SPANISH_PROVINCES_BY_PREFIX: Record<string, string> = {
  '01': 'Álava', '02': 'Albacete', '03': 'Alicante', '04': 'Almería', '05': 'Ávila',
  '06': 'Badajoz', '07': 'Illes Balears', '08': 'Barcelona', '09': 'Burgos', '10': 'Cáceres',
  '11': 'Cádiz', '12': 'Castellón', '13': 'Ciudad Real', '14': 'Córdoba', '15': 'A Coruña',
  '16': 'Cuenca', '17': 'Girona', '18': 'Granada', '19': 'Guadalajara', '20': 'Gipuzkoa',
  '21': 'Huelva', '22': 'Huesca', '23': 'Jaén', '24': 'León', '25': 'Lleida',
  '26': 'La Rioja', '27': 'Lugo', '28': 'Madrid', '29': 'Málaga', '30': 'Murcia',
  '31': 'Navarra', '32': 'Ourense', '33': 'Asturias', '34': 'Palencia', '35': 'Las Palmas',
  '36': 'Pontevedra', '37': 'Salamanca', '38': 'Santa Cruz de Tenerife', '39': 'Cantabria', '40': 'Segovia',
  '41': 'Sevilla', '42': 'Soria', '43': 'Tarragona', '44': 'Teruel', '45': 'Toledo',
  '46': 'Valencia', '47': 'Valladolid', '48': 'Bizkaia', '49': 'Zamora', '50': 'Zaragoza',
  '51': 'Ceuta', '52': 'Melilla',
};

export class MappingEngine {
  /**
   * Lee una propiedad anidada mediante notación de punto (ej. "customer.nif_cif" o "billingAddress.street1").
   */
  public static getByPath(obj: any, pathExpr: string): any {
    if (!obj || !pathExpr) return undefined;
    if (pathExpr.includes(' + ')) {
      const parts = pathExpr.split(' + ').map((p) => p.trim());
      const values = parts
        .map((p) => this.getByPath(obj, p))
        .filter((v) => v !== undefined && v !== null && String(v).trim() !== '');
      return values.length > 0 ? values.join(' ') : undefined;
    }

    const segments = pathExpr.split('.');
    let current = obj;
    for (const seg of segments) {
      if (current === null || current === undefined) return undefined;
      current = current[seg];
    }
    return current;
  }

  /**
   * Escribe un valor en un objeto destino soportando rutas anidadas (ej. "domicilioData.domicilio.codigoPostal").
   */
  public static setByPath(target: Record<string, any>, pathExpr: string, value: any): void {
    const segments = pathExpr.split('.');
    let current = target;
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i];
      if (typeof current[seg] !== 'object' || current[seg] === null) {
        current[seg] = {};
      }
      current = current[seg];
    }
    current[segments[segments.length - 1]] = value;
  }

  /**
   * Resuelve rutas simples, listas de concatenación ["shippingAddress.firstName", "shippingAddress.lastName"]
   * o listas de fallback [["billingAddress.company"], ["billingAddress.firstName", "billingAddress.lastName"]].
   */
  public static resolveSourceValue(source: Record<string, any>, from?: string | string[] | string[][]): any {
    if (!from) return undefined;

    if (typeof from === 'string') {
      return this.getByPath(source, from);
    }

    if (Array.isArray(from) && from.length > 0) {
      // Lista de candidatos fallback: string[][]
      if (Array.isArray(from[0])) {
        for (const candidateGroup of from as string[][]) {
          const joined = candidateGroup
            .map((pathKey) => this.getByPath(source, pathKey))
            .filter((v) => v !== undefined && v !== null && String(v).trim() !== '')
            .join(' ')
            .trim();
          if (joined) return joined;
        }
        return undefined;
      }

      // Lista simple de rutas que se concatenan con espacio: string[]
      const parts = (from as string[])
        .map((pathKey) => this.getByPath(source, pathKey))
        .filter((v) => v !== undefined && v !== null && String(v).trim() !== '');
      return parts.length > 0 ? parts.join(' ').trim() : undefined;
    }

    return undefined;
  }

  /**
   * Normaliza un NIF/CIF español o europeo: mayúsculas, sin espacios/guiones/puntos y sin prefijo "ES".
   */
  public static normalizeNif(raw?: string | null): string {
    if (!raw) return '';
    let cleaned = String(raw)
      .toUpperCase()
      .replace(/[\s\-._/]/g, '');
    if (cleaned.startsWith('ES') && cleaned.length > 9) {
      cleaned = cleaned.slice(2);
    }
    return cleaned;
  }

  /**
   * Resuelve el código de provincia español desde los 2 primeros dígitos del código postal.
   * En a3ERP CODPROVI va cuadrado a 4 caracteres (ej. "  08" para Barcelona).
   */
  public static resolveProvinceFromPostalCode(
    postalCode?: string | null,
    country: string = 'ES',
    padTo: number = 4
  ): { code: string; name: string } | null {
    if (!postalCode) return null;
    const normalizedCountry = (country || 'ES').toUpperCase();
    if (normalizedCountry !== 'ES' && normalizedCountry !== 'ESP' && normalizedCountry !== 'ESPAÑA') {
      return null;
    }
    const digits = String(postalCode).trim().replace(/\D/g, '');
    if (digits.length < 2) return null;
    const prefix = digits.slice(0, 2);
    const provinceName = SPANISH_PROVINCES_BY_PREFIX[prefix];
    if (!provinceName) return null;

    const paddedCode = padTo > prefix.length ? prefix.padStart(padTo, ' ') : prefix;
    return { code: paddedCode, name: provinceName };
  }

  /**
   * Formatea fechas según las convenciones de cada ERP/Plataforma:
   * - ISO_LOCAL (a3ERP): "YYYY-MM-DDTHH:mm:ss" sin zona horaria
   * - DATE_ONLY (Sage 200): "YYYY-MM-DD" sin hora (con hora se rechaza en Sage)
   * - DATETIME_SPACE (PrestaShop): "YYYY-MM-DD HH:mm:ss"
   */
  public static formatDate(input: any, format: string = 'ISO_LOCAL'): string {
    const date = input ? new Date(input) : new Date();
    const validDate = isNaN(date.getTime()) ? new Date() : date;
    const iso = validDate.toISOString(); // YYYY-MM-DDTHH:mm:ss.sssZ

    if (format === 'DATE_ONLY' || format === 'YYYY-MM-DD') {
      return iso.slice(0, 10);
    }
    if (format === 'DATETIME_SPACE' || format === 'YYYY-MM-DD HH:mm:ss') {
      return iso.slice(0, 19).replace('T', ' ');
    }
    // Default ISO_LOCAL: YYYY-MM-DDTHH:mm:ss
    return iso.slice(0, 19);
  }

  /**
   * Ejecuta el motor declarativo de mapeo (_Mapping_Engine) sobre un objeto origen.
   */
  public static applyRules(
    source: Record<string, any>,
    rules: MappingFieldRule[],
    seed: Record<string, any> = {}
  ): Record<string, any> {
    const output: Record<string, any> = JSON.parse(JSON.stringify(seed || {}));

    for (const rule of rules) {
      let val = rule.value !== undefined ? rule.value : this.resolveSourceValue(source, rule.from);
      if (val === undefined || val === null) continue;

      // Aplicar operaciones declarativas en orden
      if (Array.isArray(rule.operations)) {
        for (const op of rule.operations) {
          if (val === undefined || val === null) break;
          switch (op.type) {
            case 'trim':
              val = String(val).trim();
              break;
            case 'uppercase':
              val = String(val).toUpperCase();
              break;
            case 'lowercase':
              val = String(val).toLowerCase();
              break;
            case 'toNumber': {
              const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
              val = isNaN(num) ? 0 : num;
              break;
            }
            case 'toString':
              val = String(val);
              break;
            case 'formatDate':
              val = this.formatDate(val, op.format || 'ISO_LOCAL');
              break;
            case 'padLeft':
              val = String(val).padStart(op.length || 8, op.padChar || ' ');
              break;
            case 'booleanTF':
              val = val === true || val === 'T' || val === '1' || val === 1 ? 'T' : 'F';
              break;
            case 'normalizeNif':
              val = this.normalizeNif(String(val));
              break;
          }
        }
      }

      // Aplicar conversiones de tipo desde settings
      const targetType = rule.settings?.type;
      if (targetType === 'number') {
        const parsed = typeof val === 'number' ? val : parseFloat(String(val));
        val = isNaN(parsed) ? 0 : parsed;
      } else if (targetType === 'integer') {
        const parsed = typeof val === 'number' ? Math.trunc(val) : parseInt(String(val), 10);
        val = isNaN(parsed) ? 0 : parsed;
      } else if (targetType === 'boolean') {
        val = Boolean(val);
      } else if (targetType === 'string' && typeof val !== 'string') {
        val = String(val);
      }

      // Aplicar límites numéricos min / max
      const minLimit = rule.min ?? rule.settings?.min;
      const maxLimit = rule.max ?? rule.settings?.max;
      if (typeof val === 'number') {
        if (minLimit !== undefined && val < minLimit) val = minLimit;
        if (maxLimit !== undefined && val > maxLimit) val = maxLimit;
      }

      // Aplicar recorte de longitud máxima (maxLength)
      const maxLen = rule.maxLength ?? rule.settings?.maxLength;
      if (typeof val === 'string' && maxLen !== undefined && maxLen > 0 && val.length > maxLen) {
        val = val.slice(0, maxLen);
      }

      this.setByPath(output, rule.to, val);
    }

    return output;
  }

  /**
   * Mapea atributos de producto de DAMA-CRM hacia todas las plataformas (a3ERP, Sage 200, PrestaShop, Shopify, WooCommerce, Odoo, OpenCart, UnoPIM).
   */
  public static autoMapProductAttributes(
    product: any,
    sourceApp?: string,
    rawData?: any
  ): ProductAttributeMapping {
    let existingMapping: ProductAttributeMapping = {};
    try {
      if (product.attributes) {
        existingMapping = typeof product.attributes === 'string' ? JSON.parse(product.attributes) : product.attributes;
      }
    } catch {
      existingMapping = {};
    }

    const name = product.name || '';
    const sku = String(product.sku || '').trim();
    const category = product.category || 'General';
    const brand = product.brand || product.supplierName || 'DAMA';
    const weight = product.weight ?? 0.5;
    const dimensions = product.dimensions || '20x15x10 cm';
    const barcode = product.barcode || product.supplierSku || sku;
    const price = Number(product.price ?? 0);
    const costPrice = Number(product.costPrice ?? Number((price * 0.65).toFixed(2)));
    const taxRate = Number(product.taxRate ?? 21);
    const minStock = Number(product.minStock ?? 5);

    const a3CodArt = /^\d+$/.test(sku) ? sku.padStart(15, ' ') : sku.toUpperCase().slice(0, 15);
    const a3TipIva = taxRate === 4 ? 'ORD4' : taxRate === 10 ? 'ORD10' : 'ORD21';

    const a3erpMapping = {
      CODART: a3CodArt,
      DESCART: name.slice(0, 100),
      PRCVENTA: price,
      PRCSTANDARD: price,
      PRCCOSTE: costPrice,
      TIPIVA: a3TipIva,
      CODFAMEST: category.toUpperCase().slice(0, 8),
      PESO: weight,
      UNIDADESSTOCK: Number(product.stock ?? 0),
      AFESTOCK: 'T',
      ESVENTA: 'T',
      OBSOLETO: 'F',
      BLOQUEADO: 'F',
      TALLAS: 'F',
      ...(rawData?.a3erp || {}),
    };

    const prestashopMapping = {
      reference: sku.slice(0, 64),
      ean13: /^\d{1,13}$/.test(barcode) ? barcode : '',
      type: 'standard',
      priceTaxExcluded: Number(price.toFixed(6)),
      priceTaxIncluded: Number((price * (1 + taxRate / 100)).toFixed(6)),
      wholesalePrice: Number(costPrice.toFixed(6)),
      taxRulesGroupId: taxRate === 21 ? 1 : taxRate === 10 ? 2 : 3,
      names: { 'es-ES': name.slice(0, 128) },
      linkRewrites: {
        'es-ES': name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 128),
      },
      weight,
      visibility: 'both',
      condition: 'new',
      availableForOrder: true,
      ...(rawData?.prestashop || {}),
    };

    const unopimMapping = {
      family: category.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      completeness: 100,
      categories: [category],
      attributes: {
        sku,
        name,
        brand,
        weight_kg: weight,
        dimensions_cm: dimensions,
        barcode_ean13: barcode,
        tax_class: `standard_${taxRate}`,
        completeness_percentage: 100,
        marketing_status: 'ready_for_channels',
        ...(rawData?.unopim?.attributes || {}),
      },
    };

    const opencartMapping = {
      model: sku,
      location: product.location || 'Almacén Central',
      upc: barcode,
      ean: barcode,
      jan: '',
      isbn: '',
      mpn: product.supplierSku || sku,
      weight,
      weight_class_id: 1,
      length: 20,
      width: 15,
      height: 10,
      length_class_id: 1,
      tax_class_id: taxRate === 21 ? 1 : 2,
      attributes: {
        'Marca / Fabricante': brand,
        'Categoría DAMA': category,
        'Garantía': '2 Años Oficial',
        ...(rawData?.opencart?.attributes || {}),
      },
    };

    const sageMapping = {
      codigoEmpresa: 9999,
      codigoArticulo: sku.slice(0, 20),
      descripcionArticulo: name.slice(0, 50),
      tipoArticulo: 'M',
      marcaProducto: brand.slice(0, 20),
      codigoFamilia: category.toUpperCase().slice(0, 10),
      precioCompra: costPrice,
      precioVenta: price,
      pesoNetoUnitario_: weight,
      stockMinimo: minStock,
      obsoletoLc: 0,
      nominal_code: '4000.0000',
      purchase_code: '5000.0000',
      cost_nominal_code: '5000.0000',
      tax_code: taxRate === 21 ? 'IVA21' : taxRate === 10 ? 'IVA10' : 'IVA4',
      department: '10',
      warehouse_bin: product.location || 'A-01-01',
      supplier_part_number: product.supplierSku || sku,
      commodity_code: '8471300090',
      intrastat_code: '8471.30.00',
      standard_cost: costPrice,
      reorder_level: minStock,
      valuation_method: 'FIFO',
      ...(rawData?.sage?.attributes || {}),
    };

    const odooMapping = {
      default_code: sku,
      barcode,
      type: 'product',
      categ_id: `All / ${category}`,
      list_price: price,
      standard_price: costPrice,
      weight,
      volume: 0.005,
      taxes_id: [`IVA ${taxRate}%`],
      supplier_taxes_id: [`IVA Soportado ${taxRate}%`],
      routes: ['Buy', 'Make to Order'],
      attributes: {
        Brand: brand,
        Category: category,
        ...(rawData?.odoo?.attributes || {}),
      },
    };

    const shopifyMapping = {
      handle: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      vendor: brand,
      product_type: category,
      tags: `${category}, ${brand}, dama-crm-sync`,
      barcode,
      status: 'ACTIVE',
      metafields: {
        'custom.brand': brand,
        'custom.internal_sku': sku,
        'inventory.min_reorder_point': minStock,
        'tax.vat_rate': `${taxRate}%`,
        ...(rawData?.shopify?.metafields || {}),
      },
    };

    const woocommerceMapping = {
      sku,
      regular_price: String(Number((price * (1 + taxRate / 100)).toFixed(2))),
      manage_stock: true,
      stock_quantity: Number(product.stock ?? 0),
      stock_status: (product.stock ?? 0) > 0 ? 'instock' : 'outofstock',
      tax_status: 'taxable',
      tax_class: taxRate === 21 ? 'standard' : 'reduced-rate',
      attributes: [
        { name: 'Marca', visible: true, variation: false, options: [brand] },
        { name: 'Categoría', visible: true, variation: false, options: [category] },
        { name: 'Garantía', visible: true, variation: false, options: ['2 Años'] },
      ],
      ...(rawData?.woocommerce?.attributes || {}),
    };

    return {
      ...existingMapping,
      a3erp: { ...a3erpMapping, ...(existingMapping.a3erp || {}) },
      prestashop: { ...prestashopMapping, ...(existingMapping.prestashop || {}) },
      unopim: { ...unopimMapping, ...(existingMapping.unopim || {}) },
      opencart: { ...opencartMapping, ...(existingMapping.opencart || {}) },
      sage: { ...sageMapping, ...(existingMapping.sage || {}) },
      odoo: { ...odooMapping, ...(existingMapping.odoo || {}) },
      shopify: { ...shopifyMapping, ...(existingMapping.shopify || {}) },
      woocommerce: { ...woocommerceMapping, ...(existingMapping.woocommerce || {}) },
      custom: existingMapping.custom || {},
      lastAutoMappedAt: new Date().toISOString(),
    };
  }
}
