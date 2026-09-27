import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(__dirname, '../../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

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

function getShipmentsFilePath(tenantId: string): string {
  return path.join(DATA_DIR, `shipments_${tenantId}.json`);
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

function loadShipments(tenantId: string): ShipmentData[] {
  const filePath = getShipmentsFilePath(tenantId);
  if (!fs.existsSync(filePath)) {
    const starter: ShipmentData[] = [
      {
        id: 'shp-001',
        tenantId,
        trackingNumber: 'GLS-ES-88349102',
        carrier: 'GLS',
        recipientName: 'Marta Delgado - Salón Estilistas Madrid',
        recipientPhone: '+34 622 112 334',
        recipientEmail: 'marta@estilistasdelgado.es',
        destinationAddress: 'Calle Serrano 45, 2ºA',
        destinationCity: 'Madrid',
        destinationPostalCode: '28001',
        destinationCountry: 'España',
        status: 'OUT_FOR_DELIVERY',
        weightKg: 3.4,
        packageType: 'STANDARD_BOX',
        shippingCost: 7.95,
        orderNumber: 'PED-2026-089',
        notes: 'Productos de cosmética capilar y champús profesionales.',
        estimatedDeliveryDate: new Date().toISOString(),
        events: [
          {
            id: 'evt-1',
            status: 'PRE_TRANSIT',
            description: 'Envío registrado en plataforma y etiqueta generada',
            location: 'Almacén Central (Barcelona)',
            timestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
          },
          {
            id: 'evt-2',
            status: 'IN_TRANSIT',
            description: 'Paquete clasificado en Hub Logístico Principal y en tránsito',
            location: 'Hub Central Coslada (Madrid)',
            timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
          },
          {
            id: 'evt-3',
            status: 'OUT_FOR_DELIVERY',
            description: 'Paquete asignado a repartidor. Entrega estimada hoy antes de las 18:00h',
            location: 'Delegación GLS Madrid Centro',
            timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
          },
        ],
        createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'shp-002',
        tenantId,
        trackingNumber: 'NCX-94810239',
        carrier: 'NACEX',
        recipientName: 'Alejandro Sanz - Barbería Clásica',
        recipientPhone: '+34 677 889 900',
        recipientEmail: 'alejandro@barberiasanz.com',
        destinationAddress: 'Avinguda Diagonal 230',
        destinationCity: 'Barcelona',
        destinationPostalCode: '08018',
        destinationCountry: 'España',
        status: 'DELIVERED',
        weightKg: 1.8,
        packageType: 'STANDARD_BOX',
        shippingCost: 6.5,
        orderNumber: 'PED-2026-082',
        notes: 'Cuchillas de afeitar y máquinas de corte Wahl.',
        estimatedDeliveryDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        actualDeliveryDate: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
        signatureProof: 'Firmado por: A. Sanz (DNI: ***4321*)',
        events: [
          {
            id: 'evt-10',
            status: 'PRE_TRANSIT',
            description: 'Recogida solicitada en almacén',
            location: 'Hub Valencia',
            timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
          },
          {
            id: 'evt-11',
            status: 'IN_TRANSIT',
            description: 'Llegada a plataforma de distribución regional',
            location: 'Centro Distribución El Prat (Barcelona)',
            timestamp: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
          },
          {
            id: 'evt-12',
            status: 'DELIVERED',
            description: 'Paquete entregado correctamente en destino',
            location: 'Barcelona',
            timestamp: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
          },
        ],
        createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'shp-003',
        tenantId,
        trackingNumber: 'TBA93821049ES',
        carrier: 'AMAZON',
        recipientName: 'Clínica Dermocosmética Bellasur',
        recipientPhone: '+34 655 123 789',
        recipientEmail: 'pedidos@bellasur.es',
        destinationAddress: 'Plaza Nueva 12',
        destinationCity: 'Sevilla',
        destinationPostalCode: '41001',
        destinationCountry: 'España',
        status: 'IN_TRANSIT',
        weightKg: 5.2,
        packageType: 'STANDARD_BOX',
        shippingCost: 8.4,
        orderNumber: 'AMZ-ES-40291',
        notes: 'Envío Fulfillment by Amazon (FBA) prioritario.',
        estimatedDeliveryDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        events: [
          {
            id: 'evt-20',
            status: 'PRE_TRANSIT',
            description: 'Envío empaquetado en centro logístico Amazon MAD4',
            location: 'San Fernando de Henares (Madrid)',
            timestamp: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
          },
          {
            id: 'evt-21',
            status: 'IN_TRANSIT',
            description: 'En tránsito hacia la estación de entrega local',
            location: 'Estación Logística Amazon SVQ1 (Sevilla)',
            timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
          },
        ],
        createdAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    fs.writeFileSync(filePath, JSON.stringify(starter, null, 2), 'utf8');
    return starter;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return [];
  }
}

function saveShipments(tenantId: string, shipments: ShipmentData[]): void {
  fs.writeFileSync(getShipmentsFilePath(tenantId), JSON.stringify(shipments, null, 2), 'utf8');
}

/**
 * GET /api/logistics/shipments
 * List shipments with optional carrier, status, or search filters
 */
export async function listShipments(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user?.tenantId || 'master';
    const { carrier, status, query } = req.query;

    let shipments = loadShipments(tenantId);

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

    // Sort by createdAt descending
    shipments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
    const estimatedDate = new Date(Date.now() + estDays * 24 * 3600 * 1000).toISOString();

    const initialEvent: TrackingEvent = {
      id: `evt-${Date.now()}`,
      status: 'PRE_TRANSIT',
      description: `Envío generado y registrado en la red de ${carrierEnum}. En espera de recogida.`,
      location: 'Almacén de origen',
      timestamp: new Date().toISOString(),
    };

    const newShipment: ShipmentData = {
      id: `shp-${Date.now()}`,
      tenantId,
      trackingNumber: finalTracking,
      carrier: carrierEnum,
      recipientName,
      recipientPhone,
      recipientEmail,
      destinationAddress,
      destinationCity,
      destinationPostalCode,
      destinationCountry: destinationCountry || 'España',
      status: 'PRE_TRANSIT',
      weightKg: Number(weightKg) || 1.0,
      packageType: packageType || 'STANDARD_BOX',
      shippingCost: Number(shippingCost) || 5.99,
      orderNumber,
      notes,
      estimatedDeliveryDate: estimatedDate,
      events: [initialEvent],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const shipments = loadShipments(tenantId);
    shipments.unshift(newShipment);
    saveShipments(tenantId, shipments);

    res.status(201).json({ success: true, data: newShipment });
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

    const shipments = loadShipments(tenantId);
    const found = shipments.find((s) => s.id === id || s.trackingNumber === id);

    if (!found) {
      res.status(404).json({ success: false, message: 'Envío no encontrado' });
      return;
    }

    res.json({ success: true, data: found });
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

    const shipments = loadShipments(tenantId);
    const index = shipments.findIndex((s) => s.id === id || s.trackingNumber === id);

    if (index === -1) {
      res.status(404).json({ success: false, message: 'Envío no encontrado' });
      return;
    }

    const current = shipments[index];
    const newStatus = status as ShipmentStatus;

    const newEvent: TrackingEvent = {
      id: `evt-${Date.now()}`,
      status: newStatus,
      description: description || `Estado actualizado a ${newStatus}`,
      location: location || current.destinationCity,
      timestamp: new Date().toISOString(),
    };

    const updated: ShipmentData = {
      ...current,
      status: newStatus,
      events: [...current.events, newEvent],
      signatureProof: signatureProof || current.signatureProof,
      actualDeliveryDate: newStatus === 'DELIVERED' ? new Date().toISOString() : current.actualDeliveryDate,
      updatedAt: new Date().toISOString(),
    };

    shipments[index] = updated;
    saveShipments(tenantId, shipments);

    res.json({ success: true, data: updated });
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
    const shipments = loadShipments(tenantId);

    const totalShipments = shipments.length;
    const deliveredCount = shipments.filter((s) => s.status === 'DELIVERED').length;
    const outForDeliveryCount = shipments.filter((s) => s.status === 'OUT_FOR_DELIVERY').length;
    const inTransitCount = shipments.filter((s) => s.status === 'IN_TRANSIT').length;
    const preTransitCount = shipments.filter((s) => s.status === 'PRE_TRANSIT').length;
    const exceptionCount = shipments.filter((s) => s.status === 'EXCEPTION').length;

    const activeShipments = inTransitCount + outForDeliveryCount + preTransitCount;
    const deliveryRate = totalShipments > 0 ? (deliveredCount / totalShipments) * 100 : 0;
    const totalShippingSpend = shipments.reduce((sum, s) => sum + (s.shippingCost || 0), 0);

    // Group by Carrier
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
