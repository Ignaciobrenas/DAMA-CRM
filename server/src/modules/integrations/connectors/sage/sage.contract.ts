import { MappingEngine } from '../../core/mapping-engine';
import {
  SageAddressInput,
  SageCustomerSupplierInput,
  SageDocumentHeaderInput,
  SageDocumentTypeCode,
  SageInventoryInput,
  SageStockMovementInput,
} from './sage.types';

export interface SageDocumentTypeMetadata {
  code: SageDocumentTypeCode;
  name: string;
  description: string;
  targetTable: string;
  dameContadorKey: string;
  isSalesDocument: boolean;
  isPurchaseDocument: boolean;
}

export const SAGE_DOCUMENT_TYPES_CATALOG: SageDocumentTypeMetadata[] = [
  // Venta (Cliente)
  { code: 'PVE', name: 'Pedido de Venta', description: 'Pedido de cliente (Order_IN_v12)', targetTable: 'CabeceraPedidoCliente', dameContadorKey: 'PEDIDOS_CLI', isSalesDocument: true, isPurchaseDocument: false },
  { code: 'ALC', name: 'Albarán de Venta', description: 'Albarán de entrega a cliente', targetTable: 'CabeceraAlbaranCliente', dameContadorKey: 'ALBARAN_CLI', isSalesDocument: true, isPurchaseDocument: false },
  { code: 'FAC', name: 'Factura de Venta', description: 'Factura emitida a cliente (genera también albarán)', targetTable: 'ResumenCliente', dameContadorKey: 'FACTURAS_EMI', isSalesDocument: true, isPurchaseDocument: false },
  { code: 'OFE', name: 'Oferta de Venta', description: 'Presupuesto u oferta comercial a cliente', targetTable: 'CabeceraOfertaCliente', dameContadorKey: 'OFERTA_CLI', isSalesDocument: true, isPurchaseDocument: false },
  { code: 'FPC', name: 'Contrato de Venta', description: 'Contrato comercial con cliente', targetTable: 'CabeceraContratoCliente', dameContadorKey: 'CONTRATO_CLI', isSalesDocument: true, isPurchaseDocument: false },
  // Compra (Proveedor)
  { code: 'PCO', name: 'Pedido de Compra', description: 'Pedido a proveedor', targetTable: 'CabeceraPedidoProveedor', dameContadorKey: 'PEDIDOS_PRO', isSalesDocument: false, isPurchaseDocument: true },
  { code: 'ALP', name: 'Albarán de Compra', description: 'Albarán de recepción de mercancía', targetTable: 'CabeceraAlbaranProveedor', dameContadorKey: 'ALBARAN_PRO', isSalesDocument: false, isPurchaseDocument: true },
  { code: 'FAP', name: 'Factura de Compra', description: 'Factura recibida de proveedor', targetTable: 'ResumenProveedor', dameContadorKey: 'FACTURAS_REC', isSalesDocument: false, isPurchaseDocument: true },
  { code: 'OFC', name: 'Oferta de Compra', description: 'Solicitud de presupuesto a proveedor', targetTable: 'CabeceraOfertaProveedor', dameContadorKey: 'OFERTA_PRO', isSalesDocument: false, isPurchaseDocument: true },
  { code: 'FPP', name: 'Contrato de Compra', description: 'Contrato con proveedor', targetTable: 'CabeceraContratoProveedor', dameContadorKey: 'CONTRATO_PRO', isSalesDocument: false, isPurchaseDocument: true },
];

export const SAGE_IMPORT_ENDPOINTS_CATALOG = [
  {
    entity: 'Documents',
    restEndpoint: 'POST /api/v1/Documents/create',
    statusEndpoint: 'GET /api/v1/Documents/{taskId}/status',
    graphqlMutation: 'importDocument(document: DocumentInput)',
    tmpImeTable: 'TmpIME_CabeceraDocumento + TmpIME_LineasDocumento',
    documentedFieldsCount: 314, // 224 cabecera + 90 líneas
    liveGraphqlFieldsCount: 316, // 225 + 91
    activeWorkflow: 'Order_IN_v12 (PVE)',
  },
  {
    entity: 'ClientesProveedores',
    restEndpoint: 'POST /api/v1/ClientesProveedores/create',
    statusEndpoint: 'GET /api/v1/ClientesProveedores/{taskId}/status',
    graphqlMutation: 'importCustomerSupplier(customerSupplier: CustomerSupplierInput)',
    tmpImeTable: 'TmpIME_ClientesProveedores',
    documentedFieldsCount: 118,
    liveGraphqlFieldsCount: 120,
    activeWorkflow: '_Customer_Ensure_v10',
  },
  {
    entity: 'Domicilios',
    restEndpoint: 'POST /api/v1/Domicilios/create',
    statusEndpoint: 'GET /api/v1/Domicilios/{taskId}/status',
    graphqlMutation: 'importAddress(address: AddressInput)',
    tmpImeTable: 'TmpIME_Domicilios',
    documentedFieldsCount: 43,
    liveGraphqlFieldsCount: 43,
    activeWorkflow: 'Domicilio_POST_v4',
  },
  {
    entity: 'Products',
    restEndpoint: 'POST /api/v1/Products/create',
    statusEndpoint: 'GET /api/v1/Products/{taskId}/status',
    graphqlMutation: 'importItem(item: ItemInput)',
    tmpImeTable: 'TmpIME_Articulos',
    documentedFieldsCount: 77,
    liveGraphqlFieldsCount: 77,
    activeWorkflow: 'Products_OUT_v12 (solo lectura desde Sage)',
  },
  {
    entity: 'StockMovements',
    restEndpoint: 'POST /api/v1/StockMovements/create',
    statusEndpoint: 'GET /api/v1/StockMovements/{taskId}/status',
    graphqlMutation: 'importStockMovement(stockMovement: StockMovementInput)',
    tmpImeTable: 'TmpIME_MovimientoStock',
    documentedFieldsCount: 35,
    liveGraphqlFieldsCount: 35,
    activeWorkflow: 'Stock_Move_v13 + _Stock_Move_Variant_v13',
  },
  {
    entity: 'Inventories',
    restEndpoint: 'POST /api/v1/Inventories/create',
    statusEndpoint: 'GET /api/v1/Inventories/{taskId}/status',
    graphqlMutation: 'importInventory(inventory: InventoryInput)',
    tmpImeTable: 'TmpIME_Inventarios',
    documentedFieldsCount: 25,
    liveGraphqlFieldsCount: 25,
    activeWorkflow: 'Disponible bajo demanda',
  },
];

export class SageContractValidator {
  /**
   * Valida y normaliza un documento comercial de Sage 200 (TmpIME_CabeceraDocumento + TmpIME_LineasDocumento):
   * - Fechas en formato estricto YYYY-MM-DD sin hora (con hora Sage rechaza fechaDocumento/fechaEntrega).
   * - codigoNacion y codigoNacionEnvios tipados como entero (default 108 = España).
   * - suPedidoWeb tipado como entero si se incluye.
   * - formaDePago con D mayúscula (máx 35).
   * - Líneas con orden secuencial 1..9999 sin repetidos y descripcionLinea máx 200.
   */
  public static validateAndNormalizeDocument(
    input: Partial<SageDocumentHeaderInput>
  ): { valid: boolean; errors: string[]; normalized?: SageDocumentHeaderInput } {
    const errors: string[] = [];
    const codigoEmpresa = Number(input.codigoEmpresa || 9999);
    if (isNaN(codigoEmpresa) || codigoEmpresa < 1 || codigoEmpresa > 9999) {
      errors.push('codigoEmpresa debe ser un entero entre 1 y 9999.');
    }

    const docType = (input.codigoDocumentoLc || 'PVE').toUpperCase() as SageDocumentTypeCode;
    const typeMeta = SAGE_DOCUMENT_TYPES_CATALOG.find((t) => t.code === docType);
    if (!typeMeta) {
      errors.push(`codigoDocumentoLc '${docType}' inválido. Valores admitidos: ${SAGE_DOCUMENT_TYPES_CATALOG.map((t) => t.code).join(', ')}`);
    }

    if (typeMeta?.isSalesDocument && !input.codigoCliente) {
      errors.push(`codigoCliente es obligatorio para documentos de venta (${docType}).`);
    }
    if (typeMeta?.isPurchaseDocument && !input.codigoProveedor) {
      errors.push(`codigoProveedor es obligatorio para documentos de compra (${docType}).`);
    }

    const fechaDoc = MappingEngine.formatDate(input.fechaDocumento || new Date(), 'DATE_ONLY');
    let fechaEnt = MappingEngine.formatDate(input.fechaEntrega || fechaDoc, 'DATE_ONLY');
    if (fechaEnt < fechaDoc) {
      fechaEnt = fechaDoc; // fechaEntrega no puede ser anterior a fechaDocumento
    }

    const ejercicio = Number(input.ejercicioDocumento || fechaDoc.slice(0, 4));
    if (ejercicio < 2020 || ejercicio > 2150) {
      errors.push('ejercicioDocumento debe estar entre 2020 y 2150.');
    }

    const rawLines = Array.isArray(input.lineas) ? input.lineas : [];
    if (rawLines.length === 0) {
      errors.push('El documento Sage debe incluir al menos una línea en lineas[].');
    }

    const seenOrders = new Set<number>();
    const normalizedLines = rawLines.map((line, idx) => {
      const orden = Number(line.orden || idx + 1);
      if (seenOrders.has(orden)) {
        errors.push(`El número de orden de línea ${orden} está duplicado en el documento.`);
      }
      seenOrders.add(orden);

      if (!line.codigoArticulo || String(line.codigoArticulo).trim() === '') {
        errors.push(`La línea ${orden} no tiene codigoArticulo.`);
      }
      const unidades = Number(line.unidades ?? 0);
      if (unidades === 0) {
        errors.push(`La línea ${orden} tiene unidades=0 (Sage exige unidades no-cero).`);
      }

      return {
        ...line,
        orden,
        codigoArticulo: String(line.codigoArticulo || '').trim().slice(0, 20),
        unidades,
        codigoAlmacen: line.codigoAlmacen ? String(line.codigoAlmacen).slice(0, 4) : '001',
        descripcionArticulo: line.descripcionArticulo ? String(line.descripcionArticulo).slice(0, 50) : undefined,
        descripcionLinea: line.descripcionLinea ? String(line.descripcionLinea).slice(0, 200) : undefined,
        precio: line.precio !== undefined ? Number(line.precio) : 0,
        porcentajeDescuento: line.porcentajeDescuento !== undefined ? Number(line.porcentajeDescuento) : 0,
      };
    });

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    const normalized: SageDocumentHeaderInput = {
      codigoEmpresa,
      codigoDocumentoLc: docType,
      ejercicioDocumento: ejercicio,
      serieDocumento: input.serieDocumento ? String(input.serieDocumento).slice(0, 10) : 'WEB',
      numeroDocumento: Number(input.numeroDocumento ?? 0),
      tipoImportacionIME: input.tipoImportacionIME ?? 0,
      fechaDocumento: fechaDoc,
      fechaEntrega: fechaEnt,
      codigoCliente: input.codigoCliente ? String(input.codigoCliente).slice(0, 15) : undefined,
      codigoProveedor: input.codigoProveedor ? String(input.codigoProveedor).slice(0, 15) : undefined,
      cifDni: input.cifDni ? MappingEngine.normalizeNif(input.cifDni).slice(0, 13) : undefined,
      razonSocial: input.razonSocial ? String(input.razonSocial).slice(0, 40) : undefined,
      razonSocial2: input.razonSocial2 ? String(input.razonSocial2).slice(0, 40) : undefined,
      nombre: input.nombre ? String(input.nombre).slice(0, 35) : undefined,
      domicilio: input.domicilio ? String(input.domicilio).slice(0, 40) : undefined,
      codigoPostal: input.codigoPostal ? String(input.codigoPostal).slice(0, 8) : undefined,
      municipio: input.municipio ? String(input.municipio).slice(0, 25) : undefined,
      provincia: input.provincia ? String(input.provincia).slice(0, 20) : undefined,
      codigoNacion: typeof input.codigoNacion === 'number' ? Math.trunc(input.codigoNacion) : 108,
      codigoNacionEnvios: typeof input.codigoNacionEnvios === 'number' ? Math.trunc(input.codigoNacionEnvios) : 108,
      formaDePago: input.formaDePago ? String(input.formaDePago).slice(0, 35) : undefined,
      codigoMoneda: (input.codigoMoneda || 'EUR').slice(0, 3),
      suPedidoWeb:
        input.suPedidoWeb !== undefined && !isNaN(Number(input.suPedidoWeb))
          ? Math.trunc(Number(input.suPedidoWeb))
          : undefined,
      lineas: normalizedLines,
    };

    return { valid: true, errors: [], normalized };
  }

  /**
   * Valida y normaliza un Cliente o Proveedor (TmpIME_ClientesProveedores):
   * - clienteOProveedor exactamente 1 carácter: "C" o "P"
   * - formadePago con "d" minúscula (compatible tanto con REST como con GraphQL HotChocolate)
   * - email1 máx 250 caracteres, razonSocial máx 40, cifDni máx 13
   */
  public static validateAndNormalizeCustomerSupplier(
    input: Partial<SageCustomerSupplierInput> & { formaDePago?: string }
  ): { valid: boolean; errors: string[]; normalized?: SageCustomerSupplierInput } {
    const errors: string[] = [];
    const codigoEmpresa = Number(input.codigoEmpresa || 9999);
    const rawType = String(input.clienteOProveedor || 'C').trim().toUpperCase().slice(0, 1);

    if (rawType !== 'C' && rawType !== 'P') {
      errors.push(`clienteOProveedor debe ser exactamente 'C' (Cliente) o 'P' (Proveedor).`);
    }

    const cleanNif = MappingEngine.normalizeNif(input.cifDni).slice(0, 13);
    if (!cleanNif) {
      errors.push('cifDni es obligatorio en ClientesProveedores.');
    }

    const usarContador: 0 | 1 = input.usarContadorSage === 0 ? 0 : 1;
    if (usarContador === 0 && !input.codigoClienteProveedor) {
      errors.push('codigoClienteProveedor es obligatorio cuando usarContadorSage=0.');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    const paymentForm = input.formadePago || input.formaDePago;

    const normalized: SageCustomerSupplierInput = {
      codigoEmpresa,
      clienteOProveedor: rawType as 'C' | 'P',
      cifDni: cleanNif,
      usarContadorSage: usarContador,
      codigoClienteProveedor:
        usarContador === 1
          ? input.codigoClienteProveedor || '-1'
          : String(input.codigoClienteProveedor).slice(0, 15),
      razonSocial: input.razonSocial ? String(input.razonSocial).slice(0, 40) : undefined,
      razonSocial2: input.razonSocial2 ? String(input.razonSocial2).slice(0, 40) : undefined,
      nombre: input.nombre ? String(input.nombre).slice(0, 35) : undefined,
      domicilio: input.domicilio ? String(input.domicilio).slice(0, 40) : undefined,
      codigoPostal: input.codigoPostal ? String(input.codigoPostal).slice(0, 8) : undefined,
      municipio: input.municipio ? String(input.municipio).slice(0, 25) : undefined,
      provincia: input.provincia ? String(input.provincia).slice(0, 20) : undefined,
      codigoNacion: typeof input.codigoNacion === 'number' ? Math.trunc(input.codigoNacion) : 108,
      siglaNacion: (input.siglaNacion || 'ES').slice(0, 2).toUpperCase(),
      telefono: input.telefono ? String(input.telefono).slice(0, 15) : undefined,
      email1: input.email1 ? String(input.email1).slice(0, 250) : undefined,
      formadePago: paymentForm ? String(paymentForm).slice(0, 35) : undefined,
      codigoCategoriaCliente: (input.codigoCategoriaCliente || 'CLI').slice(0, 10),
      tipoImportacionIME: input.tipoImportacionIME ?? 0,
    };

    return { valid: true, errors: [], normalized };
  }

  /**
   * Valida y normaliza un Domicilio de cliente o proveedor (TmpIME_Domicilios, 43 campos).
   * Incluye las correcciones auditadas en suite 09:
   * - Sin colisión en codigoNacion (siempre entero short, default 108)
   * - clienteOProveedor con maxLength 1 ("C" o "P")
   */
  public static validateAndNormalizeAddress(
    input: Partial<SageAddressInput>
  ): { valid: boolean; errors: string[]; normalized?: SageAddressInput } {
    const errors: string[] = [];
    if (!input.codigoClienteProveedor) {
      errors.push('codigoClienteProveedor es obligatorio para dar de alta un Domicilio en Sage.');
    }

    const cliOrProv = (String(input.clienteOProveedor || 'C').trim().toUpperCase().slice(0, 1) || 'C') as 'C' | 'P';
    if (cliOrProv !== 'C' && cliOrProv !== 'P') {
      errors.push('clienteOProveedor en Domicilios debe ser "C" o "P" (longitud máxima 1).');
    }

    const defaultTipo = cliOrProv === 'C' ? 'E' : 'P';
    const tipoDom = (input.tipoDomicilio || defaultTipo).toUpperCase() as 'E' | 'F' | 'R' | 'P' | 'A';
    const validClientTypes = ['E', 'F', 'R'];
    const validSupplierTypes = ['P', 'A'];

    if (cliOrProv === 'C' && !validClientTypes.includes(tipoDom)) {
      errors.push(`Para clienteOProveedor="C", tipoDomicilio solo admite E, F o R (recibido: ${tipoDom}).`);
    }
    if (cliOrProv === 'P' && !validSupplierTypes.includes(tipoDom)) {
      errors.push(`Para clienteOProveedor="P", tipoDomicilio solo admite P o A (recibido: ${tipoDom}).`);
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    const normalized: SageAddressInput = {
      codigoEmpresa: Number(input.codigoEmpresa || 9999),
      codigoClienteProveedor: String(input.codigoClienteProveedor).slice(0, 15),
      clienteOProveedor: cliOrProv,
      tipoDomicilio: tipoDom,
      numeroDomicilio: input.numeroDomicilio ?? -1,
      nombre: input.nombre ? String(input.nombre).slice(0, 35) : undefined,
      razonSocial: input.razonSocial ? String(input.razonSocial).slice(0, 40) : undefined,
      razonSocial2: input.razonSocial2 ? String(input.razonSocial2).slice(0, 40) : undefined,
      domicilio: input.domicilio ? String(input.domicilio).slice(0, 40) : undefined,
      domicilio2: input.domicilio2 ? String(input.domicilio2).slice(0, 40) : undefined,
      codigoPostal: input.codigoPostal ? String(input.codigoPostal).slice(0, 8) : undefined,
      municipio: input.municipio ? String(input.municipio).slice(0, 25) : undefined,
      provincia: input.provincia ? String(input.provincia).slice(0, 20) : undefined,
      codigoNacion: typeof input.codigoNacion === 'number' ? Math.trunc(input.codigoNacion) : 108,
      siglaNacion: (input.siglaNacion || 'ES').slice(0, 2).toUpperCase(),
      telefono: input.telefono ? String(input.telefono).slice(0, 15) : undefined,
      principal: input.principal ?? 0,
      tipoImportacionIME: input.tipoImportacionIME ?? 0,
    };

    return { valid: true, errors: [], normalized };
  }

  /**
   * Valida las reglas de negocio de Movimientos de Stock (TmpIME_MovimientoStock, 35 campos):
   * - tipoMovimiento solo admite 1 o 2.
   * - serie y documento deben ir juntos o ninguno de los dos.
   * - almacenContrapartida !== codigoAlmacen.
   * - factorConversion_ nunca negativo.
   * - Si es traspaso entre almacenes (tipoMovimiento=2 + almacenContrapartida), unidades es POSITIVO y origenMovimiento="T".
   * - ejercicio y periodo se resuelven a valores reales (no -1).
   */
  public static validateAndNormalizeStockMovement(
    input: Partial<SageStockMovementInput>
  ): { valid: boolean; errors: string[]; normalized?: SageStockMovementInput } {
    const errors: string[] = [];

    if (input.tipoMovimiento !== 1 && input.tipoMovimiento !== 2) {
      errors.push('tipoMovimiento es obligatorio y solo admite 1 (Entrada) o 2 (Salida / Traspaso).');
    }

    if (!input.codigoArticulo) {
      errors.push('codigoArticulo es obligatorio para movimientos de stock.');
    }

    const codAlmacen = String(input.codigoAlmacen || '001').slice(0, 4);
    const contrapartida = input.almacenContrapartida ? String(input.almacenContrapartida).slice(0, 4) : undefined;

    if (contrapartida && contrapartida === codAlmacen) {
      errors.push(`HTTP 400: almacenContrapartida ('${contrapartida}') no puede coincidir con codigoAlmacen ('${codAlmacen}').`);
    }

    const hasSerie = Boolean(input.serie && String(input.serie).trim() !== '');
    const hasDoc = input.documento !== undefined && input.documento !== null;
    if (hasSerie !== hasDoc) {
      errors.push('HTTP 400: Los campos serie y documento deben enviarse juntos o ninguno de los dos.');
    }

    if (input.factorConversion_ !== undefined && input.factorConversion_ < 0) {
      errors.push('HTTP 400: factorConversion_ nunca puede ser negativo.');
    }

    let unidades = Number(input.unidades ?? 0);
    if (unidades === 0) {
      errors.push('Las unidades del movimiento de stock no pueden ser 0.');
    }

    // Regla oficial de signos de Sage 200:
    // - Entrada (tipoMovimiento=1): unidades positivas (+N)
    // - Salida simple (tipoMovimiento=2, sin almacenContrapartida): unidades negativas (-N)
    // - Traspaso (tipoMovimiento=2, CON almacenContrapartida): unidades POSITIVAS (+N) en una sola fila con origenMovimiento="T"
    if (input.tipoMovimiento === 1) {
      unidades = Math.abs(unidades);
    } else if (input.tipoMovimiento === 2) {
      unidades = contrapartida ? Math.abs(unidades) : -Math.abs(unidades);
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    const now = new Date();
    const realYear = input.ejercicio && input.ejercicio > 0 ? input.ejercicio : now.getFullYear();
    const realMonth = input.periodo && input.periodo > 0 ? input.periodo : now.getMonth() + 1;

    const normalized: SageStockMovementInput = {
      codigoEmpresa: Number(input.codigoEmpresa || 9999),
      tipoMovimiento: input.tipoMovimiento as 1 | 2,
      codigoArticulo: String(input.codigoArticulo).slice(0, 20),
      codigoAlmacen: codAlmacen,
      ...(contrapartida ? { almacenContrapartida: contrapartida, origenMovimiento: input.origenMovimiento || 'T' } : {}),
      unidades,
      ejercicio: realYear,
      periodo: realMonth,
      fecha: MappingEngine.formatDate(input.fecha || now, 'DATE_ONLY'),
      ...(hasSerie && hasDoc ? { serie: String(input.serie).slice(0, 10), documento: Number(input.documento) } : {}),
      unidadMedida1_: input.unidadMedida1_ ? String(input.unidadMedida1_) : 'UND',
      factorConversion_: input.factorConversion_ ?? 1,
      comentario: input.comentario ? String(input.comentario).slice(0, 40) : undefined,
      tipoImportacionIME: input.tipoImportacionIME ?? 0,
    };

    return { valid: true, errors: [], normalized };
  }

  public static validateAndNormalizeInventory(
    input: Partial<SageInventoryInput>
  ): { valid: boolean; errors: string[]; normalized?: SageInventoryInput } {
    const errors: string[] = [];
    if (!input.inventario) errors.push('El código de inventario (máx 10) es obligatorio.');
    if (!input.codigoArticulo) errors.push('codigoArticulo es obligatorio.');
    if (input.unidadesInventario === undefined) errors.push('unidadesInventario (cantidad contada) es obligatorio.');

    if (errors.length > 0) return { valid: false, errors };

    return {
      valid: true,
      errors: [],
      normalized: {
        codigoEmpresa: Number(input.codigoEmpresa || 9999),
        inventario: String(input.inventario).slice(0, 10),
        codigoArticulo: String(input.codigoArticulo).slice(0, 20),
        codigoAlmacen: String(input.codigoAlmacen || '001').slice(0, 4),
        unidadesStock: Number(input.unidadesStock ?? 0),
        unidadesInventario: Number(input.unidadesInventario),
        fechaInventario: MappingEngine.formatDate(input.fechaInventario || new Date(), 'DATE_ONLY'),
        regularizarInventario: input.regularizarInventario ?? -1,
        actualizarStock: input.actualizarStock ?? -1,
        factorConversion_: Math.max(0, Number(input.factorConversion_ ?? 1)),
        tipoImportacionIME: input.tipoImportacionIME ?? 0,
      },
    };
  }
}
