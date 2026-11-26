import { A3ErpPaginationHeader } from './a3erp.types';

/**
 * Campos de código de a3ERP y sus longitudes de cuadrado cuando son puramente numéricos:
 * - CODART: 15 caracteres
 * - CODPROVI: 4 caracteres (excepción documentada de provincia)
 * - TIPOCONT: NUNCA se cuadra ("1", "30", etc.)
 * - Resto de códigos (CODCLI, CODALM, CODPRO, CODFAMEST, DOCPAG, FORPAG, TARIFA, CODREP, CODPER, CODBAN, CAR1..10): 8 caracteres
 * - Códigos con letras (ej. "A526", "CONTADO", "BORRADOR", "EURO"): NO llevan espacios a la izquierda, solo mayúsculas.
 */
const NEVER_PADDED_FIELDS = new Set(['TIPOCONT']);
const PADDED_15_FIELDS = new Set(['CODART']);
const PADDED_4_FIELDS = new Set(['CODPROVI']);
const PADDED_8_FIELDS = new Set([
  'CODCLI',
  'CODALM',
  'CODALMSAL',
  'CODPRO',
  'CODFAMEST',
  'CODREP',
  'CODREP2',
  'CODREP3',
  'CODPER',
  'CODBAN',
  'TARIFA',
  'FORPAG',
  'DOCPAG',
  'SERIE',
  'CAR1',
  'CAR2',
  'CAR3',
  'CAR4',
  'CAR5',
  'CAR6',
  'CAR7',
  'CAR8',
  'CAR9',
  'CAR10',
  'ENTIDAD',
  'IDREG1',
]);

const CALCULATED_READONLY_DOC_FIELDS = [
  'BASE',
  'BASEBRUTA',
  'BASEMONEDA',
  'BASEMASIVA',
  'BASEMONEDAMASIVA',
  'BASEBRUTAIVA1',
  'BASEBRUTAIVA2',
  'BASEBRUTAIVA3',
  'BASEBRUTAIVA4',
  'TOTBRUTO',
  'TOTBRUTOMONEDA',
  'TOTDTO',
  'TOTDTOMONEDA',
  'TOTIVA',
  'TOTIVAMONEDA',
  'TOTDOC',
  'TOTMONEDA',
  'TOTPESO',
  'TOTPRONTO',
  'TOTAPAGAR',
  'FECHAMODIFICACION',
  'IDORG',
];

const CALCULATED_INVOICE_ONLY_FIELDS = ['CONTABLE', 'CONREPER', 'CONVENCIM'];

export class A3ErpPaddingAndProtocol {
  /**
   * Cuadra un código según las reglas oficiales de a3ERP:
   * - Siempre en mayúsculas si tiene letras.
   * - Si es solo dígitos (/^\d+$/), rellena con espacios por la izquierda hasta su longitud (15 para CODART, 4 para CODPROVI, 8 para el resto).
   * - Si contiene letras (ej. "A526", "CONTADO"), no añade espacios.
   * - TIPOCONT nunca se cuadra.
   */
  public static padCode(value: string | number | null | undefined, fieldName: string = 'CODCLI'): string {
    if (value === null || value === undefined) return '';
    const trimmed = String(value).trim();
    if (!trimmed) return '';

    const upperField = fieldName.toUpperCase();
    if (NEVER_PADDED_FIELDS.has(upperField)) {
      return trimmed.toUpperCase();
    }

    const isNumericOnly = /^\d+$/.test(trimmed);
    if (!isNumericOnly) {
      return trimmed.toUpperCase();
    }

    if (PADDED_15_FIELDS.has(upperField)) {
      return trimmed.padStart(15, ' ');
    }
    if (PADDED_4_FIELDS.has(upperField)) {
      return trimmed.padStart(4, ' ');
    }
    return trimmed.padStart(8, ' ');
  }

  /**
   * Aplica el cuadrado automático a todos los campos de código de un payload de cabecera o filtro.
   */
  public static padObjectCodes<T extends Record<string, any>>(
    obj: T,
    explicitFields?: string[]
  ): T {
    const clone: Record<string, any> = { ...obj };
    const targetFields = explicitFields
      ? new Set(explicitFields.map((f) => f.toUpperCase()))
      : new Set([...PADDED_15_FIELDS, ...PADDED_4_FIELDS, ...PADDED_8_FIELDS]);

    for (const [key, val] of Object.entries(clone)) {
      if (val === undefined || val === null || val === '') continue;
      const upperKey = key.toUpperCase();
      if (NEVER_PADDED_FIELDS.has(upperKey)) {
        clone[key] = String(val).trim();
        continue;
      }
      if (targetFields.has(upperKey)) {
        clone[key] = this.padCode(val, upperKey);
      }
    }

    return clone as T;
  }

  /**
   * Codifica los parámetros de filtrado de un GET /api/proc/<Nombre> para la cabecera HTTP `Parameters` (JSON en Base64).
   * Convierte automáticamente códigos cuadrados en los filtros (`codart` a 15, `codalm`/`codcli`/`codpro`/`car1..10` a 8)
   * y garantiza que `soloconstock` nunca viaje como string `"1"` (lo cual provoca HTTP 500 en a3ERP).
   */
  public static encodeParametersHeader(params?: Record<string, any>): string | undefined {
    if (!params || Object.keys(params).length === 0) return undefined;

    const normalized: Record<string, any> = {};
    for (const [rawKey, rawVal] of Object.entries(params)) {
      if (rawVal === undefined || rawVal === null || rawVal === '') continue;
      const lowerKey = rawKey.toLowerCase();

      if (lowerKey === 'soloconstock') {
        // Advertencia oficial de a3ERP: si soloconstock va como string "1" el servidor responde 500
        normalized[rawKey] = rawVal === true || rawVal === 1 || rawVal === '1' || rawVal === 'true';
        continue;
      }

      if (lowerKey === 'codart') {
        normalized[rawKey] = this.padCode(rawVal, 'CODART');
        continue;
      }

      if (
        lowerKey === 'codalm' ||
        lowerKey === 'codcli' ||
        lowerKey === 'codpro' ||
        lowerKey === 'codfamest' ||
        /^car([1-9]|10)$/.test(lowerKey)
      ) {
        normalized[rawKey] = this.padCode(rawVal, lowerKey.toUpperCase());
        continue;
      }

      normalized[rawKey] = rawVal;
    }

    const jsonStr = JSON.stringify(normalized);
    return Buffer.from(jsonStr, 'utf8').toString('base64');
  }

  /**
   * Decodifica la cabecera `X-Pagination` devuelta por los métodos GET /api/proc/<Nombre>.
   */
  public static parseXPaginationHeader(
    headerVal?: string | string[]
  ): A3ErpPaginationHeader | undefined {
    if (!headerVal) return undefined;
    const raw = Array.isArray(headerVal) ? headerVal[0] : headerVal;
    try {
      const parsed = JSON.parse(raw);
      return {
        TotalCount: Number(parsed.TotalCount ?? 0),
        PageSize: Math.min(Number(parsed.PageSize ?? 50), 50),
        CurrentPage: Number(parsed.CurrentPage ?? 1),
        TotalPages: Number(parsed.TotalPages ?? 1),
        HasNextPage: Boolean(parsed.HasNextPage),
        HasPreviousPage: Boolean(parsed.HasPreviousPage),
      };
    } catch {
      return undefined;
    }
  }

  /**
   * Limpia las comillas literales del token JWT en texto plano devuelto por POST /api/Login ("eyJhbGc...").
   */
  public static sanitizeLoginJwt(rawBody: any): string {
    if (!rawBody) return '';
    if (typeof rawBody === 'object' && rawBody.access_token) {
      return String(rawBody.access_token).trim();
    }
    return String(rawBody)
      .trim()
      .replace(/^["']+|["']+$/g, '');
  }

  /**
   * Aplica las reglas de escritura de documentos de a3ERP:
   * 1. Regla IVAINCLUIDO: si IVAINCLUIDO="T", cada línea lleva PRCMONEDAMASIVA (y nunca PRCMONEDA);
   *    si IVAINCLUIDO="F", lleva PRCMONEDA (y nunca PRCMONEDAMASIVA).
   * 2. Elimina campos calculados (BASE, TOTDOC, TOTIVA...) que hacen que a3ERP rechace el alta.
   * 3. En facturas (AltaFacturaVenta), elimina CONTABLE/CONREPER/CONVENCIM (calculados en servidor real).
   * 4. En modificaciones de pedido con líneas (ModificaPedidoVenta), elimina IVAINCLUIDO de la cabecera
   *    para evitar el error "Hay líneas no se puede cambiar IVA/IGIC Incluido".
   */
  public static prepareDocumentPayload(
    rawDoc: Record<string, any>,
    options: {
      action: string;
      linesField?: 'PEDIDOVENTALINEAS' | 'ALBARANVENTALINEAS' | 'FACTURAVENTALINEAS' | 'ALBARANCOMPRALINEAS' | 'FACTURACOMPRALINEAS';
      paddedHeaderFields?: string[];
    }
  ): Record<string, any> {
    const isModify = options.action.startsWith('Modifica');
    const isInvoice = options.action.includes('Factura');
    const linesKey = options.linesField || 'PEDIDOVENTALINEAS';

    const doc: Record<string, any> = this.padObjectCodes(
      { ...rawDoc },
      options.paddedHeaderFields || ['CODCLI', 'CODPRO', 'CODALM', 'DOCPAG', 'FORPAG', 'CODPROVI']
    );

    const ivaIncluido: 'T' | 'F' = doc.IVAINCLUIDO === 'F' ? 'F' : 'T';

    // Eliminar campos calculados de cabecera
    for (const calcField of CALCULATED_READONLY_DOC_FIELDS) {
      delete doc[calcField];
    }

    if (isInvoice) {
      for (const invCalc of CALCULATED_INVOICE_ONLY_FIELDS) {
        delete doc[invCalc];
      }
    }

    // Procesar líneas
    if (Array.isArray(doc[linesKey])) {
      doc[linesKey] = doc[linesKey].map((rawLine: Record<string, any>) => {
        const line: Record<string, any> = { ...rawLine };
        if (line.CODART !== undefined) {
          line.CODART = this.padCode(line.CODART, 'CODART');
        }

        const priceCandidate =
          ivaIncluido === 'T'
            ? line.PRCMONEDAMASIVA ?? line.PRCMONEDA ?? line.unitPrice ?? 0
            : line.PRCMONEDA ?? line.PRCMONEDAMASIVA ?? line.unitPrice ?? 0;

        delete line.PRCMONEDAMASIVA;
        delete line.PRCMONEDA;
        delete line.BASE;
        delete line.BRUTO;
        delete line.PRECIO;
        delete line.PRECIOMASIVA;
        delete line.PRCMEDIO;

        if (ivaIncluido === 'T') {
          line.PRCMONEDAMASIVA = Number(priceCandidate);
        } else {
          line.PRCMONEDA = Number(priceCandidate);
        }

        if (line.DESCLIN && typeof line.DESCLIN === 'string' && line.DESCLIN.length > 200) {
          line.DESCLIN = line.DESCLIN.slice(0, 200);
        }

        return line;
      });
    }

    // Gotcha real verificado en servidor: ModificaPedidoVenta con líneas rechaza el payload si incluye IVAINCLUIDO
    if (isModify && Array.isArray(doc[linesKey]) && doc[linesKey].length > 0) {
      delete doc.IVAINCLUIDO;
    }

    return doc;
  }

  /**
   * Filtra las filas de `StockTallas` excluyendo la fila resumen con `UNIDADES` negativo
   * (ej. -1489.0 visto en servidor real) para sumar únicamente combinaciones reales de talla/color.
   */
  public static filterValidStockTallasRows<T extends { UNIDADES?: number; CODTALLAH?: string | null; CODTALLAV?: string | null }>(
    rows: T[]
  ): T[] {
    return (rows || []).filter((r) => {
      const hasDimension = Boolean((r.CODTALLAH && r.CODTALLAH.trim()) || (r.CODTALLAV && r.CODTALLAV.trim()));
      const isNegativeSummary = !hasDimension && typeof r.UNIDADES === 'number' && r.UNIDADES < 0;
      return !isNegativeSummary;
    });
  }
}
