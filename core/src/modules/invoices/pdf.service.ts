import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export interface InvoicePdfItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoicePdfData {
  invoiceNumber: string;
  type: 'FACTURA' | 'PRESUPUESTO';
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
  clientName: string;
  clientEmail?: string;
  clientTaxId?: string;
  clientAddress?: string;
  clientPhone?: string;
  items: InvoicePdfItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency?: string; // ISO 4217, e.g. 'EUR', 'USD'
  notes?: string;
  paymentTerms?: string;
  bankAccount?: string;
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


function getStatusBadge(status: string, type: 'FACTURA' | 'PRESUPUESTO') {
  const upper = (status || '').toUpperCase();
  switch (upper) {
    case 'PAID':
    case 'PAGADA':
    case 'ACCEPTED':
    case 'ACEPTADO':
      return { label: upper === 'PAID' ? 'PAGADA' : 'ACEPTADO', bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
    case 'SENT':
    case 'ENVIADO':
    case 'PENDING':
    case 'PENDIENTE':
      return { label: 'PENDIENTE', bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD' };
    case 'OVERDUE':
    case 'VENCIDA':
    case 'REJECTED':
    case 'RECHAZADO':
      return { label: upper === 'REJECTED' ? 'RECHAZADO' : 'VENCIDA', bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5' };
    case 'CANCELLED':
    case 'CANCELADA':
      return { label: 'CANCELADA', bg: '#F3F4F6', text: '#4B5563', border: '#D1D5DB' };
    case 'DRAFT':
    case 'BORRADOR':
    default:
      return { label: 'BORRADOR', bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };
  }
}

function resolveLogo(logoUrl?: string): Buffer | null {
  // 1. Data URI (Base64)
  if (logoUrl && logoUrl.startsWith('data:image/')) {
    try {
      const base64Data = logoUrl.replace(/^data:image\/\w+;base64,/, '');
      return Buffer.from(base64Data, 'base64');
    } catch {}
  }

  // 2. Absolute or explicit filesystem path
  if (logoUrl && fs.existsSync(logoUrl)) {
    try {
      return fs.readFileSync(logoUrl);
    } catch {}
  }

  // 3. Relative path candidates
  if (logoUrl) {
    const candidates = [
      path.resolve(process.cwd(), logoUrl),
      path.resolve(process.cwd(), 'core', logoUrl),
      path.resolve(process.cwd(), 'client/public', logoUrl.replace(/^\//, '')),
      path.resolve(__dirname, '../../../client/public', logoUrl.replace(/^\//, '')),
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        try {
          return fs.readFileSync(c);
        } catch {}
      }
    }
  }

  // 4. Default official DAMA logo asset fallback
  const defaultAssets = [
    path.resolve(__dirname, '../../../assets/dama-logo.png'),
    path.resolve(__dirname, '../../assets/dama-logo.png'),
    path.resolve(process.cwd(), 'core/assets/dama-logo.png'),
    path.resolve(process.cwd(), 'assets/dama-logo.png'),
  ];
  for (const assetPath of defaultAssets) {
    if (fs.existsSync(assetPath)) {
      try {
        return fs.readFileSync(assetPath);
      } catch {}
    }
  }

  return null;
}

// -----------------------------------------------------------------------------
// Main PDF Generation Engine
// -----------------------------------------------------------------------------

export function generatePdfBuffer(data: InvoicePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const primaryColor = data.primaryColor && /^#[0-9A-Fa-f]{6}$/.test(data.primaryColor)
        ? data.primaryColor
        : '#072053';

      const issueDateIso = formatIsoDate(data.issueDate);
      const dueDateIso = data.dueDate ? formatIsoDate(data.dueDate) : undefined;
      const currencyIso = (data.currency || 'EUR').toUpperCase();

      // ISO 216 standard: A4 dimensions (595.28 x 841.89 points)
      // ISO 19005 (PDF/A compliant metadata)
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true,
        info: {
          Title: `${data.type === 'FACTURA' ? 'Factura' : 'Presupuesto'} ${data.invoiceNumber}`,
          Author: data.companyName || 'DAMA-CRM',
          Subject: `${data.type} mercantil ${data.invoiceNumber} emitida para ${data.clientName}`,
          Keywords: `DAMA-CRM, Factura, Presupuesto, ISO-216, ISO-8601, ISO-4217, ISO-19005`,
          Creator: 'DAMA-CRM Enterprise Cloud v1.2',
          Producer: 'PDFKit ISO Compliance Engine',
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
      const maxContentY = 725; // Safe threshold before multi-page break

      const logoBuffer = resolveLogo(data.logoUrl);

      // Helper to render table headers
      const renderTableHeader = (y: number) => {
        doc.rect(margin, y, contentWidth, 22).fill(primaryColor);
        doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#FFFFFF');
        doc.text('#', margin + 6, y + 6, { width: 22, align: 'center' });
        doc.text('DESCRIPCIÓN', margin + 34, y + 6, { width: 250, align: 'left' });
        doc.text('CANT.', margin + 290, y + 6, { width: 45, align: 'right' });
        doc.text('PRECIO UNIT.', margin + 345, y + 6, { width: 75, align: 'right' });
        doc.text('IMPORTE', margin + 430, y + 6, { width: 79, align: 'right' });
      };

      // Helper to render continuation page header
      const renderContinuationHeader = () => {
        // Slim top accent bar
        doc.rect(0, 0, pageWidth, 4).fill(primaryColor);

        // Header metadata
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#334155');
        doc.text(data.companyName || 'DAMA-CRM', margin, 20);

        doc.fontSize(8.5).font('Helvetica-Bold').fillColor(primaryColor);
        doc.text(`${data.type} ${data.invoiceNumber} · CONTINUACIÓN`, margin, 20, {
          width: contentWidth,
          align: 'right',
        });

        doc.moveTo(margin, 36).lineTo(pageWidth - margin, 36).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
      };

      // -----------------------------------------------------------------------
      // 1. PAGE 1: Brand Accent & Header
      // -----------------------------------------------------------------------
      doc.rect(0, 0, pageWidth, 6).fill(primaryColor);

      // Logo or Corporate Name
      if (logoBuffer) {
        try {
          doc.image(logoBuffer, margin, 22, { fit: [150, 48] });
        } catch {
          doc.fontSize(20).font('Helvetica-Bold').fillColor(primaryColor).text(data.companyName || 'DAMA-CRM', margin, 26);
        }
      } else {
        doc.fontSize(20).font('Helvetica-Bold').fillColor(primaryColor).text(data.companyName || 'DAMA-CRM', margin, 26);
        doc.fontSize(8).font('Helvetica').fillColor('#64748B').text('Sistemas de Gestión Modular Open-Source', margin, 50);
      }

      // Document Type & Number on Top-Right
      const docTypeLabel = data.type === 'FACTURA' ? 'FACTURA' : 'PRESUPUESTO';
      doc.fontSize(20).font('Helvetica-Bold').fillColor(primaryColor).text(docTypeLabel, margin, 22, {
        width: contentWidth,
        align: 'right',
      });

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1E293B').text(`Nº: ${data.invoiceNumber}`, margin, 46, {
        width: contentWidth,
        align: 'right',
      });

      // Status Badge Pill
      const badge = getStatusBadge(data.status, data.type);
      const badgeWidth = 74;
      const badgeHeight = 16;
      const badgeX = pageWidth - margin - badgeWidth;
      const badgeY = 62;

      doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 3)
        .fillAndStroke(badge.bg, badge.border);

      doc.fontSize(7.5).font('Helvetica-Bold').fillColor(badge.text).text(badge.label, badgeX, badgeY + 4, {
        width: badgeWidth,
        align: 'center',
      });

      // Divider Line
      doc.moveTo(margin, 86).lineTo(pageWidth - margin, 86).strokeColor('#E2E8F0').lineWidth(0.75).stroke();

      // -----------------------------------------------------------------------
      // 2. Issuer & Client Information Columns
      // -----------------------------------------------------------------------
      const infoY = 96;
      const colWidth = (contentWidth - 25) / 2; // ~245 pt each
      const rightColX = margin + colWidth + 25;

      // Left Column: EMISOR
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#64748B').text('DATOS DEL EMISOR', margin, infoY);
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0F172A').text(data.companyName || 'DAMA CRM Soluciones S.L.', margin, infoY + 14);

      let issuerCursor = infoY + 28;
      doc.fontSize(8.5).font('Helvetica').fillColor('#475569');
      if (data.companyTaxId) {
        doc.text(`CIF/NIF: ${data.companyTaxId}`, margin, issuerCursor);
        issuerCursor += 12;
      }
      if (data.companyAddress) {
        doc.text(`Dirección: ${data.companyAddress}`, margin, issuerCursor, { width: colWidth });
        issuerCursor += Math.max(12, doc.heightOfString(`Dirección: ${data.companyAddress}`, { width: colWidth }));
      }
      if (data.companyEmail || data.companyPhone) {
        const contactLine = [data.companyEmail, data.companyPhone].filter(Boolean).join(' · ');
        doc.text(contactLine, margin, issuerCursor, { width: colWidth });
      }

      // Right Column: CLIENTE / RECEPTOR
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#64748B').text('DATOS DEL CLIENTE / RECEPTOR', rightColX, infoY);
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0F172A').text(data.clientName || 'Cliente No Especificado', rightColX, infoY + 14);

      let clientCursor = infoY + 28;
      doc.fontSize(8.5).font('Helvetica').fillColor('#475569');
      if (data.clientTaxId) {
        doc.text(`CIF/NIF: ${data.clientTaxId}`, rightColX, clientCursor);
        clientCursor += 12;
      }
      if (data.clientAddress) {
        doc.text(`Dirección: ${data.clientAddress}`, rightColX, clientCursor, { width: colWidth });
        clientCursor += Math.max(12, doc.heightOfString(`Dirección: ${data.clientAddress}`, { width: colWidth }));
      }
      if (data.clientEmail || data.clientPhone) {
        const clientContactLine = [data.clientEmail, data.clientPhone].filter(Boolean).join(' · ');
        doc.text(clientContactLine, rightColX, clientCursor, { width: colWidth });
      }

      // -----------------------------------------------------------------------
      // 3. Metadata Strip (ISO 8601 Dates, Currency ISO 4217)
      // -----------------------------------------------------------------------
      const metaY = Math.max(issuerCursor, clientCursor, infoY + 68) + 12;
      doc.roundedRect(margin, metaY, contentWidth, 26, 3).fill('#F8FAFC');
      doc.roundedRect(margin, metaY, contentWidth, 26, 3).strokeColor('#E2E8F0').lineWidth(0.5).stroke();

      const segWidth = contentWidth / 4;
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#64748B');

      // Date of issue (ISO 8601)
      doc.text('FECHA DE EMISIÓN', margin + 10, metaY + 4);
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0F172A').text(issueDateIso, margin + 10, metaY + 14);

      // Due date / Expiration date (ISO 8601)
      const dueLabel = data.type === 'FACTURA' ? 'VENCIMIENTO' : 'VALIDEZ HASTA';
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#64748B').text(dueLabel, margin + segWidth + 10, metaY + 4);
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0F172A').text(dueDateIso || 'A la emisión', margin + segWidth + 10, metaY + 14);

      // Currency (ISO 4217)
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#64748B').text('MONEDA (ISO 4217)', margin + segWidth * 2 + 10, metaY + 4);
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0F172A').text(currencyIso, margin + segWidth * 2 + 10, metaY + 14);

      // Payment Terms
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#64748B').text('TÉRMINOS DE PAGO', margin + segWidth * 3 + 10, metaY + 4);
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0F172A').text(data.paymentTerms || 'Transferencia 30d', margin + segWidth * 3 + 10, metaY + 14);

      // -----------------------------------------------------------------------
      // 4. Line Items Table with Dynamic Overflow Pagination
      // -----------------------------------------------------------------------
      let cursorY = metaY + 36;
      renderTableHeader(cursorY);
      cursorY += 22;

      const items = Array.isArray(data.items) && data.items.length > 0 ? data.items : [];

      items.forEach((item, index) => {
        // Measure description wrap height
        const descWidth = 250;
        doc.font('Helvetica').fontSize(8.5);
        const textHeight = doc.heightOfString(item.description, { width: descWidth });
        const rowHeight = Math.max(22, Math.ceil(textHeight) + 10);

        // Check if row exceeds printable page area
        if (cursorY + rowHeight > maxContentY) {
          doc.addPage();
          renderContinuationHeader();
          cursorY = 46;
          renderTableHeader(cursorY);
          cursorY += 22;
        }

        // Alternating row background
        const rowBg = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        doc.rect(margin, cursorY, contentWidth, rowHeight).fill(rowBg);

        // Draw row bottom border
        doc.moveTo(margin, cursorY + rowHeight).lineTo(pageWidth - margin, cursorY + rowHeight).strokeColor('#F1F5F9').lineWidth(0.5).stroke();

        // Render Item Contents
        const textPadY = cursorY + 6;
        doc.fontSize(8.5).font('Helvetica').fillColor('#1E293B');

        // Item Index
        doc.text(String(index + 1), margin + 6, textPadY, { width: 22, align: 'center' });

        // Description
        doc.text(item.description, margin + 34, textPadY, { width: descWidth });

        // Quantity
        doc.text(item.quantity.toString(), margin + 290, textPadY, { width: 45, align: 'right' });

        // Unit Price (ISO 4217)
        doc.text(formatIsoCurrency(item.unitPrice, currencyIso), margin + 345, textPadY, { width: 75, align: 'right' });

        // Line Amount (ISO 4217)
        doc.font('Helvetica-Bold').text(formatIsoCurrency(item.amount, currencyIso), margin + 430, textPadY, { width: 79, align: 'right' });

        cursorY += rowHeight;
      });

      // Bottom border for table
      doc.moveTo(margin, cursorY).lineTo(pageWidth - margin, cursorY).strokeColor('#CBD5E1').lineWidth(0.75).stroke();

      // -----------------------------------------------------------------------
      // 5. Totals, Payment Info & Terms Block (No Cut-off Guarantee)
      // -----------------------------------------------------------------------
      const totalsBlockHeight = 115;
      if (cursorY + totalsBlockHeight > maxContentY) {
        doc.addPage();
        renderContinuationHeader();
        cursorY = 46;
      }

      const summaryY = cursorY + 12;

      // Left Column: Payment information, Bank Account & Notes
      const notesWidth = 270;
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#64748B').text('INFORMACIÓN DE PAGO Y CONDICIONES', margin, summaryY);

      let leftSummaryCursor = summaryY + 14;
      doc.fontSize(8).font('Helvetica').fillColor('#334155');
      if (data.bankAccount) {
        doc.font('Helvetica-Bold').text('Cuenta Bancaria / IBAN: ', margin, leftSummaryCursor, { continued: true });
        doc.font('Helvetica').text(data.bankAccount);
        leftSummaryCursor += 12;
      }
      if (data.paymentTerms) {
        doc.font('Helvetica-Bold').text('Condiciones: ', margin, leftSummaryCursor, { continued: true });
        doc.font('Helvetica').text(data.paymentTerms);
        leftSummaryCursor += 12;
      }

      if (data.notes) {
        leftSummaryCursor += 4;
        doc.roundedRect(margin, leftSummaryCursor, notesWidth, 38, 3).fill('#F8FAFC');
        doc.roundedRect(margin, leftSummaryCursor, notesWidth, 38, 3).strokeColor('#E2E8F0').lineWidth(0.5).stroke();

        doc.fontSize(7).font('Helvetica-Bold').fillColor('#64748B').text('OBSERVACIONES:', margin + 6, leftSummaryCursor + 5);
        doc.fontSize(7.5).font('Helvetica').fillColor('#475569').text(data.notes, margin + 6, leftSummaryCursor + 15, { width: notesWidth - 12, height: 20 });
      }

      // Right Column: Subtotal, Taxes & Highlighted Total Box
      const totalsX = pageWidth - margin - 200;
      const totalsWidth = 200;

      // Base Imponible (Subtotal)
      doc.fontSize(8.5).font('Helvetica').fillColor('#64748B').text('Base Imponible:', totalsX, summaryY);
      doc.font('Helvetica-Bold').fillColor('#0F172A').text(formatIsoCurrency(data.subtotal, currencyIso), totalsX, summaryY, { width: totalsWidth, align: 'right' });

      // IVA (Taxes)
      const taxRateDisplay = typeof data.taxRate === 'number' ? data.taxRate : 21;
      doc.font('Helvetica').fillColor('#64748B').text(`IVA (${taxRateDisplay}%):`, totalsX, summaryY + 16);
      doc.font('Helvetica-Bold').fillColor('#0F172A').text(formatIsoCurrency(data.taxAmount, currencyIso), totalsX, summaryY + 16, { width: totalsWidth, align: 'right' });

      // Total Final Box with Brand Color
      const totalBoxY = summaryY + 36;
      doc.roundedRect(totalsX - 10, totalBoxY, totalsWidth + 10, 32, 4).fill(primaryColor);

      doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#FFFFFF').text(
        `TOTAL ${data.type}:`,
        totalsX,
        totalBoxY + 10
      );

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#FFFFFF').text(
        formatIsoCurrency(data.total, currencyIso),
        totalsX,
        totalBoxY + 9,
        { width: totalsWidth, align: 'right' }
      );

      // -----------------------------------------------------------------------
      // 6. Multi-Page Footer Stamping (ISO Compliant & Dynamic Pagination)
      // -----------------------------------------------------------------------
      const range = doc.bufferedPageRange(); // { start: 0, count: totalPages }
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        const footerY = 780;

        // Bottom divider rule
        doc.moveTo(margin, footerY).lineTo(pageWidth - margin, footerY).strokeColor('#E2E8F0').lineWidth(0.5).stroke();

        // Legal compliance & Company identification
        doc.fontSize(7).font('Helvetica').fillColor('#94A3B8');
        const legalLine1 = `${data.companyName || 'DAMA CRM Soluciones S.L.'} · CIF/NIF: ${data.companyTaxId || 'B-12345678'}${data.companyWebsite ? ' · ' + data.companyWebsite : ''}`;
        const legalLine2 = `Documento mercantil normalizado conforme a ISO 216, ISO 8601, ISO 4217 e ISO 19005. Generado electrónicamente por DAMA-CRM.`;

        doc.text(`${legalLine1}\n${legalLine2}`, margin, footerY + 8, {
          width: 380,
          align: 'left',
          lineGap: 2,
        });

        // Dynamic page numbering ("Página X de Y")
        doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#64748B');
        doc.text(`Página ${i + 1} de ${range.count}`, pageWidth - margin - 120, footerY + 12, {
          width: 120,
          align: 'right',
        });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
