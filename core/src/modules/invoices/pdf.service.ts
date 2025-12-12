import PDFDocument from 'pdfkit';

export interface InvoicePdfData {
  invoiceNumber: string;
  type: 'FACTURA' | 'PRESUPUESTO';
  issueDate: string;
  dueDate?: string;
  status: string;
  companyName: string;
  companyTaxId?: string;
  companyAddress?: string;
  clientName: string;
  clientEmail?: string;
  clientTaxId?: string;
  clientAddress?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  notes?: string;
}

export function generatePdfBuffer(data: InvoicePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // 1. Header & Brand Accent
      doc.rect(0, 0, doc.page.width, 12).fill('#2563EB'); // Blue top border

      doc.fontSize(22).font('Helvetica-Bold').fillColor('#1E293B').text('DAMA-CRM', 50, 45);
      doc.fontSize(9).font('Helvetica').fillColor('#64748B').text('Sistemas de Gestión Modular Open-Source', 50, 72);

      // Document Type & Number Badge
      doc.fontSize(20).font('Helvetica-Bold').fillColor('#2563EB').text(data.type, 350, 45, { align: 'right' });
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#334155').text(`Nº: ${data.invoiceNumber}`, 350, 70, { align: 'right' });

      // Horizontal Divider
      doc.moveTo(50, 95).lineTo(545, 95).strokeColor('#E2E8F0').lineWidth(1).stroke();

      // 2. Issuer & Client Information Columns
      const metaY = 110;

      // Left Column: Issuer (Company)
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748B').text('EMISOR:', 50, metaY);
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0F172A').text(data.companyName || 'DAMA Solutions Cloud', 50, metaY + 15);
      doc.fontSize(9).font('Helvetica').fillColor('#475569');
      if (data.companyTaxId) doc.text(`CIF/NIF: ${data.companyTaxId}`, 50, metaY + 28);
      if (data.companyAddress) doc.text(`Dirección: ${data.companyAddress}`, 50, metaY + 40);

      // Right Column: Client
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748B').text('CLIENTE / RECEPTOR:', 320, metaY);
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0F172A').text(data.clientName, 320, metaY + 15);
      doc.fontSize(9).font('Helvetica').fillColor('#475569');
      if (data.clientTaxId) doc.text(`CIF/NIF: ${data.clientTaxId}`, 320, metaY + 28);
      if (data.clientEmail) doc.text(`Email: ${data.clientEmail}`, 320, metaY + 40);
      if (data.clientAddress) doc.text(`Dirección: ${data.clientAddress}`, 320, metaY + 52);

      // Meta dates box
      const datesY = metaY + 75;
      doc.rect(50, datesY, 495, 24).fill('#F8FAFC');
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#475569');
      doc.text(`Fecha de Emisión: ${data.issueDate}`, 60, datesY + 7);
      if (data.dueDate) {
        doc.text(`Vencimiento: ${data.dueDate}`, 240, datesY + 7);
      }
      doc.text(`Estado: ${data.status.toUpperCase()}`, 420, datesY + 7);

      // 3. Items Table Header
      let tableY = datesY + 40;
      doc.rect(50, tableY, 495, 22).fill('#2563EB');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFFFFF');
      doc.text('DESCRIPCIÓN', 60, tableY + 6);
      doc.text('CANTIDAD', 310, tableY + 6, { width: 60, align: 'right' });
      doc.text('PRECIO UNIT.', 380, tableY + 6, { width: 70, align: 'right' });
      doc.text('TOTAL', 460, tableY + 6, { width: 75, align: 'right' });

      // Table Rows
      tableY += 22;
      doc.font('Helvetica').fontSize(9).fillColor('#1E293B');

      data.items.forEach((item, index) => {
        const rowBg = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        doc.rect(50, tableY, 495, 22).fill(rowBg);

        doc.fillColor('#1E293B');
        doc.text(item.description, 60, tableY + 6, { width: 240 });
        doc.text(item.quantity.toString(), 310, tableY + 6, { width: 60, align: 'right' });
        doc.text(`${item.unitPrice.toFixed(2)} €`, 380, tableY + 6, { width: 70, align: 'right' });
        doc.text(`${item.amount.toFixed(2)} €`, 460, tableY + 6, { width: 75, align: 'right' });

        tableY += 22;
      });

      // Bottom border for table
      doc.moveTo(50, tableY).lineTo(545, tableY).strokeColor('#CBD5E1').lineWidth(0.5).stroke();

      // 4. Totals Block
      const totalsY = tableY + 15;
      const labelX = 350;
      const valueX = 450;
      const colWidth = 85;

      doc.fontSize(9).font('Helvetica').fillColor('#64748B');
      doc.text('Base Imponible:', labelX, totalsY);
      doc.font('Helvetica-Bold').fillColor('#1E293B').text(`${data.subtotal.toFixed(2)} €`, valueX, totalsY, { width: colWidth, align: 'right' });

      doc.font('Helvetica').fillColor('#64748B').text(`IVA (${data.taxRate}%):`, labelX, totalsY + 16);
      doc.font('Helvetica-Bold').fillColor('#1E293B').text(`${data.taxAmount.toFixed(2)} €`, valueX, totalsY + 16, { width: colWidth, align: 'right' });

      doc.rect(340, totalsY + 34, 205, 26).fill('#EFF6FF');
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1E3A8A').text('TOTAL FACTURA:', 350, totalsY + 41);
      doc.fontSize(12).text(`${data.total.toFixed(2)} €`, valueX, totalsY + 40, { width: colWidth, align: 'right' });

      // 5. Notes & Footer
      if (data.notes) {
        doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#475569').text('OBSERVACIONES / TÉRMINOS:', 50, totalsY + 10);
        doc.fontSize(8).font('Helvetica').fillColor('#64748B').text(data.notes, 50, totalsY + 24, { width: 280 });
      }

      // Legal disclaimer footer
      const footerY = 750;
      doc.moveTo(50, footerY).lineTo(545, footerY).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
      doc.fontSize(7.5).font('Helvetica').fillColor('#94A3B8').text(
        'Documento mercantil generado por DAMA-CRM. Solución autoalojada 100% de código abierto para PYMES. Libre de cánones y suscripciones SaaS recurrentes.',
        50,
        footerY + 8,
        { align: 'center', width: 495 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
