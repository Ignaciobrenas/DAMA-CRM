import PDFDocument from 'pdfkit';
import { resolveLogo } from '../invoices/pdf.service';
import { getTenantBranding } from '../branding/branding.controller';

export async function generateStockTransferPdf(
  transfer: any,
  tenantId: string = 'master'
): Promise<Buffer> {
  const branding = await getTenantBranding(tenantId);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        info: {
          Title: `Albarán de Circulación Interno ${transfer.transferNumber}`,
          Author: branding.companyName || 'DAMA CRM',
          Subject: 'Traspaso Inter-Almacén (Art. 9 Ley 37/1992 IVA & LOTT)',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const primaryColor = branding.primaryColor || '#072053';
      const accentColor = branding.pdfAccentColor || '#10B981';

      // Top Header Stripe
      doc.rect(0, 0, 595.28, 10).fill(primaryColor);

      // Logo (Custom or Official DAMA Placeholder)
      const logoBuffer = resolveLogo(branding.logoUrl);
      if (logoBuffer) {
        try {
          doc.image(logoBuffer, 40, 26, { width: 120 });
        } catch {
          doc.fontSize(18).font('Helvetica-Bold').fillColor(primaryColor).text(branding.companyName || 'DAMA CRM', 40, 30);
        }
      } else {
        doc.fontSize(18).font('Helvetica-Bold').fillColor(primaryColor).text(branding.companyName || 'DAMA CRM', 40, 30);
      }

      // Company Legal Info under Logo
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0F172A').text(branding.companyName || 'DAMA Enterprise S.L.', 40, 72);
      doc.fontSize(7.5).font('Helvetica').fillColor('#475569');
      doc.text(`NIF / CIF: ${branding.companyTaxId || 'B-87654321'} · ${branding.companyAddress || 'Madrid, España'}`, 40, 84);
      doc.text(`${branding.companyEmail || 'logistica@dama-crm.com'} · ${branding.companyPhone || '+34 910 000 000'}`, 40, 95);

      // Document Title Box (Right Side)
      doc.roundedRect(310, 24, 245, 82, 6).fillAndStroke('#F8FAFC', '#E2E8F0');
      doc.fontSize(9).font('Helvetica-Bold').fillColor(primaryColor).text('ALBARÁN DE CIRCULACIÓN INTERNO', 322, 33, { width: 220, align: 'right' });
      doc.fontSize(7.5).font('Helvetica').fillColor('#64748B').text('TRASPASO ENTRE ALMACENES (METODOLOGÍA SAGE)', 322, 46, { width: 220, align: 'right' });
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#0F172A').text(transfer.transferNumber, 322, 60, { width: 220, align: 'right' });

      const statusMap: Record<string, string> = {
        DRAFT: 'BORRADOR PREPARACIÓN',
        IN_TRANSIT: 'FASE 1: EN TRÁNSITO (SALIDA EXPEDIDA)',
        RECEIVED: 'FASE 2: RECEPCIONADO Y VERIFICADO',
        DISCREPANCY: 'FASE 2: RECEPCIONADO CON INCIDENCIA / MERMA',
        CANCELLED: 'ANULADO',
      };
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor(accentColor).text(
        statusMap[transfer.status] || transfer.status,
        322,
        79,
        { width: 220, align: 'right' }
      );
      doc.fontSize(7).font('Helvetica').fillColor('#475569').text(
        `Fecha Emisión: ${new Date(transfer.createdAt || Date.now()).toLocaleDateString('es-ES')}`,
        322,
        92,
        { width: 220, align: 'right' }
      );

      // Origin & Destination Warehouse Cards
      const cardY = 120;
      doc.roundedRect(40, cardY, 250, 78, 6).fillAndStroke('#FFFFFF', '#CBD5E1');
      doc.rect(40, cardY, 250, 18).fill('#0F172A');
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#FFFFFF').text('ALMACÉN DE ORIGEN (EXPEDIDOR)', 50, cardY + 5);

      const src = transfer.sourceWarehouse || {};
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#0F172A').text(`${src.code || 'ALM-01'} · ${src.name || 'Almacén Origen'}`, 50, cardY + 25);
      doc.fontSize(7.5).font('Helvetica').fillColor('#475569').text(src.address || 'Polígono Industrial Central', 50, cardY + 39);
      doc.text(`${src.postalCode || '28001'} ${src.city || 'Madrid'} (${src.country || 'ES'})`, 50, cardY + 50);
      doc.text(`Responsable: ${src.managerName || transfer.dispatchedBy || 'Jefe de Almacén'}`, 50, cardY + 62);

      doc.roundedRect(305, cardY, 250, 78, 6).fillAndStroke('#FFFFFF', '#CBD5E1');
      doc.rect(305, cardY, 250, 18).fill(primaryColor);
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#FFFFFF').text('ALMACÉN DE DESTINO (RECEPTOR)', 315, cardY + 5);

      const dst = transfer.targetWarehouse || {};
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#0F172A').text(`${dst.code || 'ALM-02'} · ${dst.name || 'Almacén Destino'}`, 315, cardY + 25);
      doc.fontSize(7.5).font('Helvetica').fillColor('#475569').text(dst.address || 'Plataforma Logística', 315, cardY + 39);
      doc.text(`${dst.postalCode || '08001'} ${dst.city || 'Barcelona'} (${dst.country || 'ES'})`, 315, cardY + 50);
      doc.text(`Responsable: ${dst.managerName || transfer.receivedBy || 'Responsable Recepción'}`, 315, cardY + 62);

      // LOTT Road Transport Control Box
      const lottY = 208;
      doc.roundedRect(40, lottY, 515, 44, 5).fillAndStroke('#F1F5F9', '#CBD5E1');
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor(primaryColor).text(
        'CONTROL DE TRANSPORTE POR CARRETERA (ORDEN FOM/2861/2012 - LOTT / ROTT)',
        50,
        lottY + 7
      );
      doc.fontSize(7.5).font('Helvetica').fillColor('#1E293B');
      doc.text(`Agencia / Porteador: ${transfer.carrierName || 'Flota Propia Interna'}`, 50, lottY + 20);
      doc.text(`Conductor: ${transfer.driverName || 'No especificado'} (DNI: ${transfer.driverTaxId || 'N/A'})`, 220, lottY + 20);
      doc.text(`Matrícula Vehículo: ${transfer.vehiclePlate || 'INTERNO'}`, 415, lottY + 20);
      doc.text(`Nº Bultos: ${transfer.totalPackages || 1} bulto(s)`, 50, lottY + 31);
      doc.text(`Peso Bruto Total: ${Number(transfer.totalWeightKg || 0).toFixed(2)} kg`, 220, lottY + 31);
      doc.text(`Tracking / Ref: ${transfer.trackingNumber || transfer.transferNumber}`, 415, lottY + 31);

      // Items Table Header
      const tableY = 264;
      doc.rect(40, tableY, 515, 20).fill(primaryColor);
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#FFFFFF');
      doc.text('SKU', 46, tableY + 6, { width: 65 });
      doc.text('DESCRIPCIÓN DEL ARTÍCULO', 115, tableY + 6, { width: 155 });
      doc.text('LOTE / UBIC.', 272, tableY + 6, { width: 78 });
      doc.text('ENVIADO', 352, tableY + 6, { width: 45, align: 'right' });
      doc.text('RECIBIDO', 400, tableY + 6, { width: 48, align: 'right' });
      doc.text('COSTE PMP', 450, tableY + 6, { width: 50, align: 'right' });
      doc.text('VALOR PMP', 502, tableY + 6, { width: 48, align: 'right' });

      let y = tableY + 24;
      let totalSentUnits = 0;
      let totalReceivedUnits = 0;
      let totalValuationPmp = 0;

      const items = Array.isArray(transfer.items) ? transfer.items : [];
      items.forEach((item: any, idx: number) => {
        if (idx % 2 === 1) {
          doc.rect(40, y - 3, 515, 20).fill('#F8FAFC');
        }
        const sent = Number(item.shippedQty || item.requestedQty || 0);
        const rec = item.receivedQty !== null && item.receivedQty !== undefined ? Number(item.receivedQty) : sent;
        const unitCost = Number(item.unitCostPmp || item.product?.costPrice || 0);
        const lineVal = sent * unitCost;

        totalSentUnits += sent;
        totalReceivedUnits += rec;
        totalValuationPmp += lineVal;

        doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#0F172A').text(item.product?.sku || 'SKU', 46, y, { width: 65 });
        doc.font('Helvetica').fillColor('#1E293B').text(item.product?.name || 'Artículo de inventario', 115, y, { width: 155 });
        doc.fontSize(7).fillColor('#475569').text(
          `${item.batchNumber || 'SIN-LOTE'} ${item.sourceBinLocation ? `(${item.sourceBinLocation})` : ''}`,
          272,
          y,
          { width: 78 }
        );
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#0F172A').text(`${sent}`, 352, y, { width: 45, align: 'right' });
        doc.fillColor('#059669').text(`${transfer.status === 'RECEIVED' || transfer.status === 'DISCREPANCY' ? rec : '—'}`, 400, y, { width: 48, align: 'right' });
        doc.font('Helvetica').fillColor('#334155').text(`${unitCost.toFixed(2)} €`, 450, y, { width: 50, align: 'right' });
        doc.font('Helvetica-Bold').fillColor('#0F172A').text(`${lineVal.toFixed(2)} €`, 502, y, { width: 48, align: 'right' });

        y += 20;
      });

      doc.moveTo(40, y).lineTo(555, y).strokeColor('#CBD5E1').stroke();
      y += 10;

      // Summary & Legal Art. 9 Ley 37/1992 IVA Box
      doc.roundedRect(40, y, 310, 68, 5).fillAndStroke('#EFF6FF', '#BFDBFE');
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#1E3A8A').text(
        'FUNDAMENTO JURÍDICO Y EXENCIÓN FISCAL (LEY 37/1992 DEL IVA)',
        48,
        y + 7
      );
      doc.fontSize(6.8).font('Helvetica').fillColor('#1E40AF').text(
        transfer.legalClause ||
          `Operación interna de traspaso de existencias entre almacenes de la misma entidad jurídica (${branding.companyName} - NIF ${branding.companyTaxId || 'B87654321'}) sin transmisión de la propiedad ni devengo de IVA conforme al Art. 9.1º de la Ley 37/1992. Valoración contable a Coste Medio Ponderado (PMP) según PGC Norma 10ª.`,
        48,
        y + 19,
        { width: 294, align: 'justify' }
      );

      // Accounting Valuation Totals Box
      doc.roundedRect(360, y, 195, 68, 5).fillAndStroke('#F8FAFC', '#CBD5E1');
      doc.fontSize(7.5).font('Helvetica').fillColor('#475569').text('Unidades Totales Expedidas:', 368, y + 8);
      doc.font('Helvetica-Bold').fillColor('#0F172A').text(`${totalSentUnits} uds.`, 475, y + 8, { width: 72, align: 'right' });

      doc.font('Helvetica').fillColor('#475569').text('Valoración Contable (PMP):', 368, y + 22);
      doc.font('Helvetica-Bold').fillColor('#0F172A').text(`${totalValuationPmp.toFixed(2)} €`, 475, y + 22, { width: 72, align: 'right' });

      doc.font('Helvetica').fillColor('#475569').text('IVA Devengado (Art. 9 LIVA):', 368, y + 36);
      doc.font('Helvetica-Bold').fillColor('#059669').text('0,00 € (NO SUJETO)', 455, y + 36, { width: 92, align: 'right' });

      doc.moveTo(368, y + 49).lineTo(547, y + 49).strokeColor('#CBD5E1').stroke();
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(primaryColor).text('VALORACIÓN TRASPASO:', 368, y + 53);
      doc.text(`${totalValuationPmp.toFixed(2)} €`, 475, y + 53, { width: 72, align: 'right' });

      y += 82;

      // Dual Signature Boxes (Phase 1 Outbound & Phase 2 Inbound)
      doc.roundedRect(40, y, 250, 75, 5).strokeColor('#94A3B8').stroke();
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#0F172A').text(
        'FASE 1: CONFORMIDAD SALIDA Y CARGA (ORIGEN)',
        48,
        y + 7
      );
      doc.fontSize(7).font('Helvetica').fillColor('#475569').text(
        `Expedido por: ${transfer.dispatchedBy || 'Responsable de Expediciones'}`,
        48,
        y + 20
      );
      doc.text(
        `Fecha/Hora Salida: ${transfer.dispatchedAt ? new Date(transfer.dispatchedAt).toLocaleString('es-ES') : new Date().toLocaleString('es-ES')}`,
        48,
        y + 31
      );
      doc.fontSize(6.5).fillColor('#94A3B8').text('Firma y Sello Almacén Origen / Conductor:', 48, y + 56);

      doc.roundedRect(305, y, 250, 75, 5).strokeColor('#94A3B8').stroke();
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#0F172A').text(
        'FASE 2: CONFORMIDAD RECEPCIÓN E INSPECCIÓN (DESTINO)',
        313,
        y + 7
      );
      doc.fontSize(7).font('Helvetica').fillColor('#475569').text(
        `Recibido por: ${transfer.receivedBy || 'Pendiente de recepción en destino'}`,
        313,
        y + 20
      );
      doc.text(
        `Fecha/Hora Recepción: ${transfer.receivedAt ? new Date(transfer.receivedAt).toLocaleString('es-ES') : 'En tránsito'}`,
        313,
        y + 31
      );
      doc.fontSize(6.5).fillColor('#94A3B8').text('Firma y Sello Almacén Receptor (Control Calidad):', 313, y + 56);

      // Footer
      doc.fontSize(6.5).font('Helvetica').fillColor('#64748B').text(
        `${branding.mercantileRegistry || 'Documento oficial de control logístico interno'} · Impreso por ${branding.companyName || 'DAMA CRM'}`,
        40,
        785,
        { width: 515, align: 'center' }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
