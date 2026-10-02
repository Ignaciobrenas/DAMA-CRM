import { Request, Response } from 'express';
import { prisma } from '../../prisma';

export type CarrierType = 'GLS' | 'NACEX' | 'AMAZON' | 'CORREOS_EXPRESS' | 'DHL' | 'MRW' | 'SEUR';
export type ShipmentStatus = 'PRE_TRANSIT' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'EXCEPTION' | 'RETURNED';

export interface TrackingEvent {
  id: string;
  status: ShipmentStatus;
  description: string;
  location: string;
  timestamp: string;
}

export interface ShipmentData {
  id: string;
  tenantId: string;
  trackingNumber: string;
  carrier: CarrierType;
  carrierLogo?: string;
  recipientName: string;
  recipientPhone?: string;
  recipientEmail?: string;
  destinationAddress: string;
  destinationCity: string;
  destinationPostalCode: string;
  destinationCountry: string;
  status: ShipmentStatus;
  weightKg: number;
  packageType: 'STANDARD_BOX' | 'ENVELOPE' | 'PALLET' | 'FRAGILE';
  shippingCost: number;
  orderNumber?: string;
  notes?: string;
  estimatedDeliveryDate: string;
  actualDeliveryDate?: string;
  signatureProof?: string;
  events: TrackingEvent[];
  createdAt: string;
  updatedAt: string;
}

function generateTrackingCode(carrier: CarrierType): string {
  const rand = Math.floor(10000000 + Math.random() * 90000000);
  switch (carrier) {
    case 'GLS':
      return `GLS-ES-${rand}`;
    case 'NACEX':
      return `NCX-${rand.toString().slice(0, 8)}`;
    case 'AMAZON':
      return `TBA${rand}ES`;
    case 'CORREOS_EXPRESS':
      return `CEX-${rand}`;
    case 'DHL':
      return `DHL-EXP-${rand}`;
    case 'SEUR':
      return `SEUR-${rand}`;
    case 'MRW':
      return `MRW-018-${rand.toString().slice(0, 6)}`;
    default:
      return `TRK-${rand}`;
  }
}

function formatShipment(s: any): ShipmentData {
  let meta: any = {};
  if (s.notes) {
    try {
      if (s.notes.trim().startsWith('{')) {
        meta = JSON.parse(s.notes);
      }
    } catch {
      meta = { userNotes: s.notes };
    }
  }

  const events: TrackingEvent[] = (s.checkpoints || []).map((cp: any) => ({
    id: cp.id,
    status: cp.status as ShipmentStatus,
    description: cp.description,
    location: cp.location,
    timestamp: cp.timestamp ? new Date(cp.timestamp).toISOString() : new Date().toISOString(),
  }));

  events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return {
    id: s.id,
    tenantId: s.tenantId || 'master',
    trackingNumber: s.trackingNumber,
    carrier: s.carrier as CarrierType,
    recipientName: s.recipientName,
    recipientPhone: s.recipientPhone || undefined,
    recipientEmail: s.recipientEmail || undefined,
    destinationAddress: s.recipientAddress || s.destination || '',
    destinationCity: s.recipientCity || '',
    destinationPostalCode: meta.destinationPostalCode || '28001',
    destinationCountry: meta.destinationCountry || 'España',
    status: s.status as ShipmentStatus,
    weightKg: s.weightKg || 1.0,
    packageType: meta.packageType || 'STANDARD_BOX',
    shippingCost: meta.shippingCost !== undefined ? Number(meta.shippingCost) : 5.99,
    orderNumber: meta.orderNumber || undefined,
    notes: meta.userNotes || (s.notes && !s.notes.trim().startsWith('{') ? s.notes : undefined),
    estimatedDeliveryDate: s.estimatedDelivery ? new Date(s.estimatedDelivery).toISOString() : new Date().toISOString(),
    actualDeliveryDate: s.actualDelivery ? new Date(s.actualDelivery).toISOString() : undefined,
    signatureProof: meta.signatureProof || undefined,
    events,
    createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: s.updatedAt ? new Date(s.updatedAt).toISOString() : new Date().toISOString(),
  };
}

async function getOrSeedShipments(tenantId: string): Promise<ShipmentData[]> {
  let records = await prisma.shipment.findMany({
    where: { tenantId },
    include: { checkpoints: true },
    orderBy: { createdAt: 'desc' },
  });

  if (records.length === 0) {
    const starterData = [
      {
        trackingNumber: 'GLS-ES-88349102',
        carrier: 'GLS',
        recipientName: 'Marta Delgado - Salón Estilistas Madrid',
        recipientPhone: '+34 622 112 334',
        recipientEmail: 'marta@estilistasdelgado.es',
        recipientAddress: 'Calle Serrano 45, 2ºA',
        recipientCity: 'Madrid',
        origin: 'Almacén Central (Barcelona)',
        destination: 'Calle Serrano 45, 2ºA, 28001 Madrid',
        status: 'OUT_FOR_DELIVERY',
        weightKg: 3.4,
        estimatedDelivery: new Date(),
        notes: JSON.stringify({
          packageType: 'STANDARD_BOX',
          shippingCost: 7.95,
          orderNumber: 'PED-2026-089',
          destinationPostalCode: '28001',
          destinationCountry: 'España',
          userNotes: 'Productos de cosmética capilar y champús profesionales.',
        }),
        checkpoints: {
          create: [
            {
              status: 'PRE_TRANSIT',
              description: 'Envío registrado en plataforma y etiqueta generada',
              location: 'Almacén Central (Barcelona)',
              timestamp: new Date(Date.now() - 36 * 3600 * 1000),
            },
            {
              status: 'IN_TRANSIT',
              description: 'Paquete clasificado en Hub Logístico Principal y en tránsito',
              location: 'Hub Central Coslada (Madrid)',
              timestamp: new Date(Date.now() - 12 * 3600 * 1000),
            },
            {
              status: 'OUT_FOR_DELIVERY',
              description: 'Paquete asignado a repartidor. Entrega estimada hoy antes de las 18:00h',
              location: 'Delegación GLS Madrid Centro',
              timestamp: new Date(Date.now() - 2 * 3600 * 1000),
            },
          ],
        },
      },
      {
        trackingNumber: 'NCX-94810239',
        carrier: 'NACEX',
        recipientName: 'Alejandro Sanz - Barbería Clásica',
        recipientPhone: '+34 677 889 900',
        recipientEmail: 'alejandro@barberiasanz.com',
        recipientAddress: 'Avinguda Diagonal 230',
        recipientCity: 'Barcelona',
        origin: 'Hub Valencia',
        destination: 'Avinguda Diagonal 230, 08018 Barcelona',
        status: 'DELIVERED',
        weightKg: 1.8,
        estimatedDelivery: new Date(Date.now() - 24 * 3600 * 1000),
        actualDelivery: new Date(Date.now() - 20 * 3600 * 1000),
        notes: JSON.stringify({
          packageType: 'STANDARD_BOX',
          shippingCost: 6.5,
          orderNumber: 'PED-2026-082',
          destinationPostalCode: '08018',
          destinationCountry: 'España',
          signatureProof: 'Firmado por: A. Sanz (DNI: ***4321*)',
          userNotes: 'Cuchillas de afeitar y máquinas de corte Wahl.',
        }),
        checkpoints: {
          create: [
            {
              status: 'PRE_TRANSIT',
              description: 'Recogida solicitada en almacén',
              location: 'Hub Valencia',
              timestamp: new Date(Date.now() - 48 * 3600 * 1000),
            },
            {
              status: 'IN_TRANSIT',
              description: 'Llegada a plataforma de distribución regional',
              location: 'Centro Distribución El Prat (Barcelona)',
              timestamp: new Date(Date.now() - 26 * 3600 * 1000),
            },
            {
              status: 'DELIVERED',
              description: 'Paquete entregado correctamente en destino',
              location: 'Barcelona',
              timestamp: new Date(Date.now() - 20 * 3600 * 1000),
            },
          ],
        },
      },
      {
        trackingNumber: 'TBA93821049ES',
        carrier: 'AMAZON',
        recipientName: 'Clínica Dermocosmética Bellasur',
        recipientPhone: '+34 655 123 789',
        recipientEmail: 'pedidos@bellasur.es',
        recipientAddress: 'Plaza Nueva 12',
        recipientCity: 'Sevilla',
        origin: 'San Fernando de Henares (Madrid)',
        destination: 'Plaza Nueva 12, 41001 Sevilla',
        status: 'IN_TRANSIT',
        weightKg: 5.2,
        estimatedDelivery: new Date(Date.now() + 24 * 3600 * 1000),
        notes: JSON.stringify({
          packageType: 'STANDARD_BOX',
          shippingCost: 8.4,
          orderNumber: 'AMZ-ES-40291',
          destinationPostalCode: '41001',
          destinationCountry: 'España',
          userNotes: 'Envío Fulfillment by Amazon (FBA) prioritario.',
        }),
        checkpoints: {
          create: [
            {
              status: 'PRE_TRANSIT',
              description: 'Envío empaquetado en centro logístico Amazon MAD4',
              location: 'San Fernando de Henares (Madrid)',
              timestamp: new Date(Date.now() - 10 * 3600 * 1000),
            },
            {
              status: 'IN_TRANSIT',
              description: 'En tránsito hacia la estación de entrega local',
              location: 'Estación Logística Amazon SVQ1 (Sevilla)',
              timestamp: new Date(Date.now() - 2 * 3600 * 1000),
            },
          ],
        },
      },
    ];

    for (const item of starterData) {
      await prisma.shipment.create({
        data: {
          tenantId,
          ...item,
        },
      });
    }

    records = await prisma.shipment.findMany({
      where: { tenantId },
      include: { checkpoints: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  return records.map(formatShipment);
}

/**
 * GET /api/logistics/shipments
 * List shipments with optional carrier, status, or search filters
 */
export async function listShipments(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user?.tenantId || 'master';
    const { carrier, status, query } = req.query;

    let shipments = await getOrSeedShipments(tenantId);

    if (carrier && typeof carrier === 'string') {
      shipments = shipments.filter((s) => s.carrier === carrier);
    }
    if (status && typeof status === 'string') {
      shipments = shipments.filter((s) => s.status === status);
    }
    if (query && typeof query === 'string') {
      const q = query.toLowerCase();
      shipments = shipments.filter(
        (s) =>
          s.trackingNumber.toLowerCase().includes(q) ||
          s.recipientName.toLowerCase().includes(q) ||
          s.destinationCity.toLowerCase().includes(q) ||
          (s.orderNumber && s.orderNumber.toLowerCase().includes(q))
      );
    }

    res.json({ success: true, data: shipments });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/logistics/shipments
 * Create a new shipment with carrier integration
 */
export async function createShipment(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user?.tenantId || 'master';
    const {
      carrier,
      trackingNumber,
      recipientName,
      recipientPhone,
      recipientEmail,
      destinationAddress,
      destinationCity,
      destinationPostalCode,
      destinationCountry,
      packageType,
      weightKg,
      shippingCost,
      orderNumber,
      notes,
      estimatedDeliveryDays,
    } = req.body;

    if (!carrier || !recipientName || !destinationAddress || !destinationCity || !destinationPostalCode) {
      res.status(400).json({
        success: false,
        message: 'Transportista, destinatario, dirección, ciudad y código postal son obligatorios',
      });
      return;
    }

    const carrierEnum = carrier as CarrierType;
    const finalTracking = trackingNumber && trackingNumber.trim() ? trackingNumber.trim() : generateTrackingCode(carrierEnum);
    const estDays = Number(estimatedDeliveryDays) || 2;
    const estimatedDate = new Date(Date.now() + estDays * 24 * 3600 * 1000);

    const metaJson = JSON.stringify({
      packageType: packageType || 'STANDARD_BOX',
      shippingCost: Number(shippingCost) || 5.99,
      orderNumber: orderNumber || undefined,
      destinationPostalCode,
      destinationCountry: destinationCountry || 'España',
      userNotes: notes || undefined,
    });

    const created = await prisma.shipment.create({
      data: {
        tenantId,
        trackingNumber: finalTracking,
        carrier: carrierEnum,
        recipientName,
        recipientPhone: recipientPhone || null,
        recipientEmail: recipientEmail || null,
        recipientAddress: destinationAddress,
        recipientCity: destinationCity,
        origin: 'Almacén de origen',
        destination: `${destinationAddress}, ${destinationPostalCode} ${destinationCity}`,
        status: 'PRE_TRANSIT',
        weightKg: Number(weightKg) || 1.0,
        estimatedDelivery: estimatedDate,
        notes: metaJson,
        checkpoints: {
          create: [
            {
              status: 'PRE_TRANSIT',
              description: `Envío generado y registrado en la red de ${carrierEnum}. En espera de recogida.`,
              location: 'Almacén de origen',
              timestamp: new Date(),
            },
          ],
        },
      },
      include: { checkpoints: true },
    });

    res.status(201).json({ success: true, data: formatShipment(created) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/logistics/shipments/:id
 * Get single shipment with full tracking timeline
 */
export async function getShipmentDetails(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user?.tenantId || 'master';
    const { id } = req.params;

    const found = await prisma.shipment.findFirst({
      where: {
        tenantId,
        OR: [{ id }, { trackingNumber: id }],
      },
      include: { checkpoints: true },
    });

    if (!found) {
      res.status(404).json({ success: false, message: 'Envío no encontrado' });
      return;
    }

    res.json({ success: true, data: formatShipment(found) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * PUT /api/logistics/shipments/:id/status
 * Progress shipment status and append tracking event
 */
export async function updateShipmentStatus(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user?.tenantId || 'master';
    const { id } = req.params;
    const { status, description, location, signatureProof } = req.body;

    const found = await prisma.shipment.findFirst({
      where: {
        tenantId,
        OR: [{ id }, { trackingNumber: id }],
      },
    });

    if (!found) {
      res.status(404).json({ success: false, message: 'Envío no encontrado' });
      return;
    }

    const newStatus = status as ShipmentStatus;
    const eventLocation = location || found.recipientCity || 'Delegación';

    await prisma.shipmentCheckpoint.create({
      data: {
        shipmentId: found.id,
        status: newStatus,
        description: description || `Estado actualizado a ${newStatus}`,
        location: eventLocation,
        timestamp: new Date(),
      },
    });

    let meta: any = {};
    if (found.notes) {
      try {
        if (found.notes.trim().startsWith('{')) {
          meta = JSON.parse(found.notes);
        }
      } catch {
        meta = { userNotes: found.notes };
      }
    }

    if (signatureProof) {
      meta.signatureProof = signatureProof;
    }

    const updated = await prisma.shipment.update({
      where: { id: found.id },
      data: {
        status: newStatus,
        actualDelivery: newStatus === 'DELIVERED' ? new Date() : found.actualDelivery,
        notes: JSON.stringify(meta),
      },
      include: { checkpoints: true },
    });

    res.json({ success: true, data: formatShipment(updated) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/logistics/stats
 * Aggregated shipment metrics: Active, in transit, delivered rate, carrier costs
 */
export async function getLogisticsStats(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user?.tenantId || 'master';
    const shipments = await getOrSeedShipments(tenantId);

    const totalShipments = shipments.length;
    const deliveredCount = shipments.filter((s) => s.status === 'DELIVERED').length;
    const outForDeliveryCount = shipments.filter((s) => s.status === 'OUT_FOR_DELIVERY').length;
    const inTransitCount = shipments.filter((s) => s.status === 'IN_TRANSIT').length;
    const preTransitCount = shipments.filter((s) => s.status === 'PRE_TRANSIT').length;
    const exceptionCount = shipments.filter((s) => s.status === 'EXCEPTION').length;

    const activeShipments = inTransitCount + outForDeliveryCount + preTransitCount;
    const deliveryRate = totalShipments > 0 ? (deliveredCount / totalShipments) * 100 : 0;
    const totalShippingSpend = shipments.reduce((sum, s) => sum + (s.shippingCost || 0), 0);

    const carrierBreakdown: Record<string, { carrier: string; count: number; totalCost: number; delivered: number }> = {};
    for (const s of shipments) {
      if (!carrierBreakdown[s.carrier]) {
        carrierBreakdown[s.carrier] = { carrier: s.carrier, count: 0, totalCost: 0, delivered: 0 };
      }
      carrierBreakdown[s.carrier].count += 1;
      carrierBreakdown[s.carrier].totalCost += s.shippingCost || 0;
      if (s.status === 'DELIVERED') {
        carrierBreakdown[s.carrier].delivered += 1;
      }
    }

    res.json({
      success: true,
      data: {
        totalShipments,
        activeShipments,
        deliveredCount,
        outForDeliveryCount,
        inTransitCount,
        exceptionCount,
        deliveryRate: Number(deliveryRate.toFixed(1)),
        totalShippingSpend: Number(totalShippingSpend.toFixed(2)),
        carrierBreakdown: Object.values(carrierBreakdown),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/logistics/export/csv
 * Export shipments manifest to CSV / Excel
 */
export async function exportShipmentsCsv(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user?.tenantId || 'master';
    const shipments = await getOrSeedShipments(tenantId);
    const { generateCsvBuffer } = await import('../../services/report-exporter.service');

    const headers = [
      'Nº Seguimiento (Tracking)',
      'Transportista',
      'Destinatario',
      'Teléfono',
      'Email',
      'Dirección Entrega',
      'Ciudad',
      'Código Postal',
      'País',
      'Estado Envío',
      'Tipo Paquete',
      'Peso (Kg)',
      'Coste Envío (€)',
      'Nº Pedido / Referencia',
      'Fecha Creación',
      'Fecha Estimada Entrega',
      'Fecha Real Entrega',
      'Firma / DNI',
    ];

    const rows = shipments.map((s) => [
      s.trackingNumber,
      s.carrier,
      s.recipientName,
      s.recipientPhone || '',
      s.recipientEmail || '',
      s.destinationAddress,
      s.destinationCity,
      s.destinationPostalCode,
      s.destinationCountry,
      s.status,
      s.packageType,
      s.weightKg,
      s.shippingCost.toFixed(2),
      s.orderNumber || '',
      new Date(s.createdAt).toLocaleDateString('es-ES'),
      new Date(s.estimatedDeliveryDate).toLocaleDateString('es-ES'),
      s.actualDeliveryDate ? new Date(s.actualDeliveryDate).toLocaleDateString('es-ES') : '',
      s.signatureProof || '',
    ]);

    const csvBuf = generateCsvBuffer(headers, rows);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=manifiesto_envios_${tenantId}_${Date.now()}.csv`);
    res.send(csvBuf);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/logistics/export/pdf
 * Export official Shipping Manifest & Delivery Report
 */
export async function exportShipmentsPdf(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user?.tenantId || 'master';
    const shipments = await getOrSeedShipments(tenantId);
    const { generateReportPdf } = await import('../../services/report-exporter.service');

    const totalShipments = shipments.length;
    const deliveredCount = shipments.filter((s) => s.status === 'DELIVERED').length;
    const totalSpend = shipments.reduce((sum, s) => sum + (s.shippingCost || 0), 0);
    const inTransit = shipments.filter((s) => ['IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(s.status)).length;

    const tableHeaders = ['Tracking', 'Agencia', 'Destinatario', 'Ciudad', 'Coste (€)', 'Estado'];
    const tableRows = shipments.slice(0, 45).map((s) => [
      s.trackingNumber,
      s.carrier,
      s.recipientName.slice(0, 24),
      s.destinationCity,
      `${s.shippingCost.toFixed(2)}€`,
      s.status === 'DELIVERED' ? 'Entregado' : s.status === 'OUT_FOR_DELIVERY' ? 'En Reparto' : s.status,
    ]);

    const pdfBuf = await generateReportPdf({
      title: 'Manifiesto de Envíos & Seguimiento Logístico',
      subtitle: 'Informe consolidado de paquetería multicarrier (GLS, NACEX, Amazon, Correos, DHL)',
      companyName: 'DAMA-CRM Logistics Hub',
      dateRange: `Expediciones registradas a ${new Date().toLocaleDateString('es-ES')}`,
      kpis: [
        { label: 'Total Envíos', value: totalShipments, color: '#2563EB' },
        { label: 'En Reparto / Tránsito', value: inTransit, color: '#F59E0B' },
        { label: 'Entregados con Éxito', value: deliveredCount, color: '#10B981' },
        { label: 'Gasto Portes', value: `${totalSpend.toFixed(2)}€`, color: '#8B5CF6' },
      ],
      tableHeaders,
      tableRows,
      summaryNotes: [
        '* Manifiesto oficial de expedición para control de mensajería, transportistas y albaranes.',
        '* Trazabilidad completa con eventos de tracking en tiempo real e identificación de entrega.',
      ],
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=informe_logistica_${tenantId}_${Date.now()}.pdf`);
    res.send(pdfBuf);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
