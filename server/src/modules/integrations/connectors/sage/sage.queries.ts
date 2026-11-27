import { SageImportEntity } from './sage.types';

/**
 * Consultas y mutaciones GraphQL oficiales de StoamConnectAPIv2 (Sage 200).
 * El esquema expone 259 modelos, 327 consultas raíz y 6 mutaciones import* sobre TmpIME_*.
 */
export const SAGE_GRAPHQL_QUERIES = {
  CUSTOMER_BY_CIF: `
    query CustomerByCif($codigoEmpresa: Int!, $cifDni: String!) {
      clientes(
        codigoEmpresa: $codigoEmpresa
        where: { cifDni: { eq: $cifDni } }
        first: 5
      ) {
        totalCount
        nodes {
          codigoCliente
          cifDni
          razonSocial
          nombre
          email1
          telefono
        }
      }
    }
  `,

  DOMICILIOS_BY_CUSTOMER: `
    query DomiciliosByCustomer($codigoEmpresa: Int!, $codigoCliente: String!) {
      domicilios(
        codigoEmpresa: $codigoEmpresa
        where: { codigoCliente: { eq: $codigoCliente } }
        first: 50
      ) {
        totalCount
        nodes {
          numeroDomicilio
          tipoDomicilio
          domicilio
          codigoPostal
          municipio
          provincia
        }
      }
    }
  `,

  ARTICULOS_CATALOG: `
    query ArticulosCatalog($codigoEmpresa: Int!, $first: Int!, $after: String) {
      articulos(codigoEmpresa: $codigoEmpresa, first: $first, after: $after) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          codigoArticulo
          descripcionArticulo
          descripcion2Articulo
          precioVenta
          precioCompra
          codigoFamilia
          codigoSubfamilia
          obsoletoLc
          pesoNetoUnitario_
        }
      }
    }
  `,

  ACUMULADO_STOCKS: `
    query AcumuladoStocks($codigoEmpresa: Int!, $first: Int!, $after: String) {
      acumuladoStocks(codigoEmpresa: $codigoEmpresa, first: $first, after: $after) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          codigoArticulo
          codigoAlmacen
          unidadSaldo
          disponible
          pendienteServir
          pendienteRecibir
        }
      }
    }
  `,

  ACUMULADO_STOCK_SINGLE: `
    query AcumuladoStockSingle($codigoEmpresa: Int!, $codigoArticulo: String!, $codigoAlmacen: String!) {
      acumuladoStock(
        codigoEmpresa: $codigoEmpresa
        codigoArticulo: $codigoArticulo
        codigoAlmacen: $codigoAlmacen
      ) {
        codigoArticulo
        codigoAlmacen
        unidadSaldo
        disponible
      }
    }
  `,
};

export const SAGE_GRAPHQL_MUTATIONS: Record<
  SageImportEntity,
  { mutationName: string; argName: string; query: string }
> = {
  Documents: {
    mutationName: 'importDocument',
    argName: 'document',
    query: `
      mutation ImportDocument($document: DocumentInput!) {
        importDocument(document: $document) {
          taskId
          status
          errorMessage
        }
      }
    `,
  },
  ClientesProveedores: {
    mutationName: 'importCustomerSupplier',
    argName: 'customerSupplier',
    query: `
      mutation ImportCustomerSupplier($customerSupplier: CustomerSupplierInput!) {
        importCustomerSupplier(customerSupplier: $customerSupplier) {
          taskId
          status
          errorMessage
        }
      }
    `,
  },
  Domicilios: {
    mutationName: 'importAddress',
    argName: 'address',
    query: `
      mutation ImportAddress($address: AddressInput!) {
        importAddress(address: $address) {
          taskId
          status
          errorMessage
        }
      }
    `,
  },
  Products: {
    mutationName: 'importItem',
    argName: 'item',
    query: `
      mutation ImportItem($item: ItemInput!) {
        importItem(item: $item) {
          taskId
          status
          errorMessage
        }
      }
    `,
  },
  StockMovements: {
    mutationName: 'importStockMovement',
    argName: 'stockMovement',
    query: `
      mutation ImportStockMovement($stockMovement: StockMovementInput!) {
        importStockMovement(stockMovement: $stockMovement) {
          taskId
          status
          errorMessage
        }
      }
    `,
  },
  Inventories: {
    mutationName: 'importInventory',
    argName: 'inventory',
    query: `
      mutation ImportInventory($inventory: InventoryInput!) {
        importInventory(inventory: $inventory) {
          taskId
          status
          errorMessage
        }
      }
    `,
  },
};
