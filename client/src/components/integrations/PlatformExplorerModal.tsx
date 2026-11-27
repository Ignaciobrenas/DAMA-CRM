import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  Code2,
  Database,
  Layers,
  Play,
  RefreshCw,
  Terminal,
  X,
  AlertCircle,
} from 'lucide-react';
import { integrationsService } from '../../services/integrations.service';
import { ConnectorCardDefinition } from './ConnectorCatalog';
import { useToast } from '../../context/ToastContext';

interface PlatformExplorerModalProps {
  isOpen: boolean;
  connector: ConnectorCardDefinition | null;
  onClose: () => void;
}

const DEFAULT_OPERATIONS_BY_CONNECTOR: Record<
  string,
  Array<{ id: string; label: string; defaultPayload: Record<string, any> }>
> = {
  a3erp: [
    { id: 'read_proc', label: 'GET /api/proc/Articulos (Lectura Paginada)', defaultPayload: { procName: 'Articulos', pageNumber: 1, pageSize: 50 } },
    { id: 'read_all_pages', label: 'Lectura Completa Paginada (X-Pagination)', defaultPayload: { procName: 'Articulos', pageSize: 50, maxPages: 10 } },
    { id: 'pad_code', label: 'Cuadrar Código a3ERP (15 / 8 / 4)', defaultPayload: { fieldName: 'CODART', value: '1' } },
    { id: 'orders_in', label: 'Flujo Orders_IN_v11 (AltaPedidoVenta + Task Poll)', defaultPayload: { orderNumber: 'STG-TEST-9101', nifCif: 'X7654321L' } },
    { id: 'ensure_customer', label: 'Flujo _Customer_Create_v10 (ClientesPorNif + Fallback 403)', defaultPayload: { nifCif: 'B12345678', firstName: 'Carlos', lastName: 'Martínez', postalCode: '08006' } },
    { id: 'stock_tallas', label: 'Stock + StockTallas (Filtro Fila Resumen Negativa)', defaultPayload: { codArt: '1' } },
    { id: 'read_replog', label: 'Cambios Incrementales (GET /api/proc/Replog)', defaultPayload: { fecha: '2026-01-01T00:00:00' } },
    { id: 'factura_albaran_venta', label: 'Facturar Albarán de Venta (FacturaAlbaranVenta)', defaultPayload: { IDALBV: 500, SERIE: 'FAC' } },
    { id: 'imprime_factura_venta', label: 'Imprimir Factura de Venta PDF (ImprimeFacturaVenta)', defaultPayload: { idFacv: 1001 } },
    { id: 'products_out', label: 'Flujo Products_OUT / Variantes / Price_OUT / Stock_OUT', defaultPayload: {} },
  ],
  sage_200: [
    { id: 'document_types', label: 'GET /api/v1/Documents/types (10 Tipos Comerciales)', defaultPayload: {} },
    { id: 'order_in', label: 'Flujo Order_IN_v12 (Ensure Customer -> Op_A Domicilio -> Op_B PVE)', defaultPayload: { orderNumber: '2026101', cifDni: 'B87654321' } },
    { id: 'create_item', label: 'Alta Artículo TmpIME_Articulos (77 Campos)', defaultPayload: { codigoArticulo: 'SAGE-ART-01', descripcionArticulo: 'Componente Industrial Sage 200', precioVenta: 290 } },
    { id: 'stock_movement', label: 'Flujo _Stock_Move_Variant_v13 (Traspaso Almacenes)', defaultPayload: { tipoMovimiento: 2, codigoArticulo: 'SAGE200-ENT-SUITE', codigoAlmacen: '001', almacenContrapartida: '002', unidades: 10 } },
    { id: 'stock_transfer_plan', label: 'Planificador Stock_Move_v13 (Delta vs GraphQL)', defaultPayload: { codigoArticulo: 'SAGE200-ENT-SUITE', sourceWarehouse: '001', targetWarehouse: '002', desiredTargetStock: 15, execute: false } },
    { id: 'create_inventory', label: 'Recuento Inventario (POST /api/v1/Inventories/create)', defaultPayload: { inventario: 'INV2026', codigoArticulo: 'SAGE200-ENT-SUITE', codigoAlmacen: '001', unidadesStock: 20, unidadesInventario: 18 } },
    { id: 'graphql_query', label: 'Consulta GraphQL en Vivo (259 Modelos)', defaultPayload: { query: 'query { clientes(codigoEmpresa: 9999, first: 1) { totalCount } }' } },
  ],
  prestashop: [
    { id: 'orders_out', label: 'Flujo Orders_OUT_v13 (5 Llamadas en Bloque por Página)', defaultPayload: {} },
    { id: 'update_order_state', label: 'Cambiar Estado Pedido (POST /api/order_histories XML)', defaultPayload: { orderId: 501, orderStateId: 4 } },
    { id: 'product_upsert', label: 'Flujo Product_Upsert_v12 (Dedupe + POST 2 campos + PATCH Admin API)', defaultPayload: { sku: 'PS-JKT-01', name: 'Chaqueta Técnica PrestaShop 9', basePrice: 100 } },
    { id: 'variants_in', label: 'Flujo Variants_IN_v1 (Opciones XML + Generate Combinations + PUT XML)', defaultPayload: { productId: 701, sku: 'PS-JKT-01-XL-RED', optionValueIds: [11, 24] } },
    { id: 'stock_update', label: 'Flujo Stock_Update_v11 (Lookup + XML Parcial stock_availables)', defaultPayload: { productId: 701, quantity: 45 } },
    { id: 'price_update', label: 'Flujo Price_Update_v11 (priceTaxExcluded + taxRulesGroupId)', defaultPayload: { productId: 701, basePrice: 100, taxClass: 'standard' } },
    { id: 'upload_image', label: 'Subir/Editar Imagen Multipart (POST Forzado PS9)', defaultPayload: { productId: 701, mode: 'admin_api', fileName: 'hero.jpg' } },
    { id: 'duplicates_report', label: 'Flujo Products_Duplicates_Report_v1 (Auditoría SKU/EAN13)', defaultPayload: {} },
  ],
  shopify: [
    { id: 'orders_out', label: 'Flujo Orders_OUT_v11 (Cursor Relay + MoneyBag + B2B)', defaultPayload: { financialStatus: 'paid', fulfillmentStatus: 'unfulfilled' } },
    { id: 'orders_out_all', label: 'Paginación Completa Relay (Orders_OUT_All)', defaultPayload: { financialStatus: 'paid', maxPages: 5 } },
    { id: 'product_set', label: 'Flujo Products_IN_v10 (Anti-Duplicado skuField + productSet)', defaultPayload: { sku: 'SHP-POS-01', name: 'Terminal POS Shopify Pro', basePrice: 285.12 } },
    { id: 'stock_update', label: 'Flujo Stock_Update_v10 (inventorySetQuantities on_hand)', defaultPayload: { inventoryItemId: '99100200300', quantity: 50 } },
    { id: 'price_update', label: 'Flujo Price_Update_v10 (productVariantsBulkUpdate)', defaultPayload: { productId: '88100200300', price: 129.9 } },
    { id: 'price_lists', label: 'Tarifas B2B (Query PriceList / Catalog)', defaultPayload: { first: 25 } },
    { id: 'b2b_metafields_sync', label: 'Sincronizar Metafields B2B (sage.*/b2b.* en lotes de 25)', defaultPayload: { ownerId: '301', customerTags: ['validado'], paymentTermLabel: '30 DIAS' } },
    { id: 'images_out', label: 'Flujo Images_OUT_v1 (Query GraphQL + isPrimary Posición 1)', defaultPayload: { productId: '88100200300' } },
  ],
  woocommerce: [
    { id: 'orders_out', label: 'Flujo Order_Out_v10 (Paginación X-WP-Total / X-WP-TotalPages)', defaultPayload: { status: 'processing', perPage: 25 } },
    { id: 'order_process', label: 'Flujo Order_Process_v10 (Poda Seguridad + Reconciliación _billing_nif)', defaultPayload: {} },
    { id: 'order_note', label: 'Añadir Nota de Pedido (POST /orders/{id}/notes)', defaultPayload: { orderId: 4920, note: 'Pedido verificado en DAMA-CRM', customerNote: false } },
    { id: 'order_refund', label: 'Emitir Reembolso WC 11.1+ (POST /orders/{id}/refunds)', defaultPayload: { orderId: 4920, amount: 50, apiRefund: true, apiRestock: true, computeTotals: true } },
    { id: 'product_upsert', label: 'Flujo Products_IN_v10 (Dedupe SKU + POST/PUT + /variations/batch)', defaultPayload: { sku: 'WC-MON-4K', name: 'Monitor UltraWide 4K Profesional', basePrice: 156.61 } },
    { id: 'stock_update', label: 'Flujo Stock_Update_v11 (Simple / Variación)', defaultPayload: { externalId: 301, quantity: 25 } },
    { id: 'price_update', label: 'Flujo Price_Update_v4 (Precio CON IVA incluido + tax_class)', defaultPayload: { externalId: 301, basePrice: 100, taxType: 'standard' } },
    { id: 'batch_operation', label: 'Operación en Lote (POST /wc/v3/products/batch <= 100)', defaultPayload: { resource: 'products', update: [{ id: 301, regular_price: '121.00' }] } },
  ],
};

export const PlatformExplorerModal: React.FC<PlatformExplorerModalProps> = ({
  isOpen,
  connector,
  onClose,
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'operations' | 'catalog'>('operations');
  const [catalogData, setCatalogData] = useState<any>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  const [selectedOp, setSelectedOp] = useState<string>('');
  const [payloadText, setPayloadText] = useState<string>('{}');
  const [executing, setExecuting] = useState(false);
  const [opResult, setOpResult] = useState<any>(null);

  useEffect(() => {
    if (!isOpen || !connector) return;
    const ops = DEFAULT_OPERATIONS_BY_CONNECTOR[connector.id] || [];
    if (ops.length > 0) {
      setSelectedOp(ops[0].id);
      setPayloadText(JSON.stringify(ops[0].defaultPayload, null, 2));
    }
    setOpResult(null);

    setLoadingCatalog(true);
    integrationsService
      .getConnectorCatalog(connector.id)
      .then((res) => {
        if (res && res.data) {
          setCatalogData(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingCatalog(false));
  }, [isOpen, connector]);

  if (!isOpen || !connector) return null;

  const availableOps = DEFAULT_OPERATIONS_BY_CONNECTOR[connector.id] || [];

  const handleSelectOperation = (opId: string) => {
    setSelectedOp(opId);
    const found = availableOps.find((o) => o.id === opId);
    if (found) {
      setPayloadText(JSON.stringify(found.defaultPayload, null, 2));
    }
    setOpResult(null);
  };

  const handleExecute = async () => {
    let parsedPayload: Record<string, any> = {};
    try {
      parsedPayload = payloadText.trim() ? JSON.parse(payloadText) : {};
    } catch {
      toast.error('JSON Inválido', 'Revisa el formato del JSON de parámetros antes de ejecutar.');
      return;
    }

    try {
      setExecuting(true);
      const res = await integrationsService.executeConnectorOperation(
        connector.id,
        selectedOp,
        parsedPayload
      );
      setOpResult(res);
      if (res.success) {
        toast.success('Operación Ejecutada', res.message);
      } else {
        toast.error('Aviso de Operación', res.message);
      }
    } catch (err: any) {
      setOpResult({ success: false, message: err.message });
      toast.error('Error', err.message);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Explorador de Plataforma ${connector.name}`}
        data-testid="platform-explorer-modal"
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 m-auto bg-slate-950/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col m-auto"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center p-2 shadow-xs">
                <img src={connector.logoUrl} alt={connector.name} className="w-6 h-6 object-contain" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Explorador Técnico &amp; Flujos: {connector.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ejecuta flujos reales del conector e inspecciona su contrato de entidades y convenciones
                </p>
              </div>
            </div>
            <button
              aria-label="Cerrar explorador de plataforma"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/70 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/30 px-6 gap-4">
            <button
              onClick={() => setActiveTab('operations')}
              className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
                activeTab === 'operations'
                  ? 'border-brand-color text-brand-color'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Ejecutor de Flujos &amp; Operaciones</span>
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
                activeTab === 'catalog'
                  ? 'border-brand-color text-brand-color'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Catálogo Oficial de Entidades &amp; Reglas</span>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
            {activeTab === 'operations' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Flujo / Operación del Conector:
                    </label>
                    <select
                      value={selectedOp}
                      onChange={(e) => handleSelectOperation(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                    >
                      {availableOps.map((op) => (
                        <option key={op.id} value={op.id}>
                          {op.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <button
                      onClick={handleExecute}
                      disabled={executing}
                      className="w-full py-2.5 px-4 rounded-xl bg-brand-color text-white font-bold hover:opacity-95 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {executing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      <span>{executing ? 'Ejecutando...' : 'Ejecutar Flujo'}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Parámetros de Entrada (JSON):
                  </label>
                  <textarea
                    rows={5}
                    value={payloadText}
                    onChange={(e) => setPayloadText(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs border border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-color"
                  />
                </div>

                {opResult && (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div
                      className={`p-3.5 flex items-center justify-between ${
                        opResult.success
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold">
                        {opResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span>{opResult.message}</span>
                      </div>
                      {opResult.taskId && (
                        <span className="px-2 py-0.5 rounded-md bg-black/10 dark:bg-white/10 font-mono text-[11px]">
                          TaskId: {opResult.taskId} ({opResult.taskStatus || 'COMPLETED'})
                        </span>
                      )}
                    </div>
                    <pre className="p-4 bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-72">
                      {JSON.stringify(opResult.data ?? opResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'catalog' && (
              <div className="space-y-4">
                {loadingCatalog ? (
                  <div className="py-12 text-center text-slate-500">Cargando catálogo técnico...</div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-brand-color" />
                        <span>Especificación y Contrato del Conector ({connector.protocol})</span>
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                        Modular Connector Engine
                      </span>
                    </div>
                    <pre className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-96 border border-slate-800">
                      {JSON.stringify(catalogData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-brand-color" />
              <span>Arquitectura Modular DAMA-CRM • Sin Monolitos</span>
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-300 dark:hover:bg-slate-700"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
