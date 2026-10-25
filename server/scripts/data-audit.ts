import { prisma } from '../src/prisma';

async function main() {
  console.log('=== DAMA-CRM DATA AUDIT & HEALTH CHECK ===\n');

  // 1. Row counts per model
  const models = [
    'tenant', 'user', 'role', 'permission', 'company', 'contact',
    'dealStage', 'deal', 'quote', 'invoice', 'invoiceItem',
    'recurringInvoice', 'recurringInvoiceItem', 'contract', 'expense',
    'ticket', 'ticketMessage', 'product', 'stockMovement',
    'workflow', 'workflowLog', 'omniMessage', 'activity',
    'customField', 'customFieldValue', 'notification',
    'employee', 'payroll', 'timeRecord', 'calendarEvent',
    'appointmentService', 'appointment', 'shipment', 'shipmentCheckpoint',
    'board', 'boardColumn', 'boardSprint', 'boardTask'
  ];

  console.log('--- 1. ROW COUNTS ---');
  for (const m of models) {
    try {
      const count = await (prisma as any)[m].count();
      console.log(`[COUNT] ${m}: ${count}`);
    } catch (e: any) {
      console.log(`[COUNT ERROR] ${m}: ${e.message}`);
    }
  }

  // 2. Duplicates check by business identity
  console.log('\n--- 2. DUPLICATES CHECK BY BUSINESS IDENTITY ---');

  // 2.1 Contacts: emails (case-insensitive & trimmed)
  const contacts = await prisma.contact.findMany({ select: { id: true, firstName: true, lastName: true, email: true, phone: true, tenantId: true } });
  const emailMap = new Map<string, typeof contacts>();
  for (const c of contacts) {
    const norm = (c.email || '').trim().toLowerCase();
    if (!emailMap.has(norm)) emailMap.set(norm, []);
    emailMap.get(norm)!.push(c);
  }
  let contactDupes = 0;
  for (const [email, list] of emailMap.entries()) {
    if (list.length > 1) {
      contactDupes++;
      console.log(`[DUPLICATE CONTACT EMAIL] "${email}" found ${list.length} times:`, list.map(x => ({ id: x.id, name: `${x.firstName} ${x.lastName}`, tenant: x.tenantId })));
    }
  }
  if (contactDupes === 0) console.log('[OK] No duplicate contact emails found.');

  // 2.2 Companies: taxId (CIF/NIF) and Name per tenant
  const companies = await prisma.company.findMany({ select: { id: true, name: true, taxId: true, tenantId: true } });
  const taxMap = new Map<string, typeof companies>();
  const compNameMap = new Map<string, typeof companies>();
  for (const c of companies) {
    if (c.taxId) {
      const normTax = c.taxId.trim().toUpperCase().replace(/[\s-]/g, '');
      const key = `${c.tenantId || 'master'}:${normTax}`;
      if (!taxMap.has(key)) taxMap.set(key, []);
      taxMap.get(key)!.push(c);
    }
    const normName = c.name.trim().toLowerCase();
    const nameKey = `${c.tenantId || 'master'}:${normName}`;
    if (!compNameMap.has(nameKey)) compNameMap.set(nameKey, []);
    compNameMap.get(nameKey)!.push(c);
  }
  let companyDupes = 0;
  for (const [key, list] of taxMap.entries()) {
    if (list.length > 1) {
      companyDupes++;
      console.log(`[DUPLICATE COMPANY TAXID] ${key}:`, list.map(x => ({ id: x.id, name: x.name, taxId: x.taxId })));
    }
  }
  for (const [key, list] of compNameMap.entries()) {
    if (list.length > 1) {
      companyDupes++;
      console.log(`[DUPLICATE COMPANY NAME] ${key}:`, list.map(x => ({ id: x.id, name: x.name })));
    }
  }
  if (companyDupes === 0) console.log('[OK] No duplicate company taxIds or names found.');

  // 2.3 Products: SKU (case-insensitive & trimmed)
  const products = await prisma.product.findMany({ select: { id: true, sku: true, name: true, tenantId: true, stock: true } });
  const skuMap = new Map<string, typeof products>();
  for (const p of products) {
    const normSku = (p.sku || '').trim().toUpperCase();
    const key = `${p.tenantId || 'master'}:${normSku}`;
    if (!skuMap.has(key)) skuMap.set(key, []);
    skuMap.get(key)!.push(p);
  }
  let productDupes = 0;
  for (const [key, list] of skuMap.entries()) {
    if (list.length > 1) {
      productDupes++;
      console.log(`[DUPLICATE PRODUCT SKU] ${key}:`, list.map(x => ({ id: x.id, sku: x.sku, name: x.name })));
    }
  }
  if (productDupes === 0) console.log('[OK] No duplicate product SKUs found.');

  // 2.4 Invoices & Quotes: Document numbers
  const invoices = await prisma.invoice.findMany({ select: { id: true, invoiceNumber: true, tenantId: true, total: true } });
  const invMap = new Map<string, typeof invoices>();
  for (const inv of invoices) {
    const key = `${inv.tenantId || 'master'}:${inv.invoiceNumber.trim().toUpperCase()}`;
    if (!invMap.has(key)) invMap.set(key, []);
    invMap.get(key)!.push(inv);
  }
  let invDupes = 0;
  for (const [key, list] of invMap.entries()) {
    if (list.length > 1) {
      invDupes++;
      console.log(`[DUPLICATE INVOICE NUMBER] ${key}:`, list.map(x => ({ id: x.id, number: x.invoiceNumber })));
    }
  }
  if (invDupes === 0) console.log('[OK] No duplicate invoice numbers found.');

  const quotes = await prisma.quote.findMany({ select: { id: true, quoteNumber: true, tenantId: true, total: true } });
  const quoteMap = new Map<string, typeof quotes>();
  for (const q of quotes) {
    const key = `${q.tenantId || 'master'}:${q.quoteNumber.trim().toUpperCase()}`;
    if (!quoteMap.has(key)) quoteMap.set(key, []);
    quoteMap.get(key)!.push(q);
  }
  let quoteDupes = 0;
  for (const [key, list] of quoteMap.entries()) {
    if (list.length > 1) {
      quoteDupes++;
      console.log(`[DUPLICATE QUOTE NUMBER] ${key}:`, list.map(x => ({ id: x.id, number: x.quoteNumber })));
    }
  }
  if (quoteDupes === 0) console.log('[OK] No duplicate quote numbers found.');

  // 3. Foreign Key & Orphan Records Check
  console.log('\n--- 3. ORPHAN RECORDS & FK INTEGRITY ---');

  // 3.1 Invoice Items with invalid invoiceId and quoteId
  const itemsWithoutParent = await prisma.invoiceItem.findMany({
    where: {
      AND: [
        { invoiceId: null },
        { quoteId: null }
      ]
    }
  });
  console.log(`[ORPHAN INVOICE ITEMS] Count without invoice or quote: ${itemsWithoutParent.length}`);

  // 3.2 Invoices with non-existent contact or company
  const invWithContact = await prisma.invoice.findMany({
    where: { contactId: { not: null } },
    select: { id: true, contactId: true }
  });
  const allContactIds = new Set(contacts.map(c => c.id));
  const orphanInvContacts = invWithContact.filter(i => !allContactIds.has(i.contactId!));
  console.log(`[ORPHAN INVOICE CONTACTS] Invoices pointing to non-existent contacts: ${orphanInvContacts.length}`);

  const invWithCompany = await prisma.invoice.findMany({
    where: { companyId: { not: null } },
    select: { id: true, companyId: true }
  });
  const allCompanyIds = new Set(companies.map(c => c.id));
  const orphanInvCompanies = invWithCompany.filter(i => !allCompanyIds.has(i.companyId!));
  console.log(`[ORPHAN INVOICE COMPANIES] Invoices pointing to non-existent companies: ${orphanInvCompanies.length}`);

  // 3.3 Deals pointing to non-existent contacts or companies
  const deals = await prisma.deal.findMany({ select: { id: true, title: true, contactId: true, companyId: true } });
  const orphanDealContacts = deals.filter(d => d.contactId && !allContactIds.has(d.contactId));
  const orphanDealCompanies = deals.filter(d => d.companyId && !allCompanyIds.has(d.companyId));
  console.log(`[ORPHAN DEAL CONTACTS]: ${orphanDealContacts.length}, [ORPHAN DEAL COMPANIES]: ${orphanDealCompanies.length}`);

  // 3.4 Tickets pointing to non-existent contacts, companies, or assignees
  const tickets = await prisma.ticket.findMany({ select: { id: true, ticketNumber: true, contactId: true, companyId: true, assignedToId: true } });
  const users = await prisma.user.findMany({ select: { id: true } });
  const allUserIds = new Set(users.map(u => u.id));
  const orphanTicketContacts = tickets.filter(t => t.contactId && !allContactIds.has(t.contactId));
  const orphanTicketCompanies = tickets.filter(t => t.companyId && !allCompanyIds.has(t.companyId));
  const orphanTicketAssignees = tickets.filter(t => t.assignedToId && !allUserIds.has(t.assignedToId));
  console.log(`[ORPHAN TICKET CONTACTS]: ${orphanTicketContacts.length}, [ORPHAN TICKET COMPANIES]: ${orphanTicketCompanies.length}, [ORPHAN TICKET ASSIGNEES]: ${orphanTicketAssignees.length}`);

  // 4. Mathematical & Financial Integrity
  console.log('\n--- 4. MATHEMATICAL & FINANCIAL INTEGRITY ---');

  // 4.1 Invoices line items sum vs total
  const fullInvoices = await prisma.invoice.findMany({
    include: { items: true }
  });
  let invoiceMathDiscrepancies = 0;
  for (const inv of fullInvoices) {
    if (inv.items.length > 0) {
      const itemsSum = inv.items.reduce((acc, it) => acc + (it.quantity * it.unitPrice * (1 - (it.discount || 0) / 100)), 0);
      const discountMult = 1 - (inv.discountPercent || 0) / 100;
      const subtotalExpected = Math.round((itemsSum * discountMult - (inv.discountAmount || 0)) * 100) / 100;
      const taxRate = inv.taxRate || 0;
      const irpfRate = inv.irpfRate || 0;
      const expectedTotal = Math.round((subtotalExpected * (1 + taxRate / 100 - irpfRate / 100)) * 100) / 100;

      const diff = Math.abs(inv.total - expectedTotal);
      if (diff > 0.05) {
        invoiceMathDiscrepancies++;
        console.log(`[INVOICE TOTAL MISMATCH] ${inv.invoiceNumber}: stored total=${inv.total}, calculated=${expectedTotal}, itemsSum=${itemsSum}, diff=${diff}`);
      }
    }
  }
  if (invoiceMathDiscrepancies === 0) console.log('[OK] All invoice totals match their line items and tax calculations.');

  // 4.2 Stock balance vs Stock Movements
  console.log('\n--- 5. INVENTORY & STOCK MOVEMENTS INTEGRITY ---');
  const fullProducts = await prisma.product.findMany({
    include: { stockMovements: true }
  });
  let stockDiscrepancies = 0;
  for (const prod of fullProducts) {
    if (prod.stockMovements.length > 0) {
      // Sort movements by createdAt ascending
      const sortedMovements = [...prod.stockMovements].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const lastMovement = sortedMovements[sortedMovements.length - 1];
      if (lastMovement.newStock !== prod.stock) {
        stockDiscrepancies++;
        console.log(`[STOCK DESYNCHRONIZATION] Product ${prod.sku} (${prod.name}): product.stock=${prod.stock}, lastMovement.newStock=${lastMovement.newStock}`);
      }
    }
  }
  if (stockDiscrepancies === 0) console.log('[OK] Product stocks synchronize with latest stock movement records.');

  console.log('\n=== AUDIT COMPLETE ===');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
