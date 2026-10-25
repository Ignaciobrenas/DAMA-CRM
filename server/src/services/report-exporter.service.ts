import PDFDocument from 'pdfkit';
import { resolveLogo } from '../modules/invoices/pdf.service';
import { getBrandingConfig } from '../modules/branding/branding.controller';

export interface ColumnDef {
  header: string;
  key: string;
  width?: number;
}

/**
 * Generate CSV / Excel compatible CSV stream with UTF-8 BOM
 */
export function generateCsvBuffer(headers: string[], rows: (string | number)[][]): Buffer {
  const BOM = '\uFEFF'; // UTF-8 Byte Order Mark for Excel compatibility
  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(escapeCsv).join(';');
  const dataLines = rows.map((row) => row.map(escapeCsv).join(';'));
  const csvContent = BOM + [headerLine, ...dataLines].join('\r\n');

  return Buffer.from(csvContent, 'utf8');
}

/**
 * Generate Enterprise Branded PDF Report Document (with Company Logo or Official DAMA Placeholder Logo)
 */
export function generateReportPdf(options: {
  title: string;
  subtitle?: string;
  companyName?: string;
  logoUrl?: string;
  primaryColor?: string;
  dateRange?: string;
  kpis?: Array<{ label: string; value: string | number; color?: string }>;
  tableHeaders: string[];
  tableRows: string[][];
  summaryNotes?: string[];
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const branding = getBrandingConfig();
      const companyName = options.companyName || branding.companyName || 'DAMA-CRM';
      const primaryColor = options.primaryColor || branding.pdfAccentColor || branding.primaryColor || '#2563EB';
      const logoBuffer = branding.pdfShowLogo !== false ? resolveLogo(options.logoUrl || branding.logoUrl) : null;

      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true,
        info: {
          Title: options.title,
          Author: companyName,
          Creator: 'DAMA-CRM Enterprise Report Engine',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const textColor = '#1E293B';
      const mutedColor = '#64748B';
      const borderColor = '#E2E8F0';
      const pageWidth = doc.page.width;

      // Top accent bar
      doc.rect(0, 0, pageWidth, 6).fill(primaryColor);

      // 1. Header Banner with Logo
      doc.roundedRect(40, 22, 515, 68, 4).fillAndStroke('#F8FAFC', borderColor);
      doc.rect(40, 22, 5, 68).fill(primaryColor);

      let titleX = 56;
      if (logoBuffer) {
        try {
          doc.image(logoBuffer, 54, 34, { fit: [110, 42] });
          titleX = 176;
        } catch {}
      }

      doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text(options.title, titleX, 34, { width: 220 });
      if (options.subtitle) {
        doc.fillColor(mutedColor).fontSize(8.5).font('Helvetica').text(options.subtitle, titleX, 54, { width: 220 });
      }

      // Metadata right aligned
      doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold');
      doc.text(companyName, 380, 34, { align: 'right', width: 165 });
      doc.fillColor(mutedColor).fontSize(7.5).font('Helvetica');
      doc.text(`NIF/CIF: ${branding.companyTaxId || 'B87654323'}`, 380, 46, { align: 'right', width: 165 });
      doc.text(`Fecha emisión: ${new Date().toLocaleDateString('es-ES')}`, 380, 57, { align: 'right', width: 165 });
      if (options.dateRange) {
        doc.text(`Periodo: ${options.dateRange}`, 380, 68, { align: 'right', width: 165 });
      }

      let yPos = 104;

      // 2. KPI Cards Grid (if provided)
      if (options.kpis && options.kpis.length > 0) {
        const cardWidth = Math.floor((515 - (options.kpis.length - 1) * 10) / options.kpis.length);
        options.kpis.forEach((kpi, idx) => {
          const xPos = 40 + idx * (cardWidth + 10);
          doc.roundedRect(xPos, yPos, cardWidth, 48, 4).fillAndStroke('#F1F5F9', '#CBD5E1');

          doc.fillColor(mutedColor).fontSize(7.5).font('Helvetica-Bold').text(kpi.label.toUpperCase(), xPos + 8, yPos + 8, {
            width: cardWidth - 16,
            align: 'center',
          });
          doc
            .fillColor(kpi.color || primaryColor)
            .fontSize(12)
            .font('Helvetica-Bold')
            .text(String(kpi.value), xPos + 8, yPos + 23, {
              width: cardWidth - 16,
              align: 'center',
            });
        });

        yPos += 62;
      }

      // 3. Table Header
      const colCount = options.tableHeaders.length;
      const colWidth = Math.floor(515 / colCount);

      doc.roundedRect(40, yPos, 515, 22, 2).fill(primaryColor);
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      options.tableHeaders.forEach((header, idx) => {
        doc.text(header, 45 + idx * colWidth, yPos + 6.5, {
          width: colWidth - 10,
          align: idx === colCount - 1 ? 'right' : 'left',
        });
      });

      yPos += 22;

      // 4. Table Rows
      doc.font('Helvetica').fontSize(8);
      options.tableRows.forEach((row, rowIndex) => {
        if (yPos > 725) {
          doc.addPage();
          doc.rect(0, 0, pageWidth, 4).fill(primaryColor);
          yPos = 40;

          doc.roundedRect(40, yPos, 515, 22, 2).fill(primaryColor);
          doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
          options.tableHeaders.forEach((header, idx) => {
            doc.text(header, 45 + idx * colWidth, yPos + 6.5, {
              width: colWidth - 10,
              align: idx === colCount - 1 ? 'right' : 'left',
            });
          });
          yPos += 22;
          doc.font('Helvetica').fontSize(8);
        }

        const isEven = rowIndex % 2 === 0;
        doc.rect(40, yPos, 515, 19).fill(isEven ? '#FFFFFF' : '#F8FAFC');

        doc.fillColor(textColor);
        row.forEach((cell, cellIndex) => {
          doc.text(String(cell || ''), 45 + cellIndex * colWidth, yPos + 5.5, {
            width: colWidth - 10,
            align: cellIndex === colCount - 1 ? 'right' : 'left',
          });
        });

        doc.strokeColor(borderColor).lineWidth(0.5).moveTo(40, yPos + 19).lineTo(555, yPos + 19).stroke();
        yPos += 19;
      });

      // 5. Summary Notes / Legal Footer
      if (options.summaryNotes && options.summaryNotes.length > 0) {
        yPos += 14;
        if (yPos > 730) {
          doc.addPage();
          yPos = 40;
        }
        doc.roundedRect(40, yPos, 515, 18 + options.summaryNotes.length * 14, 3).fillAndStroke('#F8FAFC', borderColor);
        doc.fillColor(primaryColor).fontSize(8).font('Helvetica-Bold').text('NOTAS LEGALES Y DE AUDITORÍA:', 48, yPos + 6);
        yPos += 18;
        doc.fillColor(mutedColor).fontSize(7.5).font('Helvetica');
        options.summaryNotes.forEach((note) => {
          doc.text(`• ${note}`, 50, yPos, { width: 495 });
          yPos += 13;
        });
      }

      // 6. Multi-page Footer
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        doc.moveTo(40, 775).lineTo(555, 775).strokeColor('#CBD5E1').lineWidth(0.5).stroke();
        doc.fillColor('#94A3B8').fontSize(6.5).font('Helvetica').text(
          `${companyName} · NIF: ${branding.companyTaxId || 'B87654323'} · ${branding.pdfFooterLegalText || 'Informe oficial generado por DAMA-CRM Enterprise.'}`,
          40,
          782,
          { width: 400, align: 'left' }
        );
        doc.fillColor(primaryColor).fontSize(7.5).font('Helvetica-Bold').text(`Página ${i + 1} de ${range.count}`, 455, 782, {
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
