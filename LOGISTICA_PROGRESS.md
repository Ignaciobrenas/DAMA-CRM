# LOGISTICA_PROGRESS.md - Progreso y Auditoría del Módulo de Logística

## Estado General: En Progreso
**Fecha inicio**: 21 de Octubre de 2026  
**Rama**: `feat/logistica`  
**Objetivo**: Logística y Paquetería de DAMA-CRM 100% funcional, con logos reales SVG de alta calidad de todos los transportistas, integración con albaranes/pedidos/stock, seguimiento real de envíos, cotizador de tarifas, manifiestos y suite E2E de Playwright.

---

## Fase 0: Auditoría Inicial

### 1. Modelo de Datos y Backend Existente
- **Modelos en Prisma**:
  - `Shipment`: contiene campos básicos (`trackingNumber`, `carrier`, `recipientName`, `destination`, `status`, `weightKg`, `notes`).
  - `ShipmentCheckpoint`: eventos de seguimiento (`status`, `location`, `description`, `timestamp`).
  - *Carencias detectadas*: faltan campos tipados para volumen/medidas (largo, ancho, alto), contrarreembolso (COD), seguro, bultos múltiples (parcels count), tipo de servicio (24h, 14h, 10h, recogida, etc.), albarán asociado (`deliveryNoteId`), credenciales de transportistas (`CarrierSetting`), y tarifas dinámicas (`CarrierRateRule`). Actualmente se guardaba parte en un JSON de `notes`.
- **Controlador (`logistics.controller.ts`)**:
  - Rutas básicas: `listShipments`, `createShipment`, `getShipmentDetails`, `updateShipmentStatus`, `getLogisticsStats`, `exportShipmentsCsv`, `exportShipmentsPdf`.
  - *Carencias*: faltaba conector con APIs reales o URL de tracking oficial por agencia, generador de etiquetas térmicas PDF (10x15cm con código de barras/QR), cotizador en tiempo real entre agencias, manifiesto de cierre diario formal con firma de chófer, y gestión de incidencias/devoluciones con recogida inversa.

### 2. Frontend Actual (`Logistics.tsx`)
- Interfaz existente basada en pestañas ('shipments', 'analytics', 'connectors').
- *Carencias detectadas*:
  - Solo 7 agencias mockeadas (`GLS`, `NACEX`, `AMAZON`, `CORREOS_EXPRESS`, `DHL`, `MRW`, `SEUR`). Faltan las 15 agencias requeridas por especificación (Correos, UPS, FedEx, TNT, DPD, Envialia, InPost, Packlink, Zeleris, Tipsa, Celeritas, Chronopost, Cabify Logistics, Redyser, Ontime).
  - No existía componente `CarrierLogo` con logos SVG reales ni chip de contraste para modo claro/oscuro.
  - La pestaña de conectores solo tenía botones estáticos sin configuración real ni prueba de conexión.
  - No existía modal de cotización de tarifas ni integración visual con albaranes o pedidos.
  - Falta generación de etiqueta de envío física imprimible.

### 3. Inventario de Transportistas Existentes vs Requeridos
- **Existentes**: GLS, Nacex, Amazon, Correos Express, DHL, SEUR, MRW (7).
- **A añadir para completar los 22 requeridos**:
  1. Correos
  2. Correos Express (ya en lista, requiere logo SVG oficial)
  3. SEUR (requiere logo SVG oficial)
  4. MRW (requiere logo SVG oficial)
  5. GLS (requiere logo SVG oficial)
  6. DHL (requiere logo SVG oficial)
  7. UPS
  8. FedEx
  9. TNT
  10. DPD
  11. Nacex (requiere logo SVG oficial)
  12. Envialia
  13. InPost
  14. Packlink
  15. Zeleris
  16. Tipsa
  17. Celeritas
  18. Amazon Logistics (Amazon Shipping)
  19. Chronopost
  20. Cabify Logistics
  21. Redyser
  22. Ontime

---

## Decisiones Técnicas y de Arquitectura
1. **Directorio de Assets**: `client/public/assets/carriers/*.svg` (archivos normalizados en minúsculas, limpios de scripts y metadatos con viewBox estándar).
2. **Componente `CarrierLogo`**:
   - `client/src/components/logistics/CarrierLogo.tsx`
   - Tamaños: `sm` (20px), `md` (28px), `lg` (40px), `xl` (56px).
   - Chip de contraste con fondo neutro translúcido `bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80` para perfecta legibilidad en fondos oscuros y claros.
   - Fallback accesible con iniciales estilizadas sobre fondo pastel en caso de error de carga.
3. **Módulo de Trazabilidad Real & APIs de Transportistas**:
   - Servicio backend `server/src/modules/logistics/carrier-tracker.service.ts`:
     - URLs de seguimiento oficiales verificadas para cada transportista (Correos, SEUR, DHL, GLS, UPS, FedEx, InPost, etc.).
     - Clientes API / conectores configurables para consultar APIs públicas o credenciales de cliente (API keys).
     - Endpoint `POST /api/logistics/shipments/:id/sync-tracking` para sincronizar en tiempo real el estado y los checkpoints.
4. **Cotizador de Tarifas**:
   - Endpoint `POST /api/logistics/rates/compare` para calcular precios y tiempos de tránsito según peso, dimensiones y destino (Península, Baleares, Canarias, Internacional).
5. **Generador de Etiquetas Térmicas (PDF)**:
   - Endpoint `GET /api/logistics/shipments/:id/label` con PDFKit generando etiqueta oficial A6 / 10x15cm con códigos QR, barras, datos de expedidor/consignatario y bulto X de Y.
6. **Integración con Albaranes & Stock**:
   - Creación de envío desde un albarán / pedido con autocompletado y actualización del estado del albarán a "ENVIADO" o "ENTREGADO".
