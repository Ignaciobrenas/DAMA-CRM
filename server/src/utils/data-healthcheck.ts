import { prisma } from '../prisma';

export interface HealthCheckResult {
  status: 'HEALTHY' | 'DEGRADED';
  timestamp: string;
  counts: Record<string, number>;
  duplicates: {
    contacts: number;
    companies: number;
    products: number;
    invoices: number;
    quotes: number;
  };
  orphans: {
    invoiceItems: number;
    invoicesWithInvalidContact: number;
    invoicesWithInvalidCompany: number;
    dealsWithInvalidContact: number;
    dealsWithInvalidCompany: number;
    ticketsWithInvalidContact: number;
    ticketsWithInvalidAssignee: number;
  };
  integrity: {
    invoiceMathDiscrepancies: number;
    stockDiscrepancies: number;
  };
  issues: string[];
}

export async function runDataHealthCheck(targetTenantId?: string): Promise<HealthCheckResult> {
  const issues: string[] = [];

  // 1. Model Counts
  const tenantFilter = targetTenantId ? { where: { tenantId: targetTenantId } } : {};
  const [
    tenantCount, userCount, companyCount, contactCount,
    dealCount, quoteCount, invoiceCount, invoiceItemCount,
    recurringCount, contractCount, expenseCount, ticketCount,
    productCount, stockMovementCount, employeeCount
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.user.count(tenantFilter as any),
    prisma.company.count(tenantFilter as any),
    prisma.contact.count(tenantFilter as any),
    prisma.deal.count(tenantFilter as any),
    prisma.quote.count(tenantFilter as any),
    prisma.invoice.count(tenantFilter as any),
    prisma.invoiceItem.count(),
    prisma.recurringInvoice.count(tenantFilter as any),
    prisma.contract.count(tenantFilter as any),
    prisma.expense.count(tenantFilter as any),
    prisma.ticket.count(tenantFilter as any),
    prisma.product.count(tenantFilter as any),
    prisma.stockMovement.count(),
    prisma.employee.count(tenantFilter as any),
  ]);

  const counts: Record<string, number> = {
    tenants: tenantCount,
    users: userCount,
    companies: companyCount,
    contacts: contactCount,
    deals: dealCount,
    quotes: quoteCount,
    invoices: invoiceCount,
    invoiceItems: invoiceItemCount,
    recurringInvoices: recurringCount,
    contracts: contractCount,
    expenses: expenseCount,
    tickets: ticketCount,
    products: productCount,
    stockMovements: stockMovementCount,
    employees: employeeCount,
  };

  // 2. Duplicates Check
  const contacts = await prisma.contact.findMany({
    where: targetTenantId ? { tenantId: targetTenantId } : {},
    select: { id: true, email: true, tenantId: true },
  });
  const emailMap = new Map<string, number>();
  for (const c of contacts) {
    if (c.email) {
      const norm = `${c.tenantId || 'master'}:${c.email.trim().toLowerCase()}`;
      emailMap.set(norm, (emailMap.get(norm) || 0) + 1);
    }
  }
  let contactDupes = 0;
  for (const [key, count] of emailMap.entries()) {
    if (count > 1) {
      contactDupes++;
      issues.push(`Duplicate contact email found: ${key} (${count} occurrences)`);
    }
  }

  const companies = await prisma.company.findMany({
    where: targetTenantId ? { tenantId: targetTenantId } : {},
    select: { id: true, taxId: true, name: true, tenantId: true },
  });
  const taxMap = new Map<string, number>();
  for (const c of companies) {
    if (c.taxId) {
      const normTax = `${c.tenantId || 'master'}:${c.taxId.trim().toUpperCase().replace(/[\s-]/g, '')}`;
      taxMap.set(normTax, (taxMap.get(normTax) || 0) + 1);
    }
  }
  let companyDupes = 0;
  for (const [key, count] of taxMap.entries()) {
    if (count > 1) {
      companyDupes++;
      issues.push(`Duplicate company taxId found: ${key} (${count} occurrences)`);
    }
  }

  const products = await prisma.product.findMany({
    where: targetTenantId ? { tenantId: targetTenantId } : {},
    select: { id: true, sku: true, tenantId: true },
  });
  const skuMap = new Map<string, number>();
  for (const p of products) {
    if (p.sku) {
      const normSku = `${p.tenantId || 'master'}:${p.sku.trim().toUpperCase()}`;
      skuMap.set(normSku, (skuMap.get(normSku) || 0) + 1);
    }
  }
  let productDupes = 0;
  for (const [key, count] of skuMap.entries()) {
    if (count > 1) {
      productDupes++;
      issues.push(`Duplicate product SKU found: ${key} (${count} occurrences)`);
    }
  }

  const invoices = await prisma.invoice.findMany({
    where: targetTenantId ? { tenantId: targetTenantId } : {},
    select: { id: true, invoiceNumber: true, tenantId: true },
  });
  const invMap = new Map<string, number>();
  for (const inv of invoices) {
    const key = `${inv.tenantId || 'master'}:${inv.invoiceNumber.trim().toUpperCase()}`;
    invMap.set(key, (invMap.get(key) || 0) + 1);
  }
  let invDupes = 0;
  for (const [key, count] of invMap.entries()) {
    if (count > 1) {
      invDupes++;
      issues.push(`Duplicate invoice number found: ${key} (${count} occurrences)`);
    }
  }

  const quotes = await prisma.quote.findMany({
    where: targetTenantId ? { tenantId: targetTenantId } : {},
    select: { id: true, quoteNumber: true, tenantId: true },
  });
  const quoteMap = new Map<string, number>();
  for (const q of quotes) {
    const key = `${q.tenantId || 'master'}:${q.quoteNumber.trim().toUpperCase()}`;
    quoteMap.set(key, (quoteMap.get(key) || 0) + 1);
  }
  let quoteDupes = 0;
  for (const [key, count] of quoteMap.entries()) {
    if (count > 1) {
      quoteDupes++;
      issues.push(`Duplicate quote number found: ${key} (${count} occurrences)`);
    }
  }

  // 3. Orphan Records Check
  const orphanItems = await prisma.invoiceItem.count({
    where: {
      AND: [{ invoiceId: null }, { quoteId: null }],
    },
  });
  if (orphanItems > 0) {
    issues.push(`Found ${orphanItems} orphan invoice items without parent invoice or quote`);
  }

  const allContactIds = new Set(contacts.map(c => c.id));
  const allCompanyIds = new Set(companies.map(c => c.id));

  const invContacts = await prisma.invoice.findMany({
    where: { contactId: { not: null }, ...(targetTenantId ? { tenantId: targetTenantId } : {}) },
    select: { id: true, invoiceNumber: true, contactId: true },
  });
  const orphanInvContacts = invContacts.filter(i => !allContactIds.has(i.contactId!)).length;
  if (orphanInvContacts > 0) {
    issues.push(`Found ${orphanInvContacts} invoices pointing to non-existent contacts`);
  }

  const invCompanies = await prisma.invoice.findMany({
    where: { companyId: { not: null }, ...(targetTenantId ? { tenantId: targetTenantId } : {}) },
    select: { id: true, invoiceNumber: true, companyId: true },
  });
  const orphanInvCompanies = invCompanies.filter(i => !allCompanyIds.has(i.companyId!)).length;
  if (orphanInvCompanies > 0) {
    issues.push(`Found ${orphanInvCompanies} invoices pointing to non-existent companies`);
  }

  const deals = await prisma.deal.findMany({
    where: targetTenantId ? { tenantId: targetTenantId } : {},
    select: { id: true, contactId: true, companyId: true },
  });
  const orphanDealContacts = deals.filter(d => d.contactId && !allContactIds.has(d.contactId)).length;
  const orphanDealCompanies = deals.filter(d => d.companyId && !allCompanyIds.has(d.companyId)).length;
  if (orphanDealContacts > 0) issues.push(`Found ${orphanDealContacts} deals pointing to non-existent contacts`);
  if (orphanDealCompanies > 0) issues.push(`Found ${orphanDealCompanies} deals pointing to non-existent companies`);

  const tickets = await prisma.ticket.findMany({
    where: targetTenantId ? { tenantId: targetTenantId } : {},
    select: { id: true, contactId: true, assignedToId: true },
  });
  const users = await prisma.user.findMany({
    where: targetTenantId ? { tenantId: targetTenantId } : {},
    select: { id: true },
  });
  const allUserIds = new Set(users.map(u => u.id));
  const orphanTicketContacts = tickets.filter(t => t.contactId && !allContactIds.has(t.contactId)).length;
  const orphanTicketAssignees = tickets.filter(t => t.assignedToId && !allUserIds.has(t.assignedToId)).length;
  if (orphanTicketContacts > 0) issues.push(`Found ${orphanTicketContacts} tickets pointing to non-existent contacts`);
  if (orphanTicketAssignees > 0) issues.push(`Found ${orphanTicketAssignees} tickets pointing to non-existent assignees`);

  // 4. Mathematical and Inventory Consistency
  const fullInvoices = await prisma.invoice.findMany({
    where: targetTenantId ? { tenantId: targetTenantId } : {},
    include: { items: true },
  });
  let invoiceMathDiscrepancies = 0;
  for (const inv of fullInvoices) {
    if (inv.items.length > 0) {
      const itemsSum = inv.items.reduce((acc, it) => acc + (it.quantity * it.unitPrice * (1 - (it.discount || 0) / 100)), 0);
      const discountMult = 1 - (inv.discountPercent || 0) / 100;
      const subtotal = Math.round((itemsSum * discountMult - (inv.discountAmount || 0)) * 100) / 100;
      const taxRate = inv.taxRate || 0;
      const irpfRate = inv.irpfRate || 0;
      const expectedTotal = Math.round((subtotal * (1 + taxRate / 100 - irpfRate / 100)) * 100) / 100;

      if (Math.abs(inv.total - expectedTotal) > 0.05) {
        invoiceMathDiscrepancies++;
        issues.push(`Invoice ${inv.invoiceNumber} math mismatch: stored=${inv.total}, calculated=${expectedTotal}`);
      }
    }
  }

  const fullProducts = await prisma.product.findMany({
    where: targetTenantId ? { tenantId: targetTenantId } : {},
    include: { stockMovements: true },
  });
  let stockDiscrepancies = 0;
  for (const prod of fullProducts) {
    if (prod.stockMovements.length > 0) {
      const sortedMovements = [...prod.stockMovements].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const lastMovement = sortedMovements[sortedMovements.length - 1];
      if (lastMovement.newStock !== prod.stock) {
        stockDiscrepancies++;
        issues.push(`Product ${prod.sku} stock mismatch: current=${prod.stock}, ledger=${lastMovement.newStock}`);
      }
    }
  }

  const status = issues.length === 0 ? 'HEALTHY' : 'DEGRADED';

  return {
    status,
    timestamp: new Date().toISOString(),
    counts,
    duplicates: {
      contacts: contactDupes,
      companies: companyDupes,
      products: productDupes,
      invoices: invDupes,
      quotes: quoteDupes,
    },
    orphans: {
      invoiceItems: orphanItems,
      invoicesWithInvalidContact: orphanInvContacts,
      invoicesWithInvalidCompany: orphanInvCompanies,
      dealsWithInvalidContact: orphanDealContacts,
      dealsWithInvalidCompany: orphanDealCompanies,
      ticketsWithInvalidContact: orphanTicketContacts,
      ticketsWithInvalidAssignee: orphanTicketAssignees,
    },
    integrity: {
      invoiceMathDiscrepancies,
      stockDiscrepancies,
    },
    issues,
  };
}
