import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export interface InvoicePdfItem {
  sku?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  amount: number;
}

export interface InvoicePdfData {
  invoiceNumber: string;
  type: 'FACTURA' | 'PRESUPUESTO' | 'ALBARAN_TRASPASO';
  invoiceType?: string; // F1, F2, R1, R2, R3, R4, R5
  issueDate: string; // ISO 8601 (YYYY-MM-DD)
  dueDate?: string; // ISO 8601 (YYYY-MM-DD)
  status: string; // DRAFT, SENT, PAID, OVERDUE, ACCEPTED, REJECTED, etc.
  companyName: string;
  companyTaxId?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyWebsite?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  clientName: string;
  clientEmail?: string;
  clientTaxId?: string;
  clientAddress?: string;
  clientPhone?: string;
  items: InvoicePdfItem[];
  subtotal: number;
  discountPercent?: number;
  discountAmount?: number;
  taxRate: number;
  taxAmount: number;
  irpfRate?: number;
  irpfAmount?: number;
  total: number;
  currency?: string; // ISO 4217, e.g. 'EUR', 'USD'
  notes?: string;
  paymentTerms?: string;
  bankAccount?: string;
  // Veri*Factu (RD 1007/2023 & Orden HAC/1177/2024)
  verifactuQrBuffer?: Buffer;
  verifactuHash?: string;
  previousInvoiceHash?: string;
  verifactuQrUrl?: string;
  verifactuCsv?: string;
  issuerNif?: string;
  isVerifactu?: boolean;
  isRectifying?: boolean;
  rectifiesInvoiceId?: string;
  rectifyingReason?: string;
  // PDF Design Studio Customization
  pdfTemplate?: 'MODERN_STRIPE' | 'CORPORATE_SAGE' | 'CLASSIC_EXECUTIVE' | 'MINIMAL_SWISS';
  pdfShowLogo?: boolean;
  pdfLogoPosition?: 'LEFT' | 'RIGHT';
  pdfShowVerifactuQr?: boolean;
  pdfShowBankDetails?: boolean;
  pdfShowSignatureBox?: boolean;
  pdfShowWatermark?: boolean;
  pdfWatermarkText?: string;
  pdfHeaderSubtitle?: string;
  pdfMercantileRegistry?: string;
  pdfLopdText?: string;
  pdfFooterLegalText?: string;
}

// -----------------------------------------------------------------------------
// Formatters & ISO Standard Helpers
// -----------------------------------------------------------------------------

export function formatIsoDate(dateVal?: string | Date): string {
  if (!dateVal) return '';
  const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
  if (isNaN(d.getTime())) return String(dateVal);
  return d.toISOString().split('T')[0]; // ISO 8601: YYYY-MM-DD
}

export function formatIsoCurrency(amount: number, currency: string = 'EUR'): string {
  const code = (currency || 'EUR').toUpperCase();
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(num);

  return `${formatted} ${code}`;
}

function getStatusBadge(status: string, type: string) {
  const upper = (status || '').toUpperCase();
  switch (upper) {
    case 'PAID':
    case 'PAGADA':
    case 'ACCEPTED':
    case 'ACEPTADO':
    case 'RECEIVED':
      return { label: upper === 'PAID' ? 'PAGADA' : upper === 'RECEIVED' ? 'RECEPCIONADO' : 'ACEPTADO', bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
    case 'SENT':
    case 'ENVIADO':
    case 'PENDING':
    case 'PENDIENTE':
    case 'IN_TRANSIT':
      return { label: upper === 'IN_TRANSIT' ? 'EN TRÁNSITO' : 'PENDIENTE', bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD' };
    case 'OVERDUE':
    case 'VENCIDA':
    case 'REJECTED':
    case 'RECHAZADO':
    case 'WITH_DISCREPANCIES':
      return { label: upper === 'REJECTED' ? 'RECHAZADO' : upper === 'WITH_DISCREPANCIES' ? 'CON MERMAS' : 'VENCIDA', bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5' };
    case 'CANCELLED':
    case 'CANCELADA':
      return { label: 'CANCELADA', bg: '#F3F4F6', text: '#4B5563', border: '#D1D5DB' };
    case 'DRAFT':
    case 'BORRADOR':
    default:
      return { label: type === 'PRESUPUESTO' ? 'VIGENTE' : 'EMITIDA', bg: '#F1F5F9', text: '#334155', border: '#CBD5E1' };
  }
}

/**
 * Resolves company custom logo if provided; otherwise returns the official
 * immutable DAMA placeholder logo from client/public/assets/logos/dama-logo-dark.png
 */
export function resolveLogo(logoUrl?: string): Buffer | null {
  // 1. Custom Data URI (Base64 PNG/JPEG uploaded by company)
  if (logoUrl && logoUrl.startsWith('data:image/')) {
    try {
      const base64Data = logoUrl.replace(/^data:image\/[\w+]+;base64,/, '');
      return Buffer.from(base64Data, 'base64');
    } catch {}
  }

  // 2. Explicit custom file path
  if (logoUrl && !logoUrl.includes('dama-logo') && !logoUrl.includes('dama-symbol')) {
    const cleanRel = logoUrl.replace(/^\.?\//, '');
    const customCandidates = [
      logoUrl,
      path.resolve(process.cwd(), cleanRel),
      path.resolve(process.cwd(), 'client/public', cleanRel),
      path.resolve(__dirname, '../../../../client/public', cleanRel),
      path.resolve(__dirname, '../../../client/public', cleanRel),
    ];
    for (const candidate of customCandidates) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        try {
          return fs.readFileSync(candidate);
        } catch {}
      }
    }
  }

  // 3. Official Immutable DAMA Placeholder Logo (client/public/assets/logos/dama-logo-dark.png)
  const officialDamaPlaceholders = [
    path.resolve(__dirname, '../../../../client/public/assets/logos/dama-logo-dark.png'),
    path.resolve(__dirname, '../../../client/public/assets/logos/dama-logo-dark.png'),
    path.resolve(process.cwd(), 'client/public/assets/logos/dama-logo-dark.png'),
    path.resolve(process.cwd(), '../client/public/assets/logos/dama-logo-dark.png'),
    path.resolve(__dirname, '../../../../client/public/assets/logos/dama-logo-color.png'),
    path.resolve(process.cwd(), 'client/public/assets/logos/dama-logo-color.png'),
  ];

  for (const assetPath of officialDamaPlaceholders) {
    if (fs.existsSync(assetPath)) {
      try {
        return fs.readFileSync(assetPath);
      } catch {}
    }
  }

  return null;
}

// -----------------------------------------------------------------------------
// Main Enterprise PDF Generation Engine
// -----------------------------------------------------------------------------

export function generatePdfBuffer(data: InvoicePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const template = data.pdfTemplate || 'MODERN_STRIPE';
      const primaryColor =
        data.primaryColor && /^#[0-9A-Fa-f]{6}$/.test(data.primaryColor)
          ? data.primaryColor
          : template === 'CORPORATE_SAGE'
          ? '#059669'
          : template === 'CLASSIC_EXECUTIVE'
          ? '#0F172A'
          : '#2563EB';

      const secondaryColor =
        data.secondaryColor && /^#[0-9A-Fa-f]{6}$/.test(data.secondaryColor)
          ? data.secondaryColor
          : '#0F172A';

      const showLogo = data.pdfShowLogo !== false;
      const logoPosition = data.pdfLogoPosition || 'LEFT';
      const showVerifactuQr = data.pdfShowVerifactuQr !== false;
      const showBankDetails = data.pdfShowBankDetails !== false;
      const showSignatureBox = data.pdfShowSignatureBox !== false;

      const issueDateIso = formatIsoDate(data.issueDate);
      const dueDateIso = data.dueDate ? formatIsoDate(data.dueDate) : undefined;
      const currencyIso = (data.currency || 'EUR').toUpperCase();

      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true,
        info: {
          Title: `${data.type} ${data.invoiceNumber}`,
          Author: data.companyName || 'DAMA-CRM',
          Subject: `${data.type} mercantil ${data.invoiceNumber} emitida para ${data.clientName}`,
          Keywords: `DAMA-CRM, VeriFactu, RD-1007-2023, Orden-HAC-1177-2024, ISO-216, ISO-8601`,
          Creator: 'DAMA-CRM Enterprise Document Studio v2.0',
          Producer: 'PDFKit Veri*Factu Compliance Engine',
          CreationDate: new Date(),
          ModDate: new Date(),
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const pageWidth = doc.page.width; // 595.28
      const margin = 40;
      const contentWidth = pageWidth - margin * 2; // 515.28
      const maxContentY = 710;

      const logoBuffer = showLogo ? resolveLogo(data.logoUrl) : null;

      // Helper to render diagonal subtle watermark if enabled
      const renderWatermark = () => {
        if (!data.pdfShowWatermark && data.status !== 'DRAFT') return;
        const wmText = data.pdfWatermarkText || (data.status === 'DRAFT' ? 'BORRADOR SIN VALIDEZ FISCAL' : 'ORIGINAL · VERI*FACTU');
        doc.save();
        doc.rotate(-35, { origin: [pageWidth / 2, 420] });
        doc.fontSize(38).font('Helvetica-Bold').fillColor('#E2E8F0').opacity(0.28);
        doc.text(wmText.toUpperCase(), 60, 400, { width: 480, align: 'center' });
        doc.restore();
        doc.opacity(1);
      };

      // Helper to render table headers according to template
      const renderTableHeader = (y: number) => {
        if (template === 'MINIMAL_SWISS') {
          doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor('#0F172A').lineWidth(1.5).stroke();
          doc.moveTo(margin, y + 22).lineTo(pageWidth - margin, y + 22).strokeColor('#CBD5E1').lineWidth(0.75).stroke();
          doc.fontSize(8).font('Helvetica-Bold').fillColor('#0F172A');
        } else {
          doc.roundedRect(margin, y, contentWidth, 22, template === 'MODERN_STRIPE' ? 3 : 0).fill(primaryColor);
          doc.fontSize(8).font('Helvetica-Bold').fillColor('#FFFFFF');
        }
        doc.text('#', margin + 6, y + 6.5, { width: 22, align: 'center' });
        doc.text('CONCEPTO / DESCRIPCIÓN', margin + 34, y + 6.5, { width: 250, align: 'left' });
        doc.text('CANT.', margin + 290, y + 6.5, { width: 45, align: 'right' });
        doc.text('PRECIO UNIT.', margin + 345, y + 6.5, { width: 75, align: 'right' });
        doc.text('IMPORTE NETO', margin + 430, y + 6.5, { width: 79, align: 'right' });
      };

      // Helper to render continuation page header
      const renderContinuationHeader = () => {
        doc.rect(0, 0, pageWidth, 5).fill(primaryColor);
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#334155');
        doc.text(data.companyName || 'DAMA-CRM', margin, 18);

        doc.fontSize(8.5).font('Helvetica-Bold').fillColor(primaryColor);
        doc.text(`${data.type} ${data.invoiceNumber} · CONTINUACIÓN`, margin, 18, {
          width: contentWidth,
          align: 'right',
        });

        doc.moveTo(margin, 34).lineTo(pageWidth - margin, 34).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
        renderWatermark();
      };

      // -----------------------------------------------------------------------
      // 1. PAGE 1: Top Accent Banner & Template Header
      // -----------------------------------------------------------------------
      if (template === 'CORPORATE_SAGE') {
        doc.rect(0, 0, pageWidth, 12).fill(primaryColor);
        doc.rect(0, 12, pageWidth, 3).fill(secondaryColor);
      } else if (template === 'CLASSIC_EXECUTIVE') {
        doc.rect(margin, 18, contentWidth, 3).fill(primaryColor);
      } else if (template === 'MODERN_STRIPE') {
        doc.rect(0, 0, pageWidth, 7).fill(primaryColor);
      }

      renderWatermark();

      const headerTopY = 26;
      const logoX = logoPosition === 'RIGHT' ? pageWidth - margin - 145 : margin;
      const titleAlign = logoPosition === 'RIGHT' ? 'left' : 'right';

      // Render Company Custom Logo OR Official DAMA Placeholder Logo
      if (logoBuffer) {
        try {
          doc.image(logoBuffer, logoX, headerTopY, { fit: [145, 46] });
        } catch {
          doc.fontSize(19).font('Helvetica-Bold').fillColor(primaryColor).text(data.companyName || 'DAMA-CRM', logoX, headerTopY + 4);
        }
      } else {
        doc.fontSize(19).font('Helvetica-Bold').fillColor(primaryColor).text(data.companyName || 'DAMA-CRM', logoX, headerTopY + 2);
        doc.fontSize(8).font('Helvetica').fillColor('#64748B').text(
          data.pdfHeaderSubtitle || 'Sistemas de Gestión Empresarial & ERP Cloud',
          logoX,
          headerTopY + 24
        );
      }

      // Document Type, Fiscal Classification & Number
      const docTypeLabel =
        data.type === 'FACTURA'
          ? data.isRectifying
            ? 'FACTURA RECTIFICATIVA'
            : 'FACTURA ORDINARIA'
          : data.type === 'ALBARAN_TRASPASO'
          ? 'ALBARÁN DE CIRCULACIÓN'
          : 'PRESUPUESTO COMERCIAL';

      doc.fontSize(17).font('Helvetica-Bold').fillColor(primaryColor).text(docTypeLabel, margin, headerTopY, {
        width: contentWidth,
        align: titleAlign,
      });

      const fiscalSub =
        data.type === 'FACTURA'
          ? `Nº Serie: ${data.invoiceNumber} · Tipo AEAT: ${data.invoiceType || (data.isRectifying ? 'R1' : 'F1')}`
          : `Documento Nº: ${data.invoiceNumber}`;

      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#1E293B').text(fiscalSub, margin, headerTopY + 22, {
        width: contentWidth,
        align: titleAlign,
      });

      // Status Badge Pill
      const badge = getStatusBadge(data.status, data.type);
      const badgeWidth = 86;
      const badgeHeight = 16;
      const badgeX = logoPosition === 'RIGHT' ? margin : pageWidth - margin - badgeWidth;
      const badgeY = headerTopY + 38;

      doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 3).fillAndStroke(badge.bg, badge.border);
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor(badge.text).text(badge.label, badgeX, badgeY + 4, {
        width: badgeWidth,
        align: 'center',
      });

      // Header Divider Line
      doc.moveTo(margin, 86).lineTo(pageWidth - margin, 86).strokeColor('#CBD5E1').lineWidth(0.75).stroke();

      // -----------------------------------------------------------------------
      // 2. Issuer & Client Information Cards
      // -----------------------------------------------------------------------
      const infoY = 95;
      const colWidth = (contentWidth - 20) / 2;
      const rightColX = margin + colWidth + 20;

      // Subtle card backgrounds for MODERN_STRIPE and CORPORATE_SAGE
      if (template === 'MODERN_STRIPE' || template === 'CORPORATE_SAGE') {
        doc.roundedRect(margin, infoY, colWidth, 72, 4).fillAndStroke('#F8FAFC', '#E2E8F0');
        doc.roundedRect(rightColX, infoY, colWidth, 72, 4).fillAndStroke('#F8FAFC', '#E2E8F0');
      }

      const padX = template === 'MODERN_STRIPE' || template === 'CORPORATE_SAGE' ? 10 : 0;
      const padY = template === 'MODERN_STRIPE' || template === 'CORPORATE_SAGE' ? 8 : 0;

      // Left Box: EMISOR
      doc.fontSize(7).font('Helvetica-Bold').fillColor(primaryColor).text('EMISOR / RAZÓN SOCIAL', margin + padX, infoY + padY);
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#0F172A').text(data.companyName || 'DAMA CRM', margin + padX, infoY + padY + 11);

      let issuerCursor = infoY + padY + 23;
      doc.fontSize(8).font('Helvetica').fillColor('#334155');
      if (data.companyTaxId) {
        doc.font('Helvetica-Bold').text('NIF/CIF: ', margin + padX, issuerCursor, { continued: true });
        doc.font('Helvetica').text(data.companyTaxId);
        issuerCursor += 11;
      }
      if (data.companyAddress) {
        doc.text(data.companyAddress, margin + padX, issuerCursor, { width: colWidth - padX * 2 });
        issuerCursor += 11;
      }
      if (data.companyEmail || data.companyPhone) {
        const contactLine = [data.companyEmail, data.companyPhone].filter(Boolean).join(' · ');
        doc.fillColor('#64748B').text(contactLine, margin + padX, issuerCursor, { width: colWidth - padX * 2 });
      }

      // Right Box: CLIENTE / DESTINATARIO
      doc.fontSize(7).font('Helvetica-Bold').fillColor(primaryColor).text('CLIENTE / DESTINATARIO FISCAL', rightColX + padX, infoY + padY);
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#0F172A').text(data.clientName || 'Cliente General', rightColX + padX, infoY + padY + 11);

      let clientCursor = infoY + padY + 23;
      doc.fontSize(8).font('Helvetica').fillColor('#334155');
      if (data.clientTaxId) {
        doc.font('Helvetica-Bold').text('NIF/CIF: ', rightColX + padX, clientCursor, { continued: true });
        doc.font('Helvetica').text(data.clientTaxId);
        clientCursor += 11;
      }
      if (data.clientAddress) {
        doc.text(data.clientAddress, rightColX + padX, clientCursor, { width: colWidth - padX * 2 });
        clientCursor += 11;
      }
      if (data.clientEmail || data.clientPhone) {
        const clientContactLine = [data.clientEmail, data.clientPhone].filter(Boolean).join(' · ');
        doc.fillColor('#64748B').text(clientContactLine, rightColX + padX, clientCursor, { width: colWidth - padX * 2 });
      }

      // -----------------------------------------------------------------------
      // 3. Metadata Strip (ISO 8601 Dates, Currency ISO 4217, Payment Terms)
      // -----------------------------------------------------------------------
      const metaY = infoY + 80;
      doc.roundedRect(margin, metaY, contentWidth, 26, 3).fill('#F1F5F9');
      doc.roundedRect(margin, metaY, contentWidth, 26, 3).strokeColor('#CBD5E1').lineWidth(0.5).stroke();

      const segWidth = contentWidth / 4;
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#64748B');
      doc.text('FECHA EXPEDICIÓN', margin + 10, metaY + 4);
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0F172A').text(issueDateIso, margin + 10, metaY + 13);

      const dueLabel = data.type === 'FACTURA' ? 'FECHA VENCIMIENTO' : 'VALIDEZ OFERTA';
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#64748B').text(dueLabel, margin + segWidth + 10, metaY + 4);
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0F172A').text(dueDateIso || 'A la vista', margin + segWidth + 10, metaY + 13);

      doc.fontSize(7).font('Helvetica-Bold').fillColor('#64748B').text('DIVISA (ISO 4217)', margin + segWidth * 2 + 10, metaY + 4);
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0F172A').text(currencyIso, margin + segWidth * 2 + 10, metaY + 13);

      doc.fontSize(7).font('Helvetica-Bold').fillColor('#64748B').text('FORMA DE PAGO', margin + segWidth * 3 + 10, metaY + 4);
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0F172A').text(
        (data.paymentTerms || 'Transferencia 30d').slice(0, 26),
        margin + segWidth * 3 + 10,
        metaY + 13
      );

      // -----------------------------------------------------------------------
      // 4. Line Items Table with Dynamic Overflow Pagination
      // -----------------------------------------------------------------------
      let cursorY = metaY + 34;
      renderTableHeader(cursorY);
      cursorY += 22;

      const items = Array.isArray(data.items) && data.items.length > 0 ? data.items : [];

      items.forEach((item, index) => {
        const descWidth = 250;
        doc.font('Helvetica').fontSize(8.5);
        const textHeight = doc.heightOfString(item.description, { width: descWidth });
        const rowHeight = Math.max(22, Math.ceil(textHeight) + 10);

        if (cursorY + rowHeight > maxContentY) {
          doc.addPage();
          renderContinuationHeader();
          cursorY = 46;
          renderTableHeader(cursorY);
          cursorY += 22;
        }

        const rowBg = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        doc.rect(margin, cursorY, contentWidth, rowHeight).fill(rowBg);
        doc.moveTo(margin, cursorY + rowHeight).lineTo(pageWidth - margin, cursorY + rowHeight).strokeColor('#E2E8F0').lineWidth(0.5).stroke();

        const textPadY = cursorY + 6;
        doc.fontSize(8.5).font('Helvetica').fillColor('#1E293B');

        doc.text(String(index + 1), margin + 6, textPadY, { width: 22, align: 'center' });
        doc.text(item.description, margin + 34, textPadY, { width: descWidth });
        doc.text(item.quantity.toString(), margin + 290, textPadY, { width: 45, align: 'right' });
        doc.text(formatIsoCurrency(item.unitPrice, currencyIso), margin + 345, textPadY, { width: 75, align: 'right' });
        doc.font('Helvetica-Bold').text(formatIsoCurrency(item.amount, currencyIso), margin + 430, textPadY, { width: 79, align: 'right' });

        cursorY += rowHeight;
      });

      doc.moveTo(margin, cursorY).lineTo(pageWidth - margin, cursorY).strokeColor('#94A3B8').lineWidth(0.75).stroke();

      // -----------------------------------------------------------------------
      // 5. Totals, Payment Info, Signature Box & Terms Block
      // -----------------------------------------------------------------------
      const totalsBlockHeight = 135;
      if (cursorY + totalsBlockHeight > maxContentY) {
        doc.addPage();
        renderContinuationHeader();
        cursorY = 46;
      }

      const summaryY = cursorY + 12;
      const notesWidth = 275;
      let leftSummaryCursor = summaryY;

      if (showBankDetails) {
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor(primaryColor).text('DATOS BANCARIOS Y CONDICIONES DE LIQUIDACIÓN', margin, leftSummaryCursor);
        leftSummaryCursor += 12;
        doc.fontSize(8).font('Helvetica').fillColor('#334155');
        if (data.bankAccount) {
          doc.font('Helvetica-Bold').text('IBAN / Cuenta: ', margin, leftSummaryCursor, { continued: true });
          doc.font('Courier-Bold').text(data.bankAccount);
          leftSummaryCursor += 12;
        }
        if (data.paymentTerms) {
          doc.font('Helvetica-Bold').text('Vencimiento / Medio: ', margin, leftSummaryCursor, { continued: true });
          doc.font('Helvetica').text(data.paymentTerms);
          leftSummaryCursor += 12;
        }
      }

      if (data.notes) {
        leftSummaryCursor += 4;
        doc.roundedRect(margin, leftSummaryCursor, notesWidth, 36, 3).fillAndStroke('#F8FAFC', '#E2E8F0');
        doc.fontSize(7).font('Helvetica-Bold').fillColor('#64748B').text('OBSERVACIONES / NOTAS:', margin + 6, leftSummaryCursor + 4);
        doc.fontSize(7.5).font('Helvetica').fillColor('#334155').text(data.notes, margin + 6, leftSummaryCursor + 14, {
          width: notesWidth - 12,
          height: 20,
        });
        leftSummaryCursor += 42;
      }

      if (showSignatureBox) {
        doc.roundedRect(margin, leftSummaryCursor, 175, 38, 3).strokeColor('#CBD5E1').lineWidth(0.5).stroke();
        doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#64748B').text('SELLO Y CONFORMIDAD:', margin + 6, leftSummaryCursor + 4);
        doc.fontSize(6).font('Helvetica').fillColor('#94A3B8').text('Firmado digitalmente / Sello de empresa', margin + 6, leftSummaryCursor + 26);
        leftSummaryCursor += 44;
      }

      // Right Column: Fiscal Breakdown & Total Box
      const totalsX = pageWidth - margin - 205;
      const totalsWidth = 205;
      let rightCursorY = summaryY;

      doc.fontSize(8.5).font('Helvetica').fillColor('#475569').text('Base Imponible Bruta:', totalsX, rightCursorY);
      doc.font('Helvetica-Bold').fillColor('#0F172A').text(formatIsoCurrency(data.subtotal, currencyIso), totalsX, rightCursorY, {
        width: totalsWidth,
        align: 'right',
      });
      rightCursorY += 15;

      if (data.discountAmount && data.discountAmount > 0) {
        doc.font('Helvetica').fillColor('#475569').text(`Descuento (${data.discountPercent || 0}%):`, totalsX, rightCursorY);
        doc.font('Helvetica-Bold').fillColor('#B91C1C').text(`-${formatIsoCurrency(data.discountAmount, currencyIso)}`, totalsX, rightCursorY, {
          width: totalsWidth,
          align: 'right',
        });
        rightCursorY += 15;
      }

      const taxRateDisplay = typeof data.taxRate === 'number' ? data.taxRate : 21;
      doc.font('Helvetica').fillColor('#475569').text(`Cuota IVA (${taxRateDisplay}%):`, totalsX, rightCursorY);
      doc.font('Helvetica-Bold').fillColor('#0F172A').text(formatIsoCurrency(data.taxAmount, currencyIso), totalsX, rightCursorY, {
        width: totalsWidth,
        align: 'right',
      });
      rightCursorY += 15;

      if (data.irpfAmount && data.irpfAmount > 0) {
        doc.font('Helvetica').fillColor('#475569').text(`Retención IRPF (${data.irpfRate || 15}%):`, totalsX, rightCursorY);
        doc.font('Helvetica-Bold').fillColor('#B91C1C').text(`-${formatIsoCurrency(data.irpfAmount, currencyIso)}`, totalsX, rightCursorY, {
          width: totalsWidth,
          align: 'right',
        });
        rightCursorY += 15;
      }

      const totalBoxY = rightCursorY + 4;
      doc.roundedRect(totalsX - 8, totalBoxY, totalsWidth + 8, 30, 4).fill(primaryColor);
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#FFFFFF').text('TOTAL A PAGAR:', totalsX, totalBoxY + 9);
      doc.fontSize(11.5).font('Helvetica-Bold').fillColor('#FFFFFF').text(formatIsoCurrency(data.total, currencyIso), totalsX, totalBoxY + 8, {
        width: totalsWidth,
        align: 'right',
      });

      // -----------------------------------------------------------------------
      // 6. Veri*Factu Compliance Block (RD 1007/2023 & Orden HAC/1177/2024)
      // -----------------------------------------------------------------------
      let afterSummaryY = Math.max(leftSummaryCursor + 6, totalBoxY + 40);

      if (data.type === 'FACTURA' && showVerifactuQr && data.verifactuQrBuffer) {
        if (afterSummaryY + 68 > 750) {
          doc.addPage();
          renderContinuationHeader();
          afterSummaryY = 55;
        }

        const vfBoxHeight = 62;
        doc.roundedRect(margin, afterSummaryY, contentWidth, vfBoxHeight, 4).fillAndStroke('#F8FAFC', '#CBD5E1');
        doc.rect(margin, afterSummaryY, 4, vfBoxHeight).fill(primaryColor);

        try {
          doc.image(data.verifactuQrBuffer, margin + 10, afterSummaryY + 5, { width: 52, height: 52 });
        } catch {}

        const textX = margin + 68;
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#0F172A').text(
          'VERI*FACTU · Factura verificable en la sede electrónica de la AEAT (Orden HAC/1177/2024)',
          textX,
          afterSummaryY + 6
        );
        doc.fontSize(6.5).font('Helvetica').fillColor('#475569').text(
          'Expedida por Sistema Informático de Facturación (SIF) DAMA-CRM conforme a la Ley 11/2021 Antifraude y RD 1007/2023.',
          textX,
          afterSummaryY + 17
        );

        const currentHash = data.verifactuHash || 'SHA256-CHAIN-VERIFIED';
        const prevHash = data.previousInvoiceHash ? `${data.previousInvoiceHash.slice(0, 16)}...` : 'GENESIS-00000000';
        doc.fontSize(6).font('Courier-Bold').fillColor('#1E293B').text(
          `Huella SHA-256: ${currentHash.slice(0, 32)}...${currentHash.slice(-8)}  |  Encadenamiento Ant.: ${prevHash}`,
          textX,
          afterSummaryY + 29
        );

        doc.fontSize(6).font('Helvetica').fillColor('#64748B').text(
          `URL Cotejo AEAT: ${data.verifactuQrUrl || 'https://sede.agenciatributaria.gob.es/soporte-sistemas-facturacion/qr'}`,
          textX,
          afterSummaryY + 41,
          { width: contentWidth - 78 }
        );
        afterSummaryY += vfBoxHeight + 8;
      }

      // -----------------------------------------------------------------------
      // 7. LOPDGDD / RGPD Clause & Multi-Page Footer Stamping
      // -----------------------------------------------------------------------
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        const footerY = 762;

        // LOPDGDD Privacy Notice above footer rule
        if (data.pdfLopdText) {
          doc.fontSize(5.5).font('Helvetica').fillColor('#94A3B8').text(data.pdfLopdText, margin, footerY - 16, {
            width: contentWidth,
            align: 'justify',
          });
        }

        doc.moveTo(margin, footerY).lineTo(pageWidth - margin, footerY).strokeColor('#CBD5E1').lineWidth(0.5).stroke();

        doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#64748B');
        const registryLine = data.pdfMercantileRegistry
          ? `${data.companyName || 'DAMA CRM'} · NIF: ${data.companyTaxId || 'B87654323'} · ${data.pdfMercantileRegistry}`
          : `${data.companyName || 'DAMA CRM'} · CIF/NIF: ${data.companyTaxId || 'B87654323'}${data.companyWebsite ? ' · ' + data.companyWebsite : ''}`;

        const legalLine2 =
          data.pdfFooterLegalText ||
          'Documento mercantil normalizado conforme a ISO 216, ISO 8601, ISO 4217 y Reglamento Veri*Factu (RD 1007/2023).';

        doc.text(registryLine, margin, footerY + 5, { width: 410, align: 'left' });
        doc.font('Helvetica').fillColor('#94A3B8').text(legalLine2, margin, footerY + 14, { width: 410, align: 'left' });

        doc.fontSize(8).font('Helvetica-Bold').fillColor(primaryColor);
        doc.text(`Página ${i + 1} de ${range.count}`, pageWidth - margin - 100, footerY + 8, {
          width: 100,
          align: 'right',
        });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
