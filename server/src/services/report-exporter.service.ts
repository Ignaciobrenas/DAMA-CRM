import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

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
 * Generate Standard Branded PDF Report Document
 */
export function generateReportPdf(options: {
  title: string;
  subtitle?: string;
  companyName?: string;
  dateRange?: string;
  kpis?: Array<{ label: string; value: string | number; color?: string }>;
  tableHeaders: string[];
  tableRows: string[][];
  summaryNotes?: string[];
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: options.title,
          Author: options.companyName || 'DAMA-CRM',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const primaryColor = '#2563EB';
      const textColor = '#1E293B';
      const mutedColor = '#64748B';
      const borderColor = '#E2E8F0';

      // 1. Header Banner
      doc.rect(40, 40, 515, 65).fill('#F8FAFC');
      doc.rect(40, 40, 5, 65).fill(primaryColor);

      doc.fillColor(primaryColor).fontSize(16).font('Helvetica-Bold').text(options.title, 55, 52);
      if (options.subtitle) {
        doc.fillColor(mutedColor).fontSize(9).font('Helvetica').text(options.subtitle, 55, 72);
      }

      // Metadata right aligned
      doc.fillColor(mutedColor).fontSize(8).font('Helvetica');
      doc.text(`Empresa: ${options.companyName || 'DAMA-CRM'}`, 350, 52, { align: 'right', width: 190 });
      doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 350, 64, { align: 'right', width: 190 });
      if (options.dateRange) {
        doc.text(`Periodo: ${options.dateRange}`, 350, 76, { align: 'right', width: 190 });
      }

      let yPos = 120;

      // 2. KPI Cards Grid (if provided)
      if (options.kpis && options.kpis.length > 0) {
        const cardWidth = Math.floor((515 - (options.kpis.length - 1) * 10) / options.kpis.length);
        options.kpis.forEach((kpi, idx) => {
          const xPos = 40 + idx * (cardWidth + 10);
          doc.rect(xPos, yPos, cardWidth, 48).fillAndStroke('#F1F5F9', borderColor);

          doc.fillColor(mutedColor).fontSize(8).font('Helvetica-Bold').text(kpi.label.toUpperCase(), xPos + 8, yPos + 8, {
            width: cardWidth - 16,
            align: 'center',
          });
          doc
            .fillColor(kpi.color || primaryColor)
            .fontSize(13)
            .font('Helvetica-Bold')
            .text(String(kpi.value), xPos + 8, yPos + 24, {
              width: cardWidth - 16,
              align: 'center',
            });
        });

        yPos += 65;
      }

      // 3. Table Header
      const colCount = options.tableHeaders.length;
      const colWidth = Math.floor(515 / colCount);

      doc.rect(40, yPos, 515, 20).fill(primaryColor);
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      options.tableHeaders.forEach((header, idx) => {
        doc.text(header, 45 + idx * colWidth, yPos + 6, {
          width: colWidth - 10,
          align: idx === colCount - 1 ? 'right' : 'left',
        });
      });

      yPos += 20;

      // 4. Table Rows
      doc.font('Helvetica').fontSize(8);
      options.tableRows.forEach((row, rowIndex) => {
        // Page break if near bottom
        if (yPos > 740) {
          doc.addPage();
          yPos = 40;

          // Repeat header
          doc.rect(40, yPos, 515, 20).fill(primaryColor);
          doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
          options.tableHeaders.forEach((header, idx) => {
            doc.text(header, 45 + idx * colWidth, yPos + 6, {
              width: colWidth - 10,
              align: idx === colCount - 1 ? 'right' : 'left',
            });
          });
          yPos += 20;
          doc.font('Helvetica').fontSize(8);
        }

        const isEven = rowIndex % 2 === 0;
        doc.rect(40, yPos, 515, 18).fill(isEven ? '#FFFFFF' : '#F8FAFC');

        doc.fillColor(textColor);
        row.forEach((cell, cellIndex) => {
          doc.text(String(cell || ''), 45 + cellIndex * colWidth, yPos + 5, {
            width: colWidth - 10,
            align: cellIndex === colCount - 1 ? 'right' : 'left',
          });
        });

        // Bottom border per row
        doc.strokeColor(borderColor).lineWidth(0.5).moveTo(40, yPos + 18).lineTo(555, yPos + 18).stroke();
        yPos += 18;
      });

      // 5. Summary Notes / Legal Footer
      if (options.summaryNotes && options.summaryNotes.length > 0) {
        yPos += 15;
        if (yPos > 750) {
          doc.addPage();
          yPos = 40;
        }

        doc.rect(40, yPos, 515, 2).fill(borderColor);
        yPos += 8;

        doc.fillColor(mutedColor).fontSize(7).font('Helvetica');
        options.summaryNotes.forEach((note) => {
          doc.text(note, 40, yPos, { width: 515 });
          yPos += 10;
        });
      }

      // Page numbers footer on all pages
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc.fillColor(mutedColor).fontSize(7).font('Helvetica');
        doc.text(
          `Página ${i + 1} de ${totalPages} • Documento oficial generado por DAMA-CRM Enterprise`,
          40,
          785,
          { align: 'center', width: 515 }
        );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
