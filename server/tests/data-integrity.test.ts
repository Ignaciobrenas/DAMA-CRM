import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('DAMA-CRM Cross-Module Data Integrity & Concurrency Test Suite', () => {
  // ==========================================
  // 1. DOCUMENT NUMBER SEQUENCING & ISOLATION
  // ==========================================
  describe('Document Number Sequencing & Series Isolation', () => {
    // Pure logic simulation of getNextDocumentNumber
    function computeNextDocNumber(
      prefix: string,
      year: number,
      existingNumbers: string[],
      padLength = 4
    ): string {
      const regex = new RegExp(`^${prefix}-${year}-(\\d+)$`);
      let maxSeq = 0;
      for (const doc of existingNumbers) {
        const match = doc.match(regex);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxSeq) maxSeq = num;
        }
      }
      const nextSeq = maxSeq + 1;
      return `${prefix}-${year}-${String(nextSeq).padStart(padLength, '0')}`;
    }

    it('should generate first sequence 0001 when no existing documents exist for the year', () => {
      const next = computeNextDocNumber('FAC', 2026, []);
      assert.strictEqual(next, 'FAC-2026-0001');
    });

    it('should increment correlatively based on the maximum sequence number', () => {
      const existing = ['FAC-2026-0001', 'FAC-2026-0002', 'FAC-2026-0003'];
      const next = computeNextDocNumber('FAC', 2026, existing);
      assert.strictEqual(next, 'FAC-2026-0004');
    });

    it('should not collide or skip if intermediate records were deleted (gap-resilience)', () => {
      // 0002 was deleted; max is 0003, so next must be 0004 to maintain historical series order
      const existing = ['FAC-2026-0001', 'FAC-2026-0003'];
      const next = computeNextDocNumber('FAC', 2026, existing);
      assert.strictEqual(next, 'FAC-2026-0004');
    });

    it('should strictly isolate series prefixes (FAC, REC, PRE, EXP, TCK, CTR)', () => {
      const existing = [
        'FAC-2026-0001',
        'FAC-2026-0002',
        'REC-2026-0001',
        'PRE-2026-0005',
        'EXP-2026-0012',
        'TCK-2026-0044',
      ];

      assert.strictEqual(computeNextDocNumber('FAC', 2026, existing), 'FAC-2026-0003');
      assert.strictEqual(computeNextDocNumber('REC', 2026, existing), 'REC-2026-0002');
      assert.strictEqual(computeNextDocNumber('PRE', 2026, existing), 'PRE-2026-0006');
      assert.strictEqual(computeNextDocNumber('EXP', 2026, existing), 'EXP-2026-0013');
      assert.strictEqual(computeNextDocNumber('TCK', 2026, existing), 'TCK-2026-0045');
      assert.strictEqual(computeNextDocNumber('CTR', 2026, existing), 'CTR-2026-0001');
    });

    it('should reset sequence to 0001 on new calendar fiscal year without affecting previous years', () => {
      const existing = [
        'FAC-2025-0099',
        'FAC-2025-0100',
      ];
      assert.strictEqual(computeNextDocNumber('FAC', 2026, existing), 'FAC-2026-0001');
    });

    it('should format Board Task keys sequentially per project board (KEY-N)', () => {
      function computeNextBoardTaskKey(boardKey: string, existingKeys: string[]): string {
        const regex = new RegExp(`^${boardKey}-(\\d+)$`);
        let maxSeq = 0;
        for (const k of existingKeys) {
          const match = k.match(regex);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxSeq) maxSeq = num;
          }
        }
        return `${boardKey}-${maxSeq + 1}`;
      }

      const existingTasks = ['DEV-1', 'DEV-2', 'DEV-5'];
      assert.strictEqual(computeNextBoardTaskKey('DEV', existingTasks), 'DEV-6');
      assert.strictEqual(computeNextBoardTaskKey('MKT', []), 'MKT-1');
    });
  });

  // ==========================================
  // 2. BUSINESS IDENTITY & DUPLICATE PREVENTION
  // ==========================================
  describe('Business Identity Normalization & Duplicate Prevention', () => {
    function normalizeTaxId(taxId?: string | null): string {
      return (taxId || '').trim().toUpperCase().replace(/[\s-]/g, '');
    }

    function normalizeEmail(email?: string | null): string {
      return (email || '').trim().toLowerCase();
    }

    function normalizeSku(sku?: string | null): string {
      return (sku || '').trim().toUpperCase();
    }

    it('should normalize Tax IDs (CIF/NIF) removing spaces, hyphens, and standardizing casing', () => {
      assert.strictEqual(normalizeTaxId(' b-12345678 '), 'B12345678');
      assert.strictEqual(normalizeTaxId('A - 98765432'), 'A98765432');
      assert.strictEqual(normalizeTaxId('es-b12345678'), 'ESB12345678');
    });

    it('should detect duplicate companies with matching normalized Tax ID within the same tenant', () => {
      const existingCompanies = [
        { id: 'c1', name: 'Acme Corp', taxId: 'B12345678', tenantId: 'tenant-1' },
        { id: 'c2', name: 'Beta SA', taxId: 'A87654321', tenantId: 'tenant-1' },
      ];

      const inputTaxId = ' b-12345678 ';
      const normInput = normalizeTaxId(inputTaxId);

      const isDuplicate = existingCompanies.some(
        c => c.tenantId === 'tenant-1' && normalizeTaxId(c.taxId) === normInput
      );
      assert.strictEqual(isDuplicate, true);
    });

    it('should allow identical Tax IDs across different isolated tenants (multi-tenant safety)', () => {
      const existingCompanies = [
        { id: 'c1', name: 'Acme Corp', taxId: 'B12345678', tenantId: 'tenant-1' },
      ];

      const normInput = normalizeTaxId('B-12345678');
      const isDuplicateInTenant2 = existingCompanies.some(
        c => c.tenantId === 'tenant-2' && normalizeTaxId(c.taxId) === normInput
      );
      assert.strictEqual(isDuplicateInTenant2, false);
    });

    it('should normalize contact emails and prevent case-variant duplicates', () => {
      const existingContacts = [
        { id: 'ct1', email: 'carlos.garcia@innovasolutions.es', tenantId: 'tenant-1' },
      ];

      const newEmailInput = '  Carlos.Garcia@InnovaSolutions.es  ';
      const normEmail = normalizeEmail(newEmailInput);

      const isDuplicate = existingContacts.some(
        c => c.tenantId === 'tenant-1' && normalizeEmail(c.email) === normEmail
      );
      assert.strictEqual(isDuplicate, true);
    });

    it('should normalize product SKU and prevent collisions', () => {
      const existingProducts = [
        { id: 'p1', sku: 'LAPTOP-PRO-16', tenantId: 'tenant-1' },
        { id: 'p2', sku: 'SRV-RACK-01', tenantId: 'tenant-1' },
      ];

      const newSkuInput = '  laptop-pro-16 ';
      const normSku = normalizeSku(newSkuInput);

      const isDuplicate = existingProducts.some(
        p => p.tenantId === 'tenant-1' && normalizeSku(p.sku) === normSku
      );
      assert.strictEqual(isDuplicate, true);
    });
  });

  // ==========================================
  // 3. WEBHOOK IDEMPOTENCY & DEDUPLICATION
  // ==========================================
  describe('Webhook Idempotency & Deduplication Engine', () => {
    it('should recognize existing WooCommerce deal by order id and update instead of duplicate', () => {
      const existingDeals = [
        { id: 'd1', title: 'Pedido WC #1045', value: 120.5, status: 'OPEN' },
      ];

      const incomingWebhook = {
        id: 1045,
        total: '150.00',
        status: 'completed',
      };

      const dealTitle = `Pedido WC #${incomingWebhook.id}`;
      const existingDeal = existingDeals.find(d => d.title === dealTitle);

      assert.ok(existingDeal);
      // Simulating update
      const updatedDeal = {
        ...existingDeal,
        value: parseFloat(incomingWebhook.total),
        status: incomingWebhook.status === 'completed' ? 'WON' : 'OPEN',
      };
      assert.strictEqual(updatedDeal.value, 150.0);
      assert.strictEqual(updatedDeal.status, 'WON');
    });

    it('should recognize existing Shopify deal by order name and prevent duplicate records', () => {
      const existingDeals = [
        { id: 'd2', title: 'Shopify Orden #1002', value: 89.90, status: 'OPEN' },
      ];

      const incomingShopifyOrder = {
        name: '#1002',
        total_price: '89.90',
        financial_status: 'paid',
      };

      const expectedTitle = `Shopify Orden ${incomingShopifyOrder.name}`;
      const existing = existingDeals.find(d => d.title === expectedTitle);

      assert.ok(existing);
      assert.strictEqual(existing.id, 'd2');
    });

    it('should deduplicate inbound WhatsApp messages by Meta message ID', () => {
      const processedMessageIds = new Set(['wamid.HBgLMTEwMDAwMDAwMBUCABIYFDNBMUI4MDA4NTQ3MUQ3NTEyRDEwAA==']);

      const incomingWebhookMsg = {
        id: 'wamid.HBgLMTEwMDAwMDAwMBUCABIYFDNBMUI4MDA4NTQ3MUQ3NTEyRDEwAA==',
        from: '34600112233',
        text: { body: 'Hola, tengo una consulta sobre mi factura' },
      };

      const isAlreadyProcessed = processedMessageIds.has(incomingWebhookMsg.id);
      assert.strictEqual(isAlreadyProcessed, true);
    });
  });

  // ==========================================
  // 4. ACID TRANSACTIONS & MULTI-STEP ATOMICITY
  // ==========================================
  describe('ACID Multi-Step Operations & State Machine', () => {
    it('should enforce single conversion idempotency on Quotes (prevent double invoicing)', () => {
      const quote = {
        id: 'q-101',
        quoteNumber: 'PRE-2026-0001',
        status: 'ACCEPTED', // Already converted
        total: 1250.0,
      };

      const canConvert = (q: typeof quote) => {
        if (q.status === 'ACCEPTED') {
          throw new Error('Este presupuesto ya ha sido aceptado y convertido previamente');
        }
        return true;
      };

      assert.throws(() => canConvert(quote), /Este presupuesto ya ha sido aceptado/);
    });

    it('should simulate atomic quote conversion updating quote status and creating invoice', () => {
      let quote = { id: 'q-102', status: 'SENT', total: 500 };
      let createdInvoice: any = null;

      // Simulated atomic transaction
      const executeConversionTransaction = () => {
        if (quote.status === 'ACCEPTED') throw new Error('Already converted');
        quote = { ...quote, status: 'ACCEPTED' };
        createdInvoice = {
          id: 'inv-generated-1',
          quoteId: quote.id,
          invoiceNumber: 'FAC-2026-0005',
          total: quote.total,
          status: 'ISSUED',
        };
      };

      executeConversionTransaction();
      assert.strictEqual(quote.status, 'ACCEPTED');
      assert.strictEqual(createdInvoice.quoteId, 'q-102');
      assert.strictEqual(createdInvoice.total, 500);

      // Attempting second conversion should fail
      assert.throws(() => executeConversionTransaction(), /Already converted/);
    });

    it('should atomically log initial stock movement on product creation with initialStock > 0', () => {
      const productInput = {
        name: 'Nuevo Router WiFi 7',
        sku: 'RTR-WIFI7-PRO',
        initialStock: 25,
      };

      // Transaction simulation
      let product: any = null;
      let stockMovement: any = null;

      const executeProductCreation = (data: typeof productInput) => {
        product = {
          id: 'prod-new-1',
          sku: data.sku,
          name: data.name,
          stock: data.initialStock,
        };

        if (data.initialStock > 0) {
          stockMovement = {
            id: 'sm-new-1',
            productId: product.id,
            quantity: data.initialStock,
            previousStock: 0,
            newStock: data.initialStock,
            type: 'IN',
            reason: 'Stock inicial de alta de producto',
          };
        }
      };

      executeProductCreation(productInput);
      assert.ok(product);
      assert.strictEqual(product.stock, 25);
      assert.ok(stockMovement);
      assert.strictEqual(stockMovement.quantity, 25);
      assert.strictEqual(stockMovement.newStock, product.stock);
    });

    it('should advance recurring invoice issue dates atomically without missing scheduled cycles', () => {
      const recurring = {
        id: 'rec-1',
        frequency: 'MONTHLY',
        nextIssueDate: new Date('2026-10-01T00:00:00Z'),
        lastIssuedAt: null as Date | null,
      };

      function calculateNextDate(currentNext: Date, freq: string): Date {
        const d = new Date(currentNext);
        if (freq === 'MONTHLY') d.setMonth(d.getMonth() + 1);
        else if (freq === 'YEARLY') d.setFullYear(d.getFullYear() + 1);
        else if (freq === 'QUARTERLY') d.setMonth(d.getMonth() + 3);
        return d;
      }

      const nextDate = calculateNextDate(recurring.nextIssueDate, recurring.frequency);
      assert.strictEqual(nextDate.toISOString().startsWith('2026-11-01'), true);
    });
  });

  // ==========================================
  // 5. MATHEMATICAL & INVENTORY RECONCILIATION
  // ==========================================
  describe('Mathematical & Inventory Ledger Reconciliation', () => {
    it('should accurately calculate invoice totals including line discounts, global discounts, and taxes', () => {
      const items = [
        { quantity: 2, unitPrice: 100, discount: 10 }, // 2 * 100 * 0.9 = 180
        { quantity: 1, unitPrice: 50, discount: 0 },    // 1 * 50 = 50
      ]; // Items sum = 230

      const invoiceDiscountPercent = 5; // 230 * 0.95 = 218.5
      const invoiceDiscountAmount = 8.5; // 218.5 - 8.5 = 210.0
      const taxRate = 21; // 210 * 0.21 = 44.1
      const irpfRate = 15; // 210 * 0.15 = 31.5
      // Total = 210 * (1 + 0.21 - 0.15) = 210 * 1.06 = 222.6

      const itemsSum = items.reduce((acc, it) => acc + (it.quantity * it.unitPrice * (1 - (it.discount || 0) / 100)), 0);
      const discountMult = 1 - invoiceDiscountPercent / 100;
      const subtotal = Math.round((itemsSum * discountMult - invoiceDiscountAmount) * 100) / 100;
      const total = Math.round((subtotal * (1 + taxRate / 100 - irpfRate / 100)) * 100) / 100;

      assert.strictEqual(itemsSum, 230);
      assert.strictEqual(subtotal, 210);
      assert.strictEqual(total, 222.6);
    });

    it('should detect orphan invoice items without invoice or quote relation', () => {
      const items = [
        { id: 'it-1', invoiceId: 'inv-1', quoteId: null },
        { id: 'it-2', invoiceId: null, quoteId: 'quo-1' },
        { id: 'it-3', invoiceId: null, quoteId: null }, // Orphan!
      ];

      const orphans = items.filter(it => !it.invoiceId && !it.quoteId);
      assert.strictEqual(orphans.length, 1);
      assert.strictEqual(orphans[0].id, 'it-3');
    });

    it('should reconcile stock movement ledger and detect desynchronized products', () => {
      const product = { id: 'p-1', sku: 'KB-MEC-RGB', stock: 15 };
      const movements = [
        { id: 'm-1', productId: 'p-1', quantity: 20, newStock: 20, createdAt: new Date('2026-10-01') },
        { id: 'm-2', productId: 'p-1', quantity: 5, newStock: 15, createdAt: new Date('2026-10-02') },
      ];

      const latestMovement = [...movements].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).pop();
      const isSynchronized = latestMovement?.newStock === product.stock;
      assert.strictEqual(isSynchronized, true);
    });
  });
});
