export type SageTaskStatusGraphQL = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type SageTaskStatusRestCode = 0 | 1 | 2 | 3 | 4;

export type SageDocumentTypeCode =
  | 'PVE' // Pedido de Venta -> CabeceraPedidoCliente (PEDIDOS_CLI)
  | 'ALC' // Albarán de Venta -> CabeceraAlbaranCliente (ALBARAN_CLI)
  | 'FAC' // Factura de Venta -> ResumenCliente (FACTURAS_EMI)
  | 'OFE' // Oferta de Venta -> CabeceraOfertaCliente (OFERTA_CLI)
  | 'FPC' // Contrato de Venta -> CabeceraContratoCliente (CONTRATO_CLI)
  | 'PCO' // Pedido de Compra -> CabeceraPedidoProveedor (PEDIDOS_PRO)
  | 'ALP' // Albarán de Compra -> CabeceraAlbaranProveedor (ALBARAN_PRO)
  | 'FAP' // Factura de Compra -> ResumenProveedor (FACTURAS_REC)
  | 'OFC' // Oferta de Compra -> CabeceraOfertaProveedor (OFERTA_PRO)
  | 'FPP'; // Contrato de Compra -> CabeceraContratoProveedor (CONTRATO_PRO)

export type SageTipoImportacionIME = 0 | 1 | 2 | 3; // 0=Alta, 1=Borrar, 2=Modificar, 3=Desactivar

export type SageImportEntity =
  | 'Documents'
  | 'ClientesProveedores'
  | 'Domicilios'
  | 'Products'
  | 'StockMovements'
  | 'Inventories';

export type SageOAuthScope = 'rest:read' | 'rest:write' | 'graphql:query' | 'graphql:mutate' | 'admin';

export interface SageImportTaskResponse {
  taskId: string;
  status: SageTaskStatusGraphQL | SageTaskStatusRestCode | string;
  errorMessage?: string | null;
  errorDetails?: string | null;
  createdAt?: string;
  completedAt?: string;
  warningNotice?: string;
}

export interface SageDocumentLineInput {
  orden: number; // 1..9999 obligatorio
  codigoArticulo: string; // máx 20 obligatorio
  unidades: number; // obligatorio, no-cero
  codigoAlmacen?: string; // máx 4
  almacenContrapartida?: string; // máx 4
  descripcionArticulo?: string; // máx 50
  descripcion2Articulo?: string; // máx 40
  descripcionLinea?: string; // máx 200 (más se rechaza)
  codigoFamilia?: string; // máx 10
  codigoSubfamilia?: string; // máx 10
  unidadMedida1_?: string; // máx 10
  factorConversion_?: number; // default 1
  ivaIncluido?: number; // -1..1
  codigoColor_?: string; // máx 10
  grupoTalla_?: number;
  codigoTalla01_?: string; // máx 10
  grupoIva?: number;
  codigoIva?: number;
  precio?: number;
  porcentajeDescuento?: number; // 0..100
  porcentajeDescuento2?: number;
  porcentajeDescuento3?: number;
  porcentajeIva?: number; // 0..100
  porcentajeRecargo?: number;
  tipoArticulo?: string; // máx 1, default 'M'
  reservarStock_?: number;
  fechaCaduca?: string; // YYYY-MM-DD sin hora
}

export interface SageDocumentHeaderInput {
  codigoEmpresa: number; // 1..9999 obligatorio
  codigoDocumentoLc: SageDocumentTypeCode; // 3 chars obligatorio
  ejercicioDocumento: number; // 2020..2150 obligatorio
  serieDocumento?: string; // máx 10
  numeroDocumento?: number; // 0 = DameContador
  tipoImportacionIME?: SageTipoImportacionIME; // default 0 (Alta)
  fechaDocumento: string; // YYYY-MM-DD sin hora obligatorio
  fechaEntrega: string; // YYYY-MM-DD sin hora obligatorio (>= fechaDocumento)
  codigoCliente?: string; // máx 15 (obligatorio en venta)
  codigoProveedor?: string; // máx 15 (obligatorio en compra)
  cifDni?: string; // máx 13
  cifEuropeo?: string; // máx 15
  razonSocial?: string; // máx 40
  razonSocial2?: string; // máx 40
  nombre?: string; // máx 35
  domicilio?: string; // máx 40
  domicilio2?: string; // máx 40
  codigoPostal?: string; // máx 8
  codigoMunicipio?: string; // máx 7
  municipio?: string; // máx 25
  codigoProvincia?: string; // máx 5
  provincia?: string; // máx 20
  codigoNacion?: number; // INT, default 108 (España)
  nacion?: string; // máx 25
  razonSocialEnvios?: string; // máx 40
  nombreEnvios?: string; // máx 35
  domicilioEnvios?: string; // máx 40
  codigoPostalEnvios?: string; // máx 8
  municipioEnvios?: string; // máx 25
  provinciaEnvios?: string; // máx 20
  codigoNacionEnvios?: number; // INT, default 108
  formaDePago?: string; // máx 35 (D mayúscula en Documentos)
  codigoCondiciones?: number;
  codigoMoneda?: string; // máx 3 (ej. 'EUR')
  factorCambio?: number;
  suPedidoWeb?: number; // INT (no es string)
  observaciones?: string;
  lineas: SageDocumentLineInput[];
}

export interface SageCustomerSupplierInput {
  codigoEmpresa: number; // 1..9999 obligatorio
  clienteOProveedor: 'C' | 'P'; // máx 1 obligatorio
  cifDni: string; // máx 13 obligatorio
  codigoClienteProveedor?: string; // máx 15 (o '-1' si automático)
  usarContadorSage?: 0 | 1; // 0=Manual, 1=Auto
  codigoCuenta?: string; // máx 15
  cifEuropeo?: string; // máx 15
  personaFisicaJuridica?: 'F' | 'J'; // default 'F'
  tipoCif?: string; // default 'C'
  siglaNacion?: string; // máx 2, default 'ES'
  indicadorIva?: string; // default 'I'
  razonSocial?: string; // máx 40
  razonSocial2?: string; // máx 40
  nombre?: string; // máx 35
  domicilio?: string; // máx 40
  domicilio2?: string; // máx 40
  viaPublica?: string; // máx 40
  codigoPostal?: string; // máx 8
  codigoMunicipio?: string; // máx 7
  municipio?: string; // máx 25
  codigoProvincia?: string; // máx 5
  provincia?: string; // máx 20
  codigoNacion?: number; // SHORT INT, default 108
  telefono?: string; // máx 15
  telefono2?: string; // máx 15
  email1?: string; // máx 250
  email2?: string; // máx 250
  iban?: string; // máx 34
  formadePago?: string; // máx 35 (d minúscula en ClientesProveedores)
  codigoCategoriaCliente?: string; // máx 10, default 'CLI'
  observacionesCliente?: string; // máx 50
  comentarios?: string;
  tipoImportacionIME?: SageTipoImportacionIME;
}

export interface SageAddressInput {
  codigoEmpresa: number; // 1..9999 obligatorio
  codigoClienteProveedor: string; // máx 15 obligatorio
  clienteOProveedor?: 'C' | 'P'; // máx 1, default 'C'
  tipoDomicilio?: 'E' | 'F' | 'R' | 'P' | 'A'; // Cliente: E/F/R, Proveedor: P/A, default 'E'
  numeroDomicilio?: number; // short, -1 = auto
  nombre?: string; // máx 35
  razonSocial?: string; // máx 40
  razonSocial2?: string; // máx 40
  domicilio?: string; // máx 40
  domicilio2?: string; // máx 40
  viaPublica?: string; // máx 40
  codigoPostal?: string; // máx 8
  codigoMunicipio?: string; // máx 7
  municipio?: string; // máx 25
  codigoProvincia?: string; // máx 5
  provincia?: string; // máx 20
  codigoNacion?: number; // SHORT INT, default 108
  nacion?: string; // máx 25
  siglaNacion?: string; // máx 2, default 'ES'
  telefono?: string; // máx 15
  principal?: 0 | 1;
  tipoImportacionIME?: SageTipoImportacionIME;
}

export interface SageItemInput {
  codigoEmpresa: number; // 1..9999 obligatorio
  descripcionArticulo: string; // máx 50 obligatorio
  codigoArticulo?: string; // máx 20 (vacío autogenera con DameContador)
  tipoArticulo?: string; // máx 1, default 'M'
  tipoImportacionIME?: SageTipoImportacionIME;
  descripcion2Articulo?: string; // máx 40
  descripcionLinea?: string;
  comentarioArticulo?: string;
  marcaProducto?: string; // máx 20
  codigoAlternativo?: string; // máx 20
  codigoArancelario?: string; // máx 12
  codigoFamilia?: string; // máx 10
  codigoSubfamilia?: string; // máx 10
  colores_?: 0 | -1; // booleano Sage: 0 no, -1 sí
  grupoTalla_?: number;
  precioCompra?: number;
  precioVenta?: number;
  stockMinimo?: number;
  stockMaximo?: number;
  pesoBrutoUnitario_?: number;
  pesoNetoUnitario_?: number;
  obsoletoLc?: 0 | -1; // 0=Activo, -1=Obsoleto
}

export interface SageStockMovementInput {
  codigoEmpresa: number; // obligatorio
  tipoMovimiento: 1 | 2; // obligatorio: solo 1 (entrada) o 2 (salida / traspaso)
  codigoArticulo: string; // máx 20
  codigoAlmacen: string; // máx 4
  almacenContrapartida?: string; // máx 4 (distinto de codigoAlmacen; si existe es traspaso)
  unidades: number; // positivo en entrada y traspaso; negativo en salida simple
  ejercicio?: number; // enviar real, no confiar en -1
  periodo?: number; // enviar real, no confiar en -1
  fecha?: string; // YYYY-MM-DD
  serie?: string; // máx 10 (va junto con documento o ninguno)
  documento?: number;
  unidadMedida1_?: string; // máx 10
  factorConversion_?: number; // >= 0
  precio?: number;
  importe?: number;
  comentario?: string; // máx 40
  origenMovimiento?: string; // 'T' en traspaso
  tipoImportacionIME?: SageTipoImportacionIME;
}

export interface SageInventoryInput {
  codigoEmpresa: number; // obligatorio
  inventario: string; // máx 10 obligatorio
  codigoArticulo: string; // máx 20
  codigoAlmacen: string; // máx 4
  unidadesStock?: number; // lo que Sage creía tener
  unidadesInventario: number; // lo contado
  precioMedio?: number;
  fechaInventario?: string; // YYYY-MM-DD
  regularizarInventario?: 0 | -1; // 0 no, -1 sí
  actualizarStock?: 0 | -1; // 0 no, -1 sí
  factorConversion_?: number; // >= 0
  tipoImportacionIME?: SageTipoImportacionIME;
}
