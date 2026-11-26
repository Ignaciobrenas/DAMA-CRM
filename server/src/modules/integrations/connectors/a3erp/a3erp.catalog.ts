import { A3ErpCustomGroup, A3ErpReadProcName } from './a3erp.types';
import { MappingFieldRule } from '../../core/mapping-engine';

export interface A3ErpProcCatalogEntry {
  proc: A3ErpReadProcName;
  openApiSchema: string;
  category: 'catalog' | 'stock' | 'customers' | 'suppliers' | 'sales' | 'purchases' | 'masters';
  description: string;
  mandatoryParameters?: string[];
  optionalParameters?: string[];
  pluralUrlWarning?: boolean;
}

export interface A3ErpCustomWriteCatalogEntry {
  group: A3ErpCustomGroup;
  action: string;
  path: string;
  linesField?: string;
  description: string;
  knownQuirk?: string;
}

export const A3ERP_READ_PROCS_CATALOG: A3ErpProcCatalogEntry[] = [
  {
    proc: 'Articulos',
    openApiSchema: 'Articulo',
    category: 'catalog',
    description: 'Catálogo maestro de artículos, precios (PRCVENTA/PRCSTANDARD) y stock total (UNIDADESSTOCK).',
    optionalParameters: ['codart', 'codfamest', 'car1', 'car2', 'car3', 'car4', 'car5', 'car6', 'car7', 'car8', 'car9', 'car10'],
  },
  {
    proc: 'Stock',
    openApiSchema: 'Stock',
    category: 'stock',
    description: 'Stock por artículo y almacén (UNIDADES, DISPONIBLE, PENDIENTESERVIR, PENDIENTERECIBIR, PRCMEDIO).',
    optionalParameters: ['codart', 'codalm', 'soloconstock'],
  },
  {
    proc: 'StockTallas',
    openApiSchema: 'StockTallas',
    category: 'stock',
    description: 'Stock desglosado por dimensiones de variante (CODTALLAH/CODTALLAV). Incluye fila resumen a filtrar.',
    optionalParameters: ['codart', 'codalm', 'soloconstock'],
  },
  {
    proc: 'MovimientosStock',
    openApiSchema: 'MovimientosStock',
    category: 'stock',
    description: 'Histórico de entradas, salidas y traspasos de almacén.',
    mandatoryParameters: ['fecha'],
    optionalParameters: ['codart', 'codalm'],
  },
  {
    proc: 'Clientes',
    openApiSchema: 'Cliente',
    category: 'customers',
    description: 'Maestro de clientes (CODCLI 8 cuadrado, NIFCLI, NOMCLI, RAZON, TIPIVA, TARIFA, FORPAG, DOCPAG).',
  },
  {
    proc: 'ClientesPorNif',
    openApiSchema: 'Cliente',
    category: 'customers',
    description: 'Búsqueda exacta de clientes por NIF en cabecera Parameters.',
    mandatoryParameters: ['nifcli'],
  },
  {
    proc: 'DireccionesEntrega',
    openApiSchema: 'DireccionEntrega',
    category: 'customers',
    description: 'Direcciones de entrega por cliente (IDDIRENT, CODCLI, NUMDIR, DEFECTO).',
  },
  {
    proc: 'Proveedores',
    openApiSchema: 'Proveedor',
    category: 'suppliers',
    description: 'Maestro de proveedores (CODPRO 8 cuadrado, NIFPRO, NOMPRO, TIPIVA).',
  },
  {
    proc: 'Personas',
    openApiSchema: 'Persona',
    category: 'masters',
    description: 'Fichas de personas físicas / contactos internos y comerciales (CODPER 8 cuadrado).',
  },
  {
    proc: 'PedidosVenta',
    openApiSchema: 'PedidoVenta',
    category: 'sales',
    description: 'Cabeceras de pedidos de venta (IDPEDV, SERIE, NUMDOC, REFERENCIA, CODCLI, SITUACION, TOTDOC).',
  },
  {
    proc: 'LineasPedidosVenta',
    openApiSchema: 'LineaPedidoVenta',
    category: 'sales',
    description: 'Líneas de pedidos de venta (IDLIN, IDPEDV, CODART, UNIDADES, PRCMONEDA, TIPIVA).',
  },
  {
    proc: 'AlbaranesVenta',
    openApiSchema: 'AlbaranVenta',
    category: 'sales',
    description: 'Cabeceras de albaranes de entrega de venta (IDALBV, CODCLI, NUMDOC, SERIE, FECHA).',
  },
  {
    proc: 'LineasAlbaranesVenta',
    openApiSchema: 'LineaAlbaranVenta',
    category: 'sales',
    description: 'Líneas de albaranes de venta (IDALBV, IDLIN, CODART, UNIDADES, NUMLINALB).',
  },
  {
    proc: 'FacturasVenta',
    openApiSchema: 'FacturaVenta',
    category: 'sales',
    description: 'Cabeceras de facturas emitidas de venta (IDFACV, CODCLI, BASEBRUTAIVA1..4, TOTAPAGAR).',
  },
  {
    proc: 'LineasFacturasVenta',
    openApiSchema: 'LineaFacturaVenta',
    category: 'sales',
    description: 'Líneas de facturas de venta (IDFACV, IDLIN, CODART, UNIDADES, NUMLINFAC).',
  },
  {
    proc: 'PedidosCompra',
    openApiSchema: 'PedidoCompra',
    category: 'purchases',
    description: 'Cabeceras de pedidos de compra a proveedor (IDPEDC, CODPRO, NUMDOC).',
  },
  {
    proc: 'LineasPedidosCompra',
    openApiSchema: 'LineaPedidoCompra',
    category: 'purchases',
    description: 'Líneas de pedidos de compra (IDPEDC, IDLIN, CODART, UNIDADES).',
  },
  {
    proc: 'AlbaranesCompra',
    openApiSchema: 'AlbaranCompra',
    category: 'purchases',
    description: 'Cabeceras de albaranes de compra (IDALBC, CODPRO, REGIVA="CNAC").',
  },
  {
    proc: 'LineasAlbaranesCompra',
    openApiSchema: 'LineaAlbaranCompra',
    category: 'purchases',
    description: 'Líneas de albaranes de compra (IDALBC, IDLIN, CODART).',
  },
  {
    proc: 'FacturasCompra',
    openApiSchema: 'FacturaCompra',
    category: 'purchases',
    description: 'Cabeceras de facturas de compra recibidas (IDFACC, CODPRO, TOTDOC).',
  },
  {
    proc: 'LineasFacturasCompra',
    openApiSchema: 'LineaFacturaCompra',
    category: 'purchases',
    description: 'Líneas de facturas de compra (IDFACC, IDLIN, CODART, NUMLINFAC).',
  },
  {
    proc: 'Almacenes',
    openApiSchema: 'Almacen',
    category: 'masters',
    description: 'Catálogo de almacenes (CODALM 8 cuadrado, DESCALM, STOCKNEG).',
  },
  {
    proc: 'Series',
    openApiSchema: 'Serie',
    category: 'masters',
    description: 'Series de facturación y documentos (SERIE 8 cuadrado o "BORRADOR", NOMSERIE).',
  },
  {
    proc: 'Tarifas',
    openApiSchema: 'Tarifa',
    category: 'masters',
    description: 'Maestro de tarifas (TARIFA 8 cuadrado, DESCTARIFA, TIPO).',
  },
  {
    proc: 'TarifasVenta',
    openApiSchema: 'TarifaVenta',
    category: 'masters',
    description: 'Precios por artículo y tarifa con escalado por unidades (IDTARIFAV, CODART, TARIFA, PRECIO).',
    pluralUrlWarning: true,
  },
  {
    proc: 'TiposIVA',
    openApiSchema: 'TiposIVA',
    category: 'masters',
    description: 'Tipos impositivos de IVA (TIPIVA: ORD21, ORD10, ORD4, EXE; PORIVA %).',
  },
  {
    proc: 'TiposContables',
    openApiSchema: 'TipoContable',
    category: 'masters',
    description: 'Tipos contables multiempresa (TIPOCONT no cuadrado, NOMTIPO).',
    pluralUrlWarning: true,
  },
  {
    proc: 'FormasPago',
    openApiSchema: 'FormaPago',
    category: 'masters',
    description: 'Formas de pago y vencimientos (FORPAG 8 cuadrado, DESCFOR).',
  },
  {
    proc: 'DocumentosPago',
    openApiSchema: 'DocumentoPago',
    category: 'masters',
    description: 'Tipos de documento de pago (DOCPAG, DESCDOC, METALICO).',
  },
  {
    proc: 'Representantes',
    openApiSchema: 'Representante',
    category: 'masters',
    description: 'Agentes comerciales y representantes (CODREP 8 cuadrado, NOMREP).',
  },
  {
    proc: 'Familias',
    openApiSchema: 'Familias',
    category: 'masters',
    description: 'Familias estadísticas y de comisiones/descuentos (CODFAM, DESCFAM, FICHERO).',
  },
  {
    proc: 'Descuentos',
    openApiSchema: 'Descuento',
    category: 'masters',
    description: 'Reglas de descuento por cliente, artículo o familia (DESC1..4 %).',
  },
  {
    proc: 'Bancos',
    openApiSchema: 'Banco',
    category: 'masters',
    description: 'Entidades bancarias y cajas (CODBAN 8 cuadrado, NOMBAN).',
  },
  {
    proc: 'PreciosEspeciales',
    openApiSchema: 'PrecioEspecial',
    category: 'masters',
    description: 'Precios fijos pactados por cliente/artículo/familia (IDPRCESP, PRECIO).',
    pluralUrlWarning: true,
  },
  {
    proc: 'Carteras',
    openApiSchema: 'Cartera',
    category: 'masters',
    description: 'Efectos y vencimientos de cobro/pago (IDCARTERA, COBPAG "C"/"P", IMPORTE, PAGADO).',
    pluralUrlWarning: true,
  },
  {
    proc: 'Replog',
    openApiSchema: 'Replog',
    category: 'masters',
    description: 'Log interno de cambios por tabla y movimiento (ALTA/MOD/BAJA) que alimenta FECHAMODIFICACION.',
    mandatoryParameters: ['fecha'],
    optionalParameters: ['tabla', 'idreg1', 'idreg2', 'idreg3'],
  },
];

export const A3ERP_WRITE_CUSTOM_CATALOG: A3ErpCustomWriteCatalogEntry[] = [
  // Pedidos (6)
  { group: 'Pedidos', action: 'AltaPedidoVenta', path: '/api/custom/Pedidos/AltaPedidoVenta', linesField: 'PEDIDOVENTALINEAS', description: 'Alta asíncrona de pedido de venta.' },
  { group: 'Pedidos', action: 'ModificaPedidoVenta', path: '/api/custom/Pedidos/ModificaPedidoVenta', linesField: 'PEDIDOVENTALINEAS', description: 'Modificación de pedido de venta por IDPEDV.', knownQuirk: 'Omitir IVAINCLUIDO si el pedido ya tiene líneas.' },
  { group: 'Pedidos', action: 'EliminaPedidoVenta', path: '/api/custom/Pedidos/EliminaPedidoVenta', linesField: 'PEDIDOVENTALINEAS', description: 'Eliminación de pedido de venta enviando el documento completo.' },
  { group: 'Pedidos', action: 'AltaPedidoCompra', path: '/api/custom/Pedidos/AltaPedidoCompra', linesField: 'PEDIDOVENTALINEAS', description: 'Alta de pedido de compra a proveedor.', knownQuirk: 'El schema OpenAPI mantiene el nombre de array PEDIDOVENTALINEAS.' },
  { group: 'Pedidos', action: 'ModificaPedidoCompra', path: '/api/custom/Pedidos/ModificaPedidoCompra', linesField: 'PEDIDOVENTALINEAS', description: 'Modificación de pedido de compra por IDPEDC.' },
  { group: 'Pedidos', action: 'EliminaPedidoCompra', path: '/api/custom/Pedidos/EliminaPedidoCompra', linesField: 'PEDIDOVENTALINEAS', description: 'Eliminación de pedido de compra.' },

  // Albaranes (7)
  { group: 'Albaranes', action: 'AltaAlbaranVenta', path: '/api/custom/Albaranes/AltaAlbaranVenta', linesField: 'ALBARANVENTALINEAS', description: 'Alta de albarán de venta (se marca como servido al crearse).' },
  { group: 'Albaranes', action: 'ModificaAlbaranVenta', path: '/api/custom/Albaranes/ModificaAlbaranVenta', linesField: 'ALBARANVENTALINEAS', description: 'Modificación de albarán de venta.', knownQuirk: 'Rechaza edición si el documento ya está servido.' },
  { group: 'Albaranes', action: 'EliminaAlbaranVenta', path: '/api/custom/Albaranes/EliminaAlbaranVenta', linesField: 'ALBARANVENTALINEAS', description: 'Eliminación de albarán de venta.', knownQuirk: 'No permite borrar si el albarán está servido.' },
  { group: 'Albaranes', action: 'FacturaAlbaranVenta', path: '/api/custom/Albaranes/FacturaAlbaranVenta', description: 'Convierte un albarán de venta existente (IDDOCU) en factura (IDFACV + FACTURAPDF).' },
  { group: 'Albaranes', action: 'AltaAlbaranCompra', path: '/api/custom/Albaranes/AltaAlbaranCompra', linesField: 'ALBARANCOMPRALINEAS', description: 'Alta de albarán de recepción de compra.' },
  { group: 'Albaranes', action: 'ModificaAlbaranCompra', path: '/api/custom/Albaranes/ModificaAlbaranCompra', linesField: 'ALBARANCOMPRALINEAS', description: 'Modificación de albarán de compra.' },
  { group: 'Albaranes', action: 'EliminaAlbaranCompra', path: '/api/custom/Albaranes/EliminaAlbaranCompra', linesField: 'ALBARANCOMPRALINEAS', description: 'Eliminación de albarán de compra.' },

  // Facturas (8)
  { group: 'Facturas', action: 'AltaFacturaVenta', path: '/api/custom/Facturas/AltaFacturaVenta', linesField: 'FACTURAVENTALINEAS', description: 'Alta de factura de venta.', knownQuirk: 'CONTABLE, CONREPER y CONVENCIM son calculados y no deben enviarse.' },
  { group: 'Facturas', action: 'ModificaFacturaVenta', path: '/api/custom/Facturas/ModificaFacturaVenta', linesField: 'FACTURAVENTALINEAS', description: 'Modificación de factura de venta por IDFACV.' },
  { group: 'Facturas', action: 'EliminaFacturaVenta', path: '/api/custom/Facturas/EliminaFacturaVenta', linesField: 'FACTURAVENTALINEAS', description: 'Eliminación de factura de venta.' },
  { group: 'Facturas', action: 'ImprimeFacturaVenta', path: '/api/custom/Facturas/ImprimeFacturaVenta', description: 'Genera el PDF en bytes (FACTURAPDF) de una factura de venta {IDFACV}.' },
  { group: 'Facturas', action: 'AltaFacturaCompra', path: '/api/custom/Facturas/AltaFacturaCompra', linesField: 'FACTURACOMPRALINEAS', description: 'Alta de factura de compra (sin campos Facturae/AEAT).' },
  { group: 'Facturas', action: 'ModificaFacturaCompra', path: '/api/custom/Facturas/ModificaFacturaCompra', linesField: 'FACTURACOMPRALINEAS', description: 'Modificación de factura de compra por IDFACC.' },
  { group: 'Facturas', action: 'EliminaFacturaCompra', path: '/api/custom/Facturas/EliminaFacturaCompra', linesField: 'FACTURACOMPRALINEAS', description: 'Eliminación de factura de compra.' },
  { group: 'Facturas', action: 'ImprimeFacturaCompra', path: '/api/custom/Facturas/ImprimeFacturaCompra', description: 'Impresión PDF de factura de compra {IDFACC}.' },

  // Clientes, Contactos y Direcciones (9)
  { group: 'Clientes', action: 'AltaCliente', path: '/api/custom/Clientes/AltaCliente', description: 'Alta de cliente. Devuelve CODCLI asignado en Response.SingleObj.CODCLI.' },
  { group: 'Clientes', action: 'ModificaCliente', path: '/api/custom/Clientes/ModificaCliente', description: 'Modificación de ficha completa de cliente.' },
  { group: 'Clientes', action: 'EliminaCliente', path: '/api/custom/Clientes/EliminaCliente', description: 'Baja de cliente (falla por FK si tiene documentos; mitigar con OBSOLETO="T", BLOQUEADO="T").' },
  { group: 'Clientes', action: 'AltaContactoCliente', path: '/api/custom/Clientes/AltaContactoCliente', description: 'Alta de contacto asociado a ENTIDAD (CODCLI/CODPRO cuadrado).' },
  { group: 'Clientes', action: 'ModificaContactoCliente', path: '/api/custom/Clientes/ModificaContactoCliente', description: 'Modificación de contacto de cliente.' },
  { group: 'Clientes', action: 'EliminaContactoCliente', path: '/api/custom/Clientes/EliminaContactoCliente', description: 'Eliminación de contacto de cliente.', knownQuirk: 'Quirk del OpenAPI oficial: su schema referencia Direccion en lugar de Contacto.' },
  { group: 'Clientes', action: 'AltaDireccion', path: '/api/custom/Clientes/AltaDireccion', description: 'Alta de dirección de entrega.', knownQuirk: 'Deshabilitado por defecto (autoCreate.address.enabled=false) por fallo NuevoCodigoNum/cdsDIRENT en servidores antiguos; usar OBSERVACIONES.' },
  { group: 'Clientes', action: 'ModificaDireccion', path: '/api/custom/Clientes/ModificaDireccion', description: 'Modificación de dirección de entrega por CODCLI+NUMDIR.' },
  { group: 'Clientes', action: 'EliminaDireccion', path: '/api/custom/Clientes/EliminaDireccion', description: 'Eliminación de dirección de entrega.' },

  // Artículos (3)
  { group: 'Articulos', action: 'AltaArticulo', path: '/api/custom/Articulos/AltaArticulo', description: 'Alta de artículo en catálogo.' },
  { group: 'Articulos', action: 'ModificaArticulo', path: '/api/custom/Articulos/ModificaArticulo', description: 'Modificación de artículo.' },
  { group: 'Articulos', action: 'EliminaArticulo', path: '/api/custom/Articulos/EliminaArticulo', description: 'Eliminación de artículo.' },

  // Proveedores (3)
  { group: 'Proveedores', action: 'AltaProveedor', path: '/api/custom/Proveedores/AltaProveedor', description: 'Alta de proveedor (incluye domicilio fiscal DIRFISCAL/DTOFISCAL).' },
  { group: 'Proveedores', action: 'ModificaProveedor', path: '/api/custom/Proveedores/ModificaProveedor', description: 'Modificación de proveedor (reutiliza schema AltaProveedor).' },
  { group: 'Proveedores', action: 'EliminaProveedor', path: '/api/custom/Proveedores/EliminaProveedor', description: 'Eliminación de proveedor.' },

  // Personas (3)
  { group: 'Personas', action: 'AltaPersona', path: '/api/custom/Personas/AltaPersona', description: 'Alta de persona/comercial (CODPER 8 cuadrado).' },
  { group: 'Personas', action: 'ModificaPersona', path: '/api/custom/Personas/ModificaPersona', description: 'Modificación de persona.' },
  { group: 'Personas', action: 'EliminaPersona', path: '/api/custom/Personas/EliminaPersona', description: 'Eliminación de persona.' },

  // Auxiliares (2)
  { group: 'Auxiliares', action: 'AltaSerie', path: '/api/custom/Auxiliares/AltaSerie', description: 'Alta de serie de numeración (SERIE 8 cuadrado, NOMSERIE, NUMEROINICIAL).' },
  { group: 'Auxiliares', action: 'AltaCentroCoste', path: '/api/custom/Auxiliares/AltaCentroCoste', description: 'Alta de centro de coste analítico (CENTROCOSTE, DESCCENTRO, APLINIVEL1..3).' },
];

export const DEFAULT_A3ERP_ORDER_HEADER_RULES: MappingFieldRule[] = [
  { to: 'FECHA', from: 'sourceCreatedAt', operations: [{ type: 'formatDate', format: 'ISO_LOCAL' }] },
  { to: 'REFERENCIA', from: 'orderNumber', maxLength: 30 },
  { to: 'NIFCLI', from: 'customer.nifCif', operations: [{ type: 'uppercase' }, { type: 'normalizeNif' }] },
  { to: 'NOMCLI', from: ['billingAddress.firstName', 'billingAddress.lastName'], maxLength: 40 },
  { to: 'RAZON', from: [['billingAddress.company'], ['billingAddress.firstName', 'billingAddress.lastName']], maxLength: 40 },
  { to: 'DIRCLI', from: 'billingAddress.street1', maxLength: 40 },
  { to: 'POBCLI', from: 'billingAddress.city', maxLength: 25 },
  { to: 'TELCLI', from: 'billingAddress.phone', maxLength: 15 },
  { to: 'EMAIL', from: 'customer.email', maxLength: 50 },
];

export const DEFAULT_A3ERP_LINE_RULES: MappingFieldRule[] = [
  { to: 'CODART', from: 'codigoArticulo' },
  { to: 'DESCLIN', from: 'name', maxLength: 200 },
  { to: 'UNIDADES', from: 'quantity', min: 0.01, max: 999999.99, settings: { type: 'number' } },
  { to: 'PRCMONEDAMASIVA', from: 'unitPrice', min: -999999.99, max: 999999.99, settings: { type: 'number' } },
];
