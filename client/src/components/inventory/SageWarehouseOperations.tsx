import React, { useState } from 'react';
import {
  Boxes,
  Truck,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Download,
  ArrowRight,
  Building2,
  MapPin,
  Calendar,
  ShieldCheck,
  Layers,
  History,
  PackageCheck,
  UserCheck,
  Scale,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { apiRequest } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface SageWarehouseOperationsProps {
  activeSection: 'transfers' | 'batches' | 'kardex';
  warehouses: any[];
  transfers: any[];
  batches: any[];
  globalMovements: any[];
  products: any[];
  selectedWarehouseId: string;
  onSelectWarehouse: (id: string) => void;
  onRefresh: () => void;
}

export const SageWarehouseOperations: React.FC<SageWarehouseOperationsProps> = ({
  activeSection,
  warehouses,
  transfers,
  batches,
  globalMovements,
  products,
  selectedWarehouseId,
  onSelectWarehouse,
  onRefresh,
}) => {
  const toast = useToast();

  // New Transfer Modal State (Phase 1: Outbound Dispatch)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [targetWarehouseId, setTargetWarehouseId] = useState('');
  const [carrierName, setCarrierName] = useState('DHL Supply Chain Iberia');
  const [driverName, setDriverName] = useState('Roberto Gómez Sánchez');
  const [driverTaxId, setDriverTaxId] = useState('47892103-L');
  const [vehiclePlate, setVehiclePlate] = useState('4892-MNP');
  const [totalPackages, setTotalPackages] = useState('2');
  const [totalWeightKg, setTotalWeightKg] = useState('15.5');
  const [transferNotes, setTransferNotes] = useState('');
  const [transferItems, setTransferItems] = useState<
    Array<{
      productId: string;
      quantity: number;
      batchNumber: string;
      sourceBinLocation: string;
      targetBinLocation: string;
    }>
  >([
    {
      productId: '',
      quantity: 2,
      batchNumber: 'LOTE-2026-001',
      sourceBinLocation: 'PAS-A1-EST-02',
      targetBinLocation: 'ZONA-B-NIV-1',
    },
  ]);
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  // Receive Transfer Modal State (Phase 2: Inbound Reception & Shrinkage Inspection)
  const [receivingTransfer, setReceivingTransfer] = useState<any | null>(null);
  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({});
  const [receptionNotes, setReceptionNotes] = useState('');
  const [isSubmittingReception, setIsSubmittingReception] = useState(false);

  // New Warehouse Modal State
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [whForm, setWhForm] = useState({
    code: '',
    name: '',
    type: 'REGIONAL_HUB',
    address: '',
    city: '',
    postalCode: '',
    managerName: '',
    phone: '',
  });
  const [isSubmittingWh, setIsSubmittingWh] = useState(false);

  // New Batch Modal State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchForm, setBatchForm] = useState({
    productId: '',
    warehouseId: '',
    batchNumber: `LOTE-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    initialQty: '15',
    unitCost: '',
    expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
    supplierRef: `ALB-PROV-${new Date().getFullYear()}-089`,
  });
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);

  const openNewTransferModal = () => {
    const src = warehouses[0]?.id || '';
    const dst = warehouses[1]?.id || warehouses[0]?.id || '';
    setSourceWarehouseId(src);
    setTargetWarehouseId(dst);
    setTransferItems([
      {
        productId: products[0]?.id || '',
        quantity: 3,
        batchNumber: 'LOTE-2026-001',
        sourceBinLocation: 'PAS-A1-EST-02',
        targetBinLocation: 'ZONA-B-NIV-1',
      },
    ]);
    setIsTransferModalOpen(true);
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceWarehouseId || !targetWarehouseId) {
      toast.error('Almacenes requeridos', 'Selecciona el almacén de origen y el de destino.');
      return;
    }
    if (sourceWarehouseId === targetWarehouseId) {
      toast.error('Almacenes idénticos', 'El almacén de destino debe ser diferente al de origen.');
      return;
    }
    const validItems = transferItems.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Artículos requeridos', 'Selecciona al menos un producto con cantidad mayor que 0.');
      return;
    }

    setIsSubmittingTransfer(true);
    try {
      const res = await apiRequest('/inventory/transfers', {
        method: 'POST',
        body: JSON.stringify({
          sourceWarehouseId,
          targetWarehouseId,
          carrierName,
          driverName,
          driverTaxId,
          vehiclePlate,
          totalPackages: Number(totalPackages) || 1,
          totalWeightKg: Number(totalWeightKg) || 5.0,
          notes: transferNotes,
          items: validItems,
        }),
      });

      if (res.success) {
        toast.success(
          'Fase 1 Completada: Stock en Tránsito',
          res.message || 'Albarán de Circulación Interno generado correctamente.'
        );
        setIsTransferModalOpen(false);
        setTransferNotes('');
        onRefresh();
      } else {
        toast.error('Error al crear traspaso', res.message || 'No se pudo procesar el traspaso');
      }
    } catch (err: any) {
      toast.error('Error de conexión', err.message);
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  const openReceiveModal = (transfer: any) => {
    setReceivingTransfer(transfer);
    const map: Record<string, number> = {};
    (transfer.items || []).forEach((it: any) => {
      map[it.id] = it.shippedQty;
    });
    setReceivedQuantities(map);
    setReceptionNotes('Mercancía verificada en muelle de descarga con precinto intacto.');
  };

  const handleConfirmReception = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingTransfer) return;

    setIsSubmittingReception(true);
    try {
      const receivedItems = (receivingTransfer.items || []).map((it: any) => ({
        itemId: it.id,
        productId: it.productId,
        receivedQty: receivedQuantities[it.id] ?? it.shippedQty,
      }));

      const res = await apiRequest(`/inventory/transfers/${receivingTransfer.id}/receive`, {
        method: 'POST',
        body: JSON.stringify({
          receivedItems,
          notes: receptionNotes,
        }),
      });

      if (res.success) {
        toast.success('Fase 2 Completada: Mercancía Recepcionada', res.message);
        setReceivingTransfer(null);
        onRefresh();
      } else {
        toast.error('Error en recepción', res.message || 'No se pudo confirmar la recepción');
      }
    } catch (err: any) {
      toast.error('Error de conexión', err.message);
    } finally {
      setIsSubmittingReception(false);
    }
  };

  const handleDownloadTransferPdf = async (transferId: string, transferNumber: string) => {
    try {
      const res = await apiRequest(`/inventory/transfers/${transferId}/pdf`);
      if (res.success && res.data) {
        const url = window.URL.createObjectURL(res.data as any);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Albaran-Circulacion-${transferNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Albarán de Circulación PDF', `Descargado ${transferNumber} (Art. 9 LIVA & LOTT)`);
      } else {
        toast.error('Error PDF', 'No se pudo generar el Albarán de Circulación PDF');
      }
    } catch {
      toast.error('Error PDF', 'Error al descargar el Albarán de Circulación');
    }
  };

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whForm.name.trim()) return;
    setIsSubmittingWh(true);
    try {
      const res = await apiRequest('/inventory/warehouses', {
        method: 'POST',
        body: JSON.stringify(whForm),
      });
      if (res.success) {
        toast.success('Almacén Registrado', res.message);
        setIsWarehouseModalOpen(false);
        setWhForm({
          code: '',
          name: '',
          type: 'REGIONAL_HUB',
          address: '',
          city: '',
          postalCode: '',
          managerName: '',
          phone: '',
        });
        onRefresh();
      } else {
        toast.error('Error', res.message);
      }
    } finally {
      setIsSubmittingWh(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchForm.productId || !batchForm.batchNumber) return;
    setIsSubmittingBatch(true);
    try {
      const res = await apiRequest('/inventory/batches', {
        method: 'POST',
        body: JSON.stringify(batchForm),
      });
      if (res.success) {
        toast.success('Lote FEFO Registrado', res.message);
        setIsBatchModalOpen(false);
        onRefresh();
      } else {
        toast.error('Error', res.message);
      }
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Multi-Warehouse Switcher Strip */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Red Logística Multi-Almacén & Ubicaciones (Sage Enterprise)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="btn-new-warehouse"
              onClick={() => setIsWarehouseModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>Nuevo Almacén</span>
            </button>
            <button
              type="button"
              data-testid="btn-new-stock-transfer"
              onClick={openNewTransferModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all active:scale-[0.98]"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Nuevo Traspaso Inter-Almacén (Sage 2 Fases)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          <button
            type="button"
            data-testid="warehouse-card-ALL"
            onClick={() => onSelectWarehouse('ALL')}
            className={`p-3 rounded-xl border text-left transition-all active:scale-[0.98] ${
              selectedWarehouseId === 'ALL'
                ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-600/30'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold font-mono text-blue-600 dark:text-blue-400">
                CONSOLIDADO GLOBAL
              </span>
              <Boxes className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">
              Todos los Centros ({warehouses.length})
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Stock Total Empresa (NIF Único)
            </div>
          </button>

          {warehouses.map((wh) => {
            const totalWhStock = (wh.stocks || []).reduce((acc: number, s: any) => acc + (s.stock || 0), 0);
            const totalInTransit = (wh.stocks || []).reduce((acc: number, s: any) => acc + (s.inTransitStock || 0), 0);
            const isSelected = selectedWarehouseId === wh.id;

            return (
              <button
                key={wh.id}
                type="button"
                data-testid={`warehouse-card-${wh.code}`}
                onClick={() => onSelectWarehouse(wh.id)}
                className={`p-3 rounded-xl border text-left transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-600/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    {wh.code}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5" />
                    {wh.city || 'España'}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white mt-1.5 truncate" title={wh.name}>
                  {wh.name}
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[11px]">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    {totalWhStock} uds.
                  </span>
                  {totalInTransit > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[9px] font-bold">
                      +{totalInTransit} en tránsito
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 1: SAGE 2-PHASE STOCK TRANSFERS */}
      {activeSection === 'transfers' && (
        <div className="space-y-4" data-testid="section-stock-transfers">
          {/* Legal Compliance Banner (Spain / EU Art. 9 Ley 37/1992 IVA + LOTT) */}
          <div className="p-4 rounded-2xl bg-blue-50/90 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Protocolo Legal de Traspasos entre Almacenes (Metodología Sage 50 / Sage 200)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300">
                    Exento IVA · Art. 9.1º Ley 37/1992
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300">
                    Carta de Porte LOTT / ROTT
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                  <strong>Fase 1 (Expedición):</strong> Descuenta del almacén origen, sitúa la mercancía en <em>Stock en Tránsito</em> y emite el <strong>Albarán de Circulación Interno PDF</strong> con matrícula, DNI del conductor y valoración a Coste Medio Ponderado (PMP) sin devengo de IVA.{' '}
                  <strong>Fase 2 (Recepción en Destino):</strong> Verifica unidades recibidas, consolida el stock físico en la ubicación de destino y contabiliza automáticamente mermas o roturas si existieran discrepancias.
                </p>
              </div>
            </div>
          </div>

          {/* Transfers Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Libro de Albaranes de Circulación y Traspasos Inter-Almacén ({transfers.length})
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Nº Albarán</th>
                    <th className="py-3 px-4">Ruta Logística (Origen → Destino)</th>
                    <th className="py-3 px-4">Porteador / Matrícula (LOTT)</th>
                    <th className="py-3 px-4">Artículos & Lote</th>
                    <th className="py-3 px-4 text-right">Valoración PMP</th>
                    <th className="py-3 px-4">Estado (2 Fases)</th>
                    <th className="py-3 px-4 text-right">Acciones Legales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {transfers.map((tr) => {
                    const totalUnits = (tr.items || []).reduce((acc: number, it: any) => acc + (it.shippedQty || 0), 0);
                    const totalPmp = (tr.items || []).reduce(
                      (acc: number, it: any) => acc + (it.shippedQty || 0) * (it.unitCostPmp || 0),
                      0
                    );

                    return (
                      <tr key={tr.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          <div>{tr.transferNumber}</div>
                          <div className="text-[10px] font-normal text-slate-400">
                            {new Date(tr.createdAt).toLocaleDateString('es-ES')}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px]">
                              {tr.sourceWarehouse?.code}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono text-[10px]">
                              {tr.targetWarehouse?.code}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {tr.sourceWarehouse?.city} → {tr.targetWarehouse?.city}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {tr.carrierName || 'Flota Interna'}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Matrícula: {tr.vehiclePlate || 'INTERNO'} · {tr.driverName || 'Conductor'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {totalUnits} uds. ({(tr.items || []).length} línea/s)
                          </div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[200px]">
                            {(tr.items || []).map((i: any) => `${i.product?.sku} (${i.batchNumber || 'Lote'})`).join(', ')}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          <div>{totalPmp.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
                          <div className="text-[9px] text-emerald-600 font-sans">IVA 0,00 € (No sujeto)</div>
                        </td>
                        <td className="py-3.5 px-4">
                          {tr.status === 'IN_TRANSIT' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
                              <Truck className="w-3 h-3" />
                              <span>FASE 1: EN TRÁNSITO</span>
                            </span>
                          ) : tr.status === 'DISCREPANCY' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300">
                              <AlertTriangle className="w-3 h-3" />
                              <span>RECEPCIONADO CON MERMA</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>FASE 2: RECEPCIONADO</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {tr.status === 'IN_TRANSIT' && (
                              <button
                                type="button"
                                data-testid={`btn-receive-transfer-${tr.transferNumber}`}
                                onClick={() => openReceiveModal(tr)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-all active:scale-[0.98]"
                              >
                                <PackageCheck className="w-3.5 h-3.5" />
                                <span>Recepcionar (Fase 2)</span>
                              </button>
                            )}
                            <button
                              type="button"
                              data-testid={`btn-transfer-pdf-${tr.transferNumber}`}
                              onClick={() => handleDownloadTransferPdf(tr.id, tr.transferNumber)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-all active:scale-[0.98]"
                              title="Descargar Albarán de Circulación Interno PDF (Art. 9 LIVA & LOTT)"
                            >
                              <Download className="w-3.5 h-3.5 text-blue-600" />
                              <span>Albarán PDF</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: BATCHES & EXPIRY MATRIX (FEFO / FIFO) */}
      {activeSection === 'batches' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs" data-testid="section-stock-batches">
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>Matriz de Trazabilidad por Lotes, Números de Serie y Caducidad (FEFO / FIFO)</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Asignación automática prioritaria a los lotes con vencimiento más próximo (First Expired, First Out).
              </p>
            </div>
            <button
              type="button"
              data-testid="btn-new-batch"
              onClick={() => {
                setBatchForm({
                  ...batchForm,
                  productId: products[0]?.id || '',
                  warehouseId: warehouses[0]?.id || '',
                });
                setIsBatchModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Lote / Serie</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Código de Lote</th>
                  <th className="py-3 px-4">Producto / SKU</th>
                  <th className="py-3 px-4">Albarán Proveedor</th>
                  <th className="py-3 px-4 text-right">Uds. Iniciales</th>
                  <th className="py-3 px-4 text-right">Uds. Disponibles</th>
                  <th className="py-3 px-4 text-right">Coste Lote</th>
                  <th className="py-3 px-4">Fecha Caducidad (FEFO)</th>
                  <th className="py-3 px-4">Estado Sanitario / Calidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {batches.map((b) => {
                  const daysLeft = b.expiryDate
                    ? Math.ceil((new Date(b.expiryDate).getTime() - Date.now()) / 86400000)
                    : null;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-purple-700 dark:text-purple-300">
                        {b.batchNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{b.product?.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{b.product?.sku}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {b.supplierRef || 'ENTRADA-DIRECTA'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">{b.initialQty}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                        {b.remainingQty} uds.
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {Number(b.unitCost || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </td>
                      <td className="py-3 px-4">
                        {b.expiryDate ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(b.expiryDate).toLocaleDateString('es-ES')}</span>
                            {daysLeft !== null && (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  daysLeft <= 0
                                    ? 'bg-rose-100 text-rose-700'
                                    : daysLeft <= 45
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {daysLeft <= 0 ? 'Vencido' : `${daysLeft} días`}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">Sin caducidad</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          {b.status || 'ACTIVE'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: KARDEX ACCOUNTING LEDGER (PMP) */}
      {activeSection === 'kardex' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs" data-testid="section-stock-kardex">
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600" />
                <span>Libro Mayor Kardex Contable & Valoración a Coste Medio Ponderado (PMP - Norma 10ª PGC)</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Auditoría inmutable de entradas, salidas, traspasos entre almacenes y mermas de transporte.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Fecha / Hora</th>
                  <th className="py-3 px-4">Artículo</th>
                  <th className="py-3 px-4">Tipo Operación</th>
                  <th className="py-3 px-4">Lote / Ref.</th>
                  <th className="py-3 px-4 text-right">Variación</th>
                  <th className="py-3 px-4 text-right">Saldo Stock</th>
                  <th className="py-3 px-4 text-right">Coste PMP</th>
                  <th className="py-3 px-4">Justificación / Operador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {globalMovements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(mov.createdAt).toLocaleString('es-ES')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{mov.product?.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{mov.product?.sku}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          mov.type === 'INBOUND' || mov.type === 'TRANSFER_IN'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : mov.type === 'SHRINKAGE' || mov.type === 'OUTBOUND'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}
                      >
                        {mov.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {mov.batchNumber || mov.reference || '—'}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono font-bold ${
                        mov.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {mov.newStock} uds.
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                      {Number(mov.unitCostPmp || mov.product?.costPrice || 0).toLocaleString('es-ES', {
                        style: 'currency',
                        currency: 'EUR',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800 dark:text-slate-200">{mov.reason}</div>
                      <div className="text-[10px] text-slate-400">Por: {mov.performedBy || 'Sistema'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE SAGE 2-PHASE STOCK TRANSFER (PHASE 1 DISPATCH) */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Asistente de Traspaso entre Almacenes (Sage 2 Fases)"
        subtitle="Fase 1: Salida a Stock en Tránsito + Emisión de Albarán de Circulación Interno (Art. 9 Ley 37/1992 IVA & LOTT)"
        icon={Truck}
        size="xl"
      >
        <form onSubmit={handleCreateTransfer} className="space-y-4" data-testid="form-create-stock-transfer">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Almacén de Origen (Expedidor) *
              </label>
              <select
                data-testid="select-source-warehouse" aria-label="Almacén de origen"
                value={sourceWarehouseId}
                onChange={(e) => setSourceWarehouseId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} — {w.name} ({w.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Almacén de Destino (Receptor) *
              </label>
              <select
                data-testid="select-target-warehouse" aria-label="Almacén de destino"
                value={targetWarehouseId}
                onChange={(e) => setTargetWarehouseId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} — {w.name} ({w.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Road Transport Control Fields (LOTT / Orden FOM/2861/2012) */}
          <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-950 dark:text-blue-300 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Datos Obligatorios de Control de Transporte por Carretera (LOTT / ROTT)</span>
              </span>
              <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400">Orden FOM/2861/2012</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Agencia / Porteador
                </label>
                <input
                  type="text"
                  data-testid="input-transfer-carrier" aria-label="Agencia o porteador"
                  value={carrierName}
                  onChange={(e) => setCarrierName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Conductor Asignado
                </label>
                <input
                  type="text"
                  data-testid="input-transfer-driver" aria-label="Conductor asignado"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Matrícula Vehículo / Remolque
                </label>
                <input
                  type="text"
                  data-testid="input-transfer-plate" aria-label="Matrícula del vehículo"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  NIF / DNI Conductor
                </label>
                <input
                  type="text"
                  aria-label="NIF del conductor" value={driverTaxId}
                  onChange={(e) => setDriverTaxId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nº de Bultos / Palets
                </label>
                <input
                  type="number"
                  min="1"
                  aria-label="Número de bultos" value={totalPackages}
                  onChange={(e) => setTotalPackages(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Peso Bruto Total (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  aria-label="Peso bruto total en kg" value={totalWeightKg}
                  onChange={(e) => setTotalWeightKg(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Items to Transfer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-white">
                Líneas de Mercancía a Traspasar (con Lote FEFO y Ubicación)
              </label>
              <button
                type="button"
                onClick={() =>
                  setTransferItems([
                    ...transferItems,
                    {
                      productId: products[0]?.id || '',
                      quantity: 1,
                      batchNumber: 'LOTE-2026-002',
                      sourceBinLocation: 'PAS-A2',
                      targetBinLocation: 'ZONA-RECEP',
                    },
                  ])
                }
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                + Añadir Línea
              </button>
            </div>

            {transferItems.map((it, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 items-center"
              >
                <div className="sm:col-span-5">
                  <select
                    data-testid={`transfer-item-product-${idx}`} aria-label={`Producto línea ${idx + 1}`}
                    value={it.productId}
                    onChange={(e) => {
                      const next = [...transferItems];
                      next[idx].productId = e.target.value;
                      setTransferItems(next);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} — {p.name} (Stock: {p.stock})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="number"
                    min="1"
                    data-testid={`transfer-item-qty-${idx}`} aria-label={`Cantidad línea ${idx + 1}`}
                    value={it.quantity}
                    onChange={(e) => {
                      const next = [...transferItems];
                      next[idx].quantity = Math.max(1, parseInt(e.target.value, 10) || 1);
                      setTransferItems(next);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs font-bold text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                    placeholder="Cant."
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    aria-label={`Lote línea ${idx + 1}`} value={it.batchNumber}
                    onChange={(e) => {
                      const next = [...transferItems];
                      next[idx].batchNumber = e.target.value;
                      setTransferItems(next);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                    placeholder="Lote FEFO"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    aria-label={`Ubicación destino línea ${idx + 1}`} value={it.targetBinLocation}
                    onChange={(e) => {
                      const next = [...transferItems];
                      next[idx].targetBinLocation = e.target.value;
                      setTransferItems(next);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                    placeholder="Ubic. Destino"
                  />
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observaciones del Albarán de Circulación / Instrucciones de Descarga
            </label>
            <input
              type="text"
              aria-label="Observaciones del albarán" value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              placeholder="Ej. Mercancía paletizada con precinto de seguridad. No apilar."
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="btn-submit-stock-transfer"
              disabled={isSubmittingTransfer}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmittingTransfer ? 'Emitiendo Albarán...' : 'Expedir Mercancía en Tránsito (Fase 1)'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: PHASE 2 INBOUND RECEPTION & SHRINKAGE CHECK */}
      <Modal
        isOpen={Boolean(receivingTransfer)}
        onClose={() => setReceivingTransfer(null)}
        title={`Fase 2: Recepción e Inspección en Destino (${receivingTransfer?.transferNumber || ''})`}
        subtitle={`Origen: ${receivingTransfer?.sourceWarehouse?.name} → Destino: ${receivingTransfer?.targetWarehouse?.name}`}
        icon={PackageCheck}
        size="lg"
      >
        {receivingTransfer && (
          <form onSubmit={handleConfirmReception} className="space-y-4" data-testid="form-receive-stock-transfer">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200">
              Verifica las unidades físicas descargadas en <strong>{receivingTransfer.targetWarehouse?.code}</strong>. Si la cantidad recibida es inferior a la enviada, el sistema registrará automáticamente un asiento contable de <strong>Merma / Rotura en Transporte (SHRINKAGE)</strong>.
            </div>

            <div className="space-y-2">
              {(receivingTransfer.items || []).map((item: any) => {
                const rec = receivedQuantities[item.id] ?? item.shippedQty;
                const diff = item.shippedQty - rec;

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.product?.sku} — {item.product?.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Lote: {item.batchNumber} · Enviado en Fase 1: <strong>{item.shippedQty} uds.</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Recibido:
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={item.shippedQty}
                        data-testid={`input-receive-qty-${item.id}`} aria-label="Cantidad recibida"
                        value={rec}
                        onChange={(e) =>
                          setReceivedQuantities({
                            ...receivedQuantities,
                            [item.id]: Math.max(0, parseInt(e.target.value, 10) || 0),
                          })
                        }
                        className="w-20 px-2.5 py-1.5 text-xs font-bold text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                      {diff > 0 && (
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold">
                          Merma: -{diff}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Acta de Conformidad / Observaciones de Recepción
              </label>
              <input
                type="text"
                aria-label="Observaciones de recepción" value={receptionNotes}
                onChange={(e) => setReceptionNotes(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReceivingTransfer(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                data-testid="btn-confirm-reception"
                disabled={isSubmittingReception}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all active:scale-[0.98]"
              >
                {isSubmittingReception ? 'Consolidando...' : 'Confirmar Recepción y Consolidar Stock'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 3: CREATE NEW WAREHOUSE */}
      <Modal
        isOpen={isWarehouseModalOpen}
        onClose={() => setIsWarehouseModalOpen(false)}
        title="Registrar Nuevo Almacén / Centro Logístico"
        icon={Building2}
        size="md"
      >
        <form onSubmit={handleCreateWarehouse} className="space-y-3" data-testid="form-create-warehouse">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Código Almacén *
              </label>
              <input
                type="text"
                required
                placeholder="ALM-VAL-04"
                value={whForm.code}
                onChange={(e) => setWhForm({ ...whForm, code: e.target.value })}
                className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ciudad *
              </label>
              <input
                type="text"
                required
                placeholder="Valencia"
                value={whForm.city}
                onChange={(e) => setWhForm({ ...whForm, city: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre del Centro Logístico *
            </label>
            <input
              type="text"
              required
              placeholder="Hub Logístico Levante (Puerto de Valencia)"
              value={whForm.name}
              onChange={(e) => setWhForm({ ...whForm, name: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Dirección Completa
            </label>
            <input
              type="text"
              placeholder="Zona de Actividades Logísticas (ZAL), Sector A"
              value={whForm.address}
              onChange={(e) => setWhForm({ ...whForm, address: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsWarehouseModalOpen(false)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmittingWh}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
            >
              Guardar Almacén
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: CREATE NEW FEFO BATCH */}
      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        title="Registrar Nuevo Lote / Partida con Control FEFO"
        icon={Layers}
        size="md"
      >
        <form onSubmit={handleCreateBatch} className="space-y-3" data-testid="form-create-batch">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Producto *
            </label>
            <select
              aria-label="Producto del lote" value={batchForm.productId}
              onChange={(e) => setBatchForm({ ...batchForm, productId: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Código de Lote *
              </label>
              <input
                type="text"
                required
                aria-label="Código de lote" value={batchForm.batchNumber}
                onChange={(e) => setBatchForm({ ...batchForm, batchNumber: e.target.value })}
                className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unidades del Lote *
              </label>
              <input
                type="number"
                min="1"
                required
                aria-label="Unidades del lote" value={batchForm.initialQty}
                onChange={(e) => setBatchForm({ ...batchForm, initialQty: e.target.value })}
                className="w-full px-3 py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fecha Caducidad (FEFO)
              </label>
              <input
                type="date"
                aria-label="Fecha de caducidad" value={batchForm.expiryDate}
                onChange={(e) => setBatchForm({ ...batchForm, expiryDate: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ref. Albarán Proveedor
              </label>
              <input
                type="text"
                aria-label="Referencia albarán proveedor" value={batchForm.supplierRef}
                onChange={(e) => setBatchForm({ ...batchForm, supplierRef: e.target.value })}
                className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsBatchModalOpen(false)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmittingBatch}
              className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
            >
              Registrar Lote
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
