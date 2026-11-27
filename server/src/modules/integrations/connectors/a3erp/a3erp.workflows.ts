import { MappingEngine } from '../../core/mapping-engine';
import {
  A3ErpArticulo,
  A3ErpReadProcName,
  A3ErpStockTallasRow,
  A3ErpVariantInfo,
} from './a3erp.types';

/**
 * Utilidades de flujos de negocio y muestras offline de a3ERP.
 * Mantiene `a3erp.connector.ts` limpio y enfocado en orquestación HTTP/Tasks.
 */
export class A3ErpWorkflowHelpers {
  /**
   * Flujo Products_Page_v10:
   * Extrae variantes de tallas y colores cuando `TALLAS !== 'F'`, combinando
   * `grupoTalla_`, `coloresDisponibles` y `codigoAlternativo`.
   */
  public static extractArticleVariants(art: A3ErpArticulo): A3ErpVariantInfo[] {
    const cleanSku = String(art.CODART || '').trim() || `A3-${art.ID}`;
    if (!art.TALLAS || art.TALLAS.toUpperCase() === 'F') {
      return [];
    }

    const sizes: string[] = [];
    if (art.grupoTalla_ && typeof art.grupoTalla_ === 'object') {
      for (const [k, v] of Object.entries(art.grupoTalla_)) {
        if (/^talla/i.test(k) && v && String(v).trim()) {
          sizes.push(String(v).trim());
        }
      }
      if (Array.isArray((art.grupoTalla_ as any).tallas)) {
        for (const t of (art.grupoTalla_ as any).tallas) {
          if (t && String(t).trim()) sizes.push(String(t).trim());
        }
      }
    }

    const colors = Array.isArray(art.coloresDisponibles) ? art.coloresDisponibles : [];
    const variants: A3ErpVariantInfo[] = [];

    if (sizes.length > 0 && colors.length > 0) {
      for (const size of sizes) {
        for (const color of colors) {
          const colorCode = String(color.codigoColor_ || '').trim();
          const colorName = String(color.color?.color_ || colorCode).trim();
          variants.push({
            sku: `${cleanSku}-${size}-${colorCode || 'STD'}`,
            parentCodArt: art.CODART,
            sizeGroup: art.TALLAS,
            sizeCode: size,
            colorCode,
            colorName,
            alternativeCode: art.codigoAlternativo,
          });
        }
      }
    } else if (sizes.length > 0) {
      for (const size of sizes) {
        variants.push({
          sku: `${cleanSku}-${size}`,
          parentCodArt: art.CODART,
          sizeGroup: art.TALLAS,
          sizeCode: size,
          alternativeCode: art.codigoAlternativo,
        });
      }
    } else if (colors.length > 0) {
      for (const color of colors) {
        const colorCode = String(color.codigoColor_ || '').trim();
        const colorName = String(color.color?.color_ || colorCode).trim();
        variants.push({
          sku: `${cleanSku}-${colorCode || 'STD'}`,
          parentCodArt: art.CODART,
          sizeGroup: art.TALLAS,
          colorCode,
          colorName,
          alternativeCode: art.codigoAlternativo,
        });
      }
    }

    return variants;
  }

  /**
   * Filtra la fila resumen negativa que devuelve a3ERP en `GET /api/proc/StockTallas`
   * (donde a3ERP inserta una fila de cuadre sin tallas o con unidades negativas de sumatorio).
   */
  public static filterStockTallasSummaryRows(rows: A3ErpStockTallasRow[]): A3ErpStockTallasRow[] {
    return (rows || []).filter((row) => {
      const hasAnySize = Boolean(
        (row.CODTALLAH && String(row.CODTALLAH).trim()) ||
          (row.CODTALLAV && String(row.CODTALLAV).trim()) ||
          (row.DESCTALLAH && String(row.DESCTALLAH).trim()) ||
          (row.DESCTALLAV && String(row.DESCTALLAV).trim())
      );
      const isNegativeSummary =
        !hasAnySize && (Number(row.UNIDADES ?? 0) < 0 || Number(row.UNIDADESSTOCK ?? 0) < 0);
      return !isNegativeSummary;
    });
  }

  public static getOfflineProcSample(proc: A3ErpReadProcName, params?: Record<string, any>): any[] {
    switch (proc) {
      case 'Articulos':
        return [
          {
            CODART: '              0',
            ID: 1,
            DESCART: 'Artículo Genérico / Fallback a3ERP',
            CODFAMEST: 'GEN',
            CAR1: 'REC',
            PRCVENTA: 25.0,
            PRCSTANDARD: 30.0,
            PRCCOSTE: 14.5,
            PRCMINIMO: 18.0,
            TIPIVA: 'ORD21',
            OBSOLETO: 'F',
            BLOQUEADO: 'F',
            PESO: 1.2,
            TALLAS: 'F',
            ESVENTA: 'T',
            AFESTOCK: 'T',
            UNIDADESSTOCK: 120,
            FECHAMODIFICACION: new Date().toISOString().slice(0, 19),
          },
          {
            CODART: '              1',
            ID: 2,
            DESCART: 'Kit Recambio Industrial BMW a3ERP',
            CODFAMEST: 'BMW',
            CAR1: 'REC',
            PRCVENTA: 612.25,
            PRCSTANDARD: 650.0,
            PRCCOSTE: 438.28,
            PRCMINIMO: 500.0,
            TIPIVA: 'ORD21',
            OBSOLETO: 'F',
            BLOQUEADO: 'F',
            PESO: 4.5,
            TALLAS: 'SML',
            ESVENTA: 'T',
            AFESTOCK: 'T',
            UNIDADESSTOCK: 36,
            grupoTalla_: { talla1: 'S', talla2: 'M', talla3: 'L' },
            coloresDisponibles: [{ codigoColor_: 'NEG', color: { color_: 'Negro' } }],
            codigoAlternativo: 'BMW-KIT-01',
            FECHAMODIFICACION: new Date().toISOString().slice(0, 19),
          },
        ];
      case 'Clientes':
      case 'ClientesPorNif': {
        const requestedNif = params?.nifcli ? MappingEngine.normalizeNif(params.nifcli) : '34567891H';
        return [
          {
            CODCLI: '       1',
            IDORG: 101,
            NOMCLI: 'Distribuciones Industriales BCN S.L.',
            RAZON: 'Distribuciones Industriales BCN S.L.',
            NIFCLI: requestedNif,
            DIRCLI: 'Paseo de Gracia 102',
            POBCLI: 'Barcelona',
            DTOCLI: '08008',
            CODPROVI: '  08',
            CODPAIS: 'ES',
            TIPIVA: 'ORD21',
            TARIFA: '       1',
            FORPAG: '       C',
            DOCPAG: '       T',
            OBSOLETO: 'F',
            BLOQUEADO: 'F',
            E_MAIL: 'compras@distribuciones-bcn.es',
            TELCLI: '934123456',
          },
        ];
      }
      case 'Stock':
        return [
          {
            CODART: '              1',
            CODALM: '       1',
            UNIDADES: 36,
            UNIDADESSTOCK: 36,
            PRCMEDIO: 438.27747527,
            PENDIENTESERVIR: 2,
            PENDIENTERECIBIR: 10,
            DISPONIBLE: 34,
            PREVISTO: 44,
          },
        ];
      case 'StockTallas':
        return [
          {
            CODART: '              1',
            CODALM: '       1',
            CODTALLAH: '',
            UNIDADES: -36,
            UNIDADESSTOCK: -36,
            PRCMEDIO: 438.28,
            PENDIENTESERVIR: 0,
            PENDIENTERECIBIR: 0,
            DISPONIBLE: -36,
            PREVISTO: -36,
          },
          {
            CODART: '              1',
            CODALM: '       1',
            CODFAMTALLAH: 'SML',
            CODTALLAH: 'M',
            DESCTALLAH: 'Mediana',
            UNIDADES: 20,
            UNIDADESSTOCK: 20,
            PRCMEDIO: 438.28,
            PENDIENTESERVIR: 1,
            PENDIENTERECIBIR: 5,
            DISPONIBLE: 19,
            PREVISTO: 24,
          },
          {
            CODART: '              1',
            CODALM: '       1',
            CODFAMTALLAH: 'SML',
            CODTALLAH: 'L',
            DESCTALLAH: 'Grande',
            UNIDADES: 16,
            UNIDADESSTOCK: 16,
            PRCMEDIO: 438.28,
            PENDIENTESERVIR: 1,
            PENDIENTERECIBIR: 5,
            DISPONIBLE: 15,
            PREVISTO: 20,
          },
        ];
      case 'Replog':
        return [
          {
            TABLA: 'ARTICULO',
            OPERACION: 'U',
            CLAVE: '              1',
            FECHA: params?.fecha || new Date().toISOString().slice(0, 19),
          },
        ];
      case 'PedidosVenta':
        return [
          {
            IDPEDV: 1375,
            SERIE: 'BORRADOR',
            NUMDOC: 13,
            FECHA: '2026-10-15T11:00:00',
            REFERENCIA: 'STG-TEST-9101',
            CODCLI: '      25',
            CODALM: '       1',
            CODMON: 'EURO',
            REGIVA: 'VNAC',
            TIPOCONT: '1',
            IVAINCLUIDO: 'T',
            SITUACION: 'A',
            CENTROCOSTE: 'BCN',
            TOTDOC: 75.0,
            TOTIVA: 13.02,
          },
        ];
      default:
        return [{ proc, status: 'OK', timestamp: new Date().toISOString().slice(0, 19) }];
    }
  }
}
