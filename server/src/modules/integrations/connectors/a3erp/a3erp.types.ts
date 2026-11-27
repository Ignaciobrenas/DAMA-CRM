export type A3ErpBoolean = 'T' | 'F';

export interface A3ErpLoginRequest {
  UserId: string;
  Password: string;
}

export interface A3ErpPaginationHeader {
  TotalCount: number;
  PageSize: number;
  CurrentPage: number;
  TotalPages: number;
  HasNextPage: boolean;
  HasPreviousPage: boolean;
}

export interface A3ErpTaskPostResponse {
  TaskId: number;
  ItemsBefore: number;
}

export interface A3ErpTaskPollResponse<T = Record<string, any>> {
  TaskId?: number;
  ItemsBefore?: number;
  Response?: {
    SingleObj?: T;
  };
  ErrorResponse?: {
    SingleObj?: {
      Message: string;
    };
  };
}

export type A3ErpReadProcName =
  | 'Articulos'
  | 'Stock'
  | 'StockTallas'
  | 'MovimientosStock'
  | 'Clientes'
  | 'ClientesPorNif'
  | 'DireccionesEntrega'
  | 'Proveedores'
  | 'Personas'
  | 'PedidosVenta'
  | 'LineasPedidosVenta'
  | 'AlbaranesVenta'
  | 'LineasAlbaranesVenta'
  | 'FacturasVenta'
  | 'LineasFacturasVenta'
  | 'PedidosCompra'
  | 'LineasPedidosCompra'
  | 'AlbaranesCompra'
  | 'LineasAlbaranesCompra'
  | 'FacturasCompra'
  | 'LineasFacturasCompra'
  | 'Almacenes'
  | 'Series'
  | 'Tarifas'
  | 'TarifasVenta'
  | 'TiposIVA'
  | 'TiposContables'
  | 'FormasPago'
  | 'DocumentosPago'
  | 'Representantes'
  | 'Familias'
  | 'Descuentos'
  | 'Bancos'
  | 'PreciosEspeciales'
  | 'Carteras'
  | 'Replog';

export type A3ErpCustomGroup =
  | 'Pedidos'
  | 'Albaranes'
  | 'Facturas'
  | 'Clientes'
  | 'Articulos'
  | 'Proveedores'
  | 'Personas'
  | 'Auxiliares';

export interface A3ErpArticulo {
  CODART: string; // 15 cuadrado
  ID: number;
  DESCART: string;
  CODFAMEST?: string | null;
  CAR1?: string | null;
  CAR2?: string | null;
  CAR3?: string | null;
  CAR4?: string | null;
  CAR5?: string | null;
  CAR6?: string | null;
  CAR7?: string | null;
  CAR8?: string | null;
  CAR9?: string | null;
  CAR10?: string | null;
  PRCVENTA: number;
  PRCSTANDARD: number;
  ULTPRCCOM?: number;
  PRCCOSTE?: number;
  PRCMINIMO?: number;
  TIPIVA: string;
  TIPIVACOMPRAS?: string;
  OBSOLETO: A3ErpBoolean;
  BLOQUEADO: A3ErpBoolean;
  PESO?: number;
  VOLUMEN?: number;
  TALLAS: string; // "F" = simple, otro = con variantes
  ESKIT?: A3ErpBoolean;
  ESVENTA?: A3ErpBoolean;
  ESCOMPONENTE?: A3ErpBoolean;
  ESACABADO?: A3ErpBoolean;
  CODPRO?: string | null; // 8 cuadrado
  TIPOUNIDAD?: string;
  AFESTOCK?: A3ErpBoolean;
  UNIDADESSTOCK: number;
  FECALTA?: string;
  FECHAMODIFICACION?: string;
  grupoTalla_?: Record<string, any>;
  coloresDisponibles?: Array<{ codigoColor_: string; color?: { color_: string } }>;
  codigoAlternativo?: string;
  familia?: {
    codigoFamilia?: string;
    codigoSubfamilia?: string;
    idFamilia?: number;
    descripcion?: string;
  };
}

export interface A3ErpStockRow {
  CODART: string;
  CODALM: string;
  UNIDADES: number;
  UNIDADESSTOCK: number;
  PRCMEDIO: number;
  PENDIENTESERVIR: number;
  PENDIENTERECIBIR: number;
  DISPONIBLE: number;
  PREVISTO: number;
}

export interface A3ErpStockTallasRow extends A3ErpStockRow {
  CODFAMTALLAH?: string;
  CODTALLAH?: string;
  DESCTALLAH?: string;
  CODFAMTALLAV?: string;
  CODTALLAV?: string;
  DESCTALLAV?: string;
}

export interface A3ErpCliente {
  CODCLI: string; // 8 cuadrado
  IDORG?: number;
  NOMCLI: string;
  RAZON?: string;
  NIFCLI: string;
  DIRCLI?: string;
  DIRCLI1?: string;
  DIRCLI2?: string;
  DTOCLI?: string; // Código postal
  POBCLI?: string;
  MUNICIPIO?: string;
  CODPROVI?: string; // 4 cuadrado
  CODPAIS?: string;
  TELCLI?: string;
  TELCLI2?: string;
  FAXCLI?: string;
  E_MAIL?: string;
  E_MAIL_DOCS?: string;
  TIPIVA?: string;
  TARIFA?: string;
  FORPAG?: string;
  DOCPAG?: string;
  CODMON?: string;
  CODREP?: string;
  OBSOLETO?: A3ErpBoolean;
  BLOQUEADO?: A3ErpBoolean;
  DESC1?: number;
  DESC2?: number;
  DESC3?: number;
  DESC4?: number;
  FECHAMODIFICACION?: string;
}

export interface A3ErpPedidoVentaLineaInput {
  CODART: string; // 15 cuadrado
  DESCLIN: string;
  UNIDADES: number;
  PRCMONEDAMASIVA?: number;
  PRCMONEDA?: number;
  DESC1?: number;
  TIPIVA?: string;
  CENTROCOSTE?: string;
}

export interface A3ErpPedidoVentaPost {
  IDPEDV?: number;
  SERIE: string;
  CODALM: string; // 8 cuadrado
  CODMON: string;
  DOCPAG: string;
  FORPAG: string;
  REGIVA: string;
  TIPOCONT: string; // No cuadrado
  IVAINCLUIDO?: A3ErpBoolean;
  FECHA: string; // ISO sin TZ: YYYY-MM-DDTHH:mm:ss
  REFERENCIA: string;
  CODCLI: string; // 8 cuadrado
  NIFCLI?: string;
  NOMCLI?: string;
  RAZON?: string;
  DIRCLI?: string;
  POBCLI?: string;
  TELCLI?: string;
  EMAIL?: string;
  OBSERVACIONES?: string;
  IDDIRENT?: number;
  NUMDIR?: number;
  CENTROCOSTE?: string;
  PEDIDOVENTALINEAS: A3ErpPedidoVentaLineaInput[];
}

export interface A3ErpVariantInfo {
  sku: string;
  parentCodArt: string;
  sizeGroup?: string;
  sizeCode?: string;
  colorCode?: string;
  colorName?: string;
  alternativeCode?: string;
}

export interface A3ErpReplogRow {
  TABLA: string;
  OPERACION: 'I' | 'U' | 'D' | string;
  CLAVE: string;
  FECHA: string;
}

export interface A3ErpFacturaAlbaranInput {
  IDALBV?: number;
  NUMDOC?: number;
  SERIE?: string;
  FECHA?: string;
  CODCLI?: string;
  TIPOCONT?: string;
  REFERENCIA?: string;
}

export interface A3ErpImprimeFacturaResult {
  documentId: number;
  kind: 'venta' | 'compra';
  mimeType: 'application/pdf';
  fileName: string;
  pdfBase64: string;
}
