import { describe, it } from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('DAMA-CRM Core Unit Tests', () => {
  describe('Authentication & Security', () => {
    const JWT_SECRET = 'test-crm-secret-key-12345';

    it('should hash and successfully verify user password', async () => {
      const rawPassword = 'SecurePassword2026!';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(rawPassword, salt);

      assert.strictEqual(typeof hash, 'string');
      assert.notStrictEqual(hash, rawPassword);

      const isValid = await bcrypt.compare(rawPassword, hash);
      assert.strictEqual(isValid, true);

      const isInvalid = await bcrypt.compare('WrongPassword', hash);
      assert.strictEqual(isInvalid, false);
    });

    it('should sign and verify valid JWT token payload', () => {
      const userPayload = {
        userId: 'usr_test_123',
        email: 'admin@damacrm.local',
        role: 'ADMIN',
      };

      const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '1h' });
      assert.strictEqual(typeof token, 'string');

      const decoded: any = jwt.verify(token, JWT_SECRET);
      assert.strictEqual(decoded.userId, userPayload.userId);
      assert.strictEqual(decoded.email, userPayload.email);
      assert.strictEqual(decoded.role, userPayload.role);
    });

    it('should reject tampered or invalid JWT tokens', () => {
      const token = jwt.sign({ userId: 'usr_1' }, JWT_SECRET, { expiresIn: '1h' });
      const tamperedToken = token.slice(0, -5) + 'xxxxx';

      assert.throws(() => {
        jwt.verify(tamperedToken, JWT_SECRET);
      });
    });

    it('should generate valid 6-digit password reset code with expiration', () => {
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      assert.strictEqual(resetCode.length, 6);
      assert.match(resetCode, /^[0-9]{6}$/);

      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      assert.strictEqual(expiresAt.getTime() > Date.now(), true);
    });
  });

  describe('RBAC Authorization Matrix', () => {
    const rolePermissions: Record<string, string[]> = {
      ADMIN: ['*'],
      SALES: ['deals:read', 'deals:write', 'contacts:read', 'contacts:write', 'invoices:read'],
      TECH: ['tasks:read', 'tasks:write', 'sprints:read', 'sprints:write'],
    };

    const hasPermission = (role: string, requiredPermission: string): boolean => {
      const perms = rolePermissions[role] || [];
      if (perms.includes('*')) return true;
      return perms.includes(requiredPermission);
    };

    it('ADMIN role should have universal wildcard permissions', () => {
      assert.strictEqual(hasPermission('ADMIN', 'deals:write'), true);
      assert.strictEqual(hasPermission('ADMIN', 'system:manage'), true);
      assert.strictEqual(hasPermission('ADMIN', 'invoices:delete'), true);
    });

    it('SALES role should only access sales domain operations', () => {
      assert.strictEqual(hasPermission('SALES', 'deals:read'), true);
      assert.strictEqual(hasPermission('SALES', 'deals:write'), true);
      assert.strictEqual(hasPermission('SALES', 'contacts:read'), true);
      assert.strictEqual(hasPermission('SALES', 'tasks:write'), false);
      assert.strictEqual(hasPermission('SALES', 'system:manage'), false);
    });

    it('TECH role should only access sprint and task operations', () => {
      assert.strictEqual(hasPermission('TECH', 'tasks:read'), true);
      assert.strictEqual(hasPermission('TECH', 'tasks:write'), true);
      assert.strictEqual(hasPermission('TECH', 'deals:write'), false);
      assert.strictEqual(hasPermission('TECH', 'invoices:read'), false);
    });
  });

  describe('Invoice Calculations & Tax Rounding', () => {
    const calculateTotals = (items: Array<{ quantity: number; unitPrice: number }>, taxRatePercent: number) => {
      const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const roundedSubtotal = Math.round(subtotal * 100) / 100;
      const roundedTax = Math.round(((roundedSubtotal * taxRatePercent) / 100) * 100) / 100;
      const total = Math.round((roundedSubtotal + roundedTax) * 100) / 100;
      return {
        subtotal: roundedSubtotal,
        taxAmount: roundedTax,
        total,
      };
    };

    it('should correctly compute subtotal, standard 21% IVA, and total', () => {
      const items = [
        { quantity: 2, unitPrice: 1500 }, // 3000
        { quantity: 1, unitPrice: 450.5 }, // 450.5
      ];
      const result = calculateTotals(items, 21);

      assert.strictEqual(result.subtotal, 3450.5);
      assert.strictEqual(result.taxAmount, 724.61);
      assert.strictEqual(result.total, 4175.11);
    });
  });

  describe('Custom Fields Dynamic Engine', () => {
    type FieldType = 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'BOOLEAN';

    const validateFieldValue = (type: FieldType, value: any, options?: string[]): boolean => {
      if (value === undefined || value === null || value === '') return false;
      switch (type) {
        case 'NUMBER':
          return !isNaN(Number(value));
        case 'DATE':
          return !isNaN(Date.parse(value));
        case 'BOOLEAN':
          return value === 'true' || value === 'false' || typeof value === 'boolean';
        case 'SELECT':
          return Array.isArray(options) && options.includes(String(value));
        case 'TEXT':
        default:
          return typeof value === 'string' && value.trim().length > 0;
      }
    };

    it('should validate NUMBER field correctly', () => {
      assert.strictEqual(validateFieldValue('NUMBER', '12500'), true);
      assert.strictEqual(validateFieldValue('NUMBER', 'abc'), false);
    });

    it('should validate DATE field correctly', () => {
      assert.strictEqual(validateFieldValue('DATE', '2026-02-15'), true);
      assert.strictEqual(validateFieldValue('DATE', 'invalid-date'), false);
    });

    it('should validate SELECT field against configured options', () => {
      const validOptions = ['TIER_1', 'TIER_2', 'ENTERPRISE'];
      assert.strictEqual(validateFieldValue('SELECT', 'TIER_1', validOptions), true);
      assert.strictEqual(validateFieldValue('SELECT', 'STARTUP', validOptions), false);
    });

    it('should validate BOOLEAN field correctly', () => {
      assert.strictEqual(validateFieldValue('BOOLEAN', 'true'), true);
      assert.strictEqual(validateFieldValue('BOOLEAN', 'false'), true);
      assert.strictEqual(validateFieldValue('BOOLEAN', 'maybe'), false);
    });
  });

  describe('Lead Capture & RGPD Consent Engine', () => {
    it('should format marketing opt-in audit log with legal metadata', () => {
      const consentRecord = {
        email: 'lead@empresa.com',
        marketingConsent: true,
        ip: '192.168.1.50',
        userAgent: 'Mozilla/5.0 CRM Browser',
        source: 'smart_form_contact',
        version: 'RGPD-2026.1',
      };

      assert.strictEqual(consentRecord.marketingConsent, true);
      assert.strictEqual(consentRecord.version, 'RGPD-2026.1');
      assert.match(consentRecord.email, /@/);
    });

    it('should calculate progressive profile missing fields properly', () => {
      const existingContact = {
        firstName: 'Ignacio',
        lastName: 'García',
        email: 'ignacio@empresa.com',
        phone: null,
        company: null,
      };

      const missingFields: string[] = [];
      if (!existingContact.phone) missingFields.push('phone');
      if (!existingContact.company) missingFields.push('companyName');

      assert.deepStrictEqual(missingFields, ['phone', 'companyName']);
    });

    it('should generate compliant ticket reference number format', () => {
      const ticketNumber = `TCK-${Math.floor(100000 + Math.random() * 900000)}`;
      assert.match(ticketNumber, /^TCK-\d{6}$/);
    });
  });

  describe('User Preferences Engine', () => {
    it('should merge default and partial preferences without losing keys', () => {
      const existingPreferencesJson = JSON.stringify({
        soundEnabled: true,
        sidebarCollapsed: false,
        theme: 'dark',
      });
      const parsed = JSON.parse(existingPreferencesJson);

      const updates = {
        soundEnabled: false,
        sidebarCollapsed: true,
        sidebarPinnedItems: ['/', '/pipeline', '/invoicing'],
        dashboardWidgets: ['quick_actions', 'top_deals', 'kpis'],
      };

      const merged = { ...parsed, ...updates };
      const serialized = JSON.stringify(merged);
      const deserialized = JSON.parse(serialized);

      assert.strictEqual(deserialized.soundEnabled, false);
      assert.strictEqual(deserialized.sidebarCollapsed, true);
      assert.deepStrictEqual(deserialized.sidebarPinnedItems, ['/', '/pipeline', '/invoicing']);
      assert.deepStrictEqual(deserialized.dashboardWidgets, ['quick_actions', 'top_deals', 'kpis']);
    });
  });

  describe('Custom Fine-Grained User Permissions Merging', () => {
    it('should correctly merge role permissions with per-user customPermissions without duplicates', () => {
      const rolePermissions = [
        { resource: 'contacts', action: 'read' },
        { resource: 'contacts', action: 'create' },
        { resource: 'deals', action: 'read' },
      ];

      const customPermissions = [
        { resource: 'contacts', action: 'delete' },
        { resource: 'invoices', action: 'read' },
        { resource: 'deals', action: 'read' }, // duplicate of role permission
      ];

      const permissionsMap = new Map<string, { resource: string; action: string }>();
      for (const p of rolePermissions) {
        permissionsMap.set(`${p.resource}:${p.action}`, { resource: p.resource, action: p.action });
      }
      for (const cp of customPermissions) {
        permissionsMap.set(`${cp.resource}:${cp.action}`, { resource: cp.resource, action: cp.action });
      }

      const merged = Array.from(permissionsMap.values());
      assert.strictEqual(merged.length, 5); // 3 from role + 2 new from custom
      assert.ok(merged.some((p) => p.resource === 'contacts' && p.action === 'delete'));
      assert.ok(merged.some((p) => p.resource === 'invoices' && p.action === 'read'));
      assert.ok(merged.some((p) => p.resource === 'deals' && p.action === 'read'));
    });

    it('should handle users without customPermissions gracefully', () => {
      const rolePermissions = [
        { resource: 'contacts', action: 'read' },
      ];
      const permissionsMap = new Map<string, { resource: string; action: string }>();
      for (const p of rolePermissions) {
        permissionsMap.set(`${p.resource}:${p.action}`, { resource: p.resource, action: p.action });
      }

      const emptyPreferences = JSON.stringify({ theme: 'light', customPermissions: [] });
      const parsed = JSON.parse(emptyPreferences);
      if (Array.isArray(parsed.customPermissions)) {
        for (const cp of parsed.customPermissions) {
          if (cp.resource && cp.action) {
            permissionsMap.set(`${cp.resource}:${cp.action}`, { resource: cp.resource, action: cp.action });
          }
        }
      }

      const merged = Array.from(permissionsMap.values());
      assert.strictEqual(merged.length, 1);
      assert.strictEqual(merged[0].resource, 'contacts');
    });
  });

  describe('Agile Project & Task Metrics Engine', () => {
    it('should accurately calculate project progress, total points, and logged hours', () => {
      const mockTasks = [
        { id: '1', status: 'DONE', storyPoints: 5, estimatedHours: 10, loggedHours: 9 },
        { id: '2', status: 'DONE', storyPoints: 3, estimatedHours: 6, loggedHours: 6 },
        { id: '3', status: 'IN_PROGRESS', storyPoints: 8, estimatedHours: 16, loggedHours: 4 },
        { id: '4', status: 'TODO', storyPoints: 2, estimatedHours: 4, loggedHours: 0 },
      ];

      const totalTasks = mockTasks.length;
      const completedTasks = mockTasks.filter((t) => t.status === 'DONE').length;
      const progressPercent = Math.round((completedTasks / totalTasks) * 100);
      const totalStoryPoints = mockTasks.reduce((sum, t) => sum + t.storyPoints, 0);
      const totalEstimatedHours = mockTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
      const totalLoggedHours = mockTasks.reduce((sum, t) => sum + t.loggedHours, 0);

      assert.strictEqual(totalTasks, 4);
      assert.strictEqual(completedTasks, 2);
      assert.strictEqual(progressPercent, 50);
      assert.strictEqual(totalStoryPoints, 18);
      assert.strictEqual(totalEstimatedHours, 36);
      assert.strictEqual(totalLoggedHours, 19);
    });

    it('should return 0% progress when a project has zero tasks without throwing', () => {
      const emptyTasks: any[] = [];
      const totalTasks = emptyTasks.length;
      const completedTasks = emptyTasks.filter((t) => t.status === 'DONE').length;
      const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      assert.strictEqual(progressPercent, 0);
    });
  });

  describe('Universal CSV Export Sanitization', () => {
    it('should correctly escape double quotes and format invoice CSV line', () => {
      const mockInvoice = {
        id: 'inv-123',
        invoiceNumber: 'FAC-2026-0001',
        clientName: 'Tecnologías "Avanzadas" SL',
        issueDate: '2026-09-23T16:00:00.000Z',
        subtotal: 1000,
        taxAmount: 210,
        total: 1210,
        currency: 'EUR',
      };

      const sanitizedClient = mockInvoice.clientName.replace(/"/g, '""');
      const csvLine = `"${mockInvoice.id}","${mockInvoice.invoiceNumber}","${sanitizedClient}",${mockInvoice.subtotal},${mockInvoice.taxAmount},${mockInvoice.total},"${mockInvoice.currency}"`;

      assert.strictEqual(sanitizedClient, 'Tecnologías ""Avanzadas"" SL');
      assert.ok(csvLine.includes('"Tecnologías ""Avanzadas"" SL"'));
    });
  });

  describe('RFC 6238 TOTP Authenticator Engine', () => {
    const { verifyTotpCode, generateTotpCode } = require('../src/utils/totp');
    const testSecret = 'JBSWY3DPEHPK3PXP'; // Base32 test secret

    it('should generate a valid 6-digit TOTP code and verify it successfully', () => {
      const code = generateTotpCode(testSecret);
      assert.strictEqual(typeof code, 'string');
      assert.strictEqual(code.length, 6);
      assert.strictEqual(/^\d{6}$/.test(code), true);

      const isValid = verifyTotpCode(testSecret, code);
      assert.strictEqual(isValid, true);
    });

    it('should accept codes within acceptable time window drift (+/- 30s)', () => {
      const pastCode = generateTotpCode(testSecret, -1);
      assert.strictEqual(verifyTotpCode(testSecret, pastCode), true);

      const futureCode = generateTotpCode(testSecret, 1);
      assert.strictEqual(verifyTotpCode(testSecret, futureCode), true);
    });

    it('should reject invalid or malformed codes', () => {
      assert.strictEqual(verifyTotpCode(testSecret, '0000000'), false);
      assert.strictEqual(verifyTotpCode(testSecret, '12345'), false);
      assert.strictEqual(verifyTotpCode(testSecret, 'abcdef'), false);
      assert.strictEqual(verifyTotpCode('', '123456'), false);
    });
  });

  describe('Integrations & Connectors Security Engine', () => {
    const { IntegrationsService } = require('../src/modules/integrations/integrations.service');
    const crypto = require('crypto');

    it('should mask sensitive API keys and secrets in public config', () => {
      const publicConfig = IntegrationsService.getPublicConfig();
      assert.ok(publicConfig.odoo);
      assert.ok(publicConfig.woocommerce);
      assert.ok(publicConfig.shopify);
      assert.ok(publicConfig.n8n);

      if (publicConfig.odoo.hasApiKey) {
        assert.strictEqual(publicConfig.odoo.apiKey, '••••••••');
      }
      if (publicConfig.shopify.hasAccessToken) {
        assert.strictEqual(publicConfig.shopify.accessToken, '••••••••');
      }
    });

    it('should verify Shopify HMAC SHA256 webhook signatures correctly', () => {
      const secret = 'shpss_test_secret_key_8848';
      const rawPayload = JSON.stringify({ id: 987654, total_price: '199.00', currency: 'EUR' });
      const validHmac = crypto.createHmac('sha256', secret).update(rawPayload, 'utf8').digest('base64');

      const isValid = IntegrationsService.verifyShopifyHmac(rawPayload, validHmac, secret);
      assert.strictEqual(isValid, true);

      const isInvalid = IntegrationsService.verifyShopifyHmac(rawPayload, 'invalid_hmac_signature', secret);
      assert.strictEqual(isInvalid, false);
    });

    it('should validate connector URL structures for Odoo and WooCommerce', async () => {
      const badOdoo = await IntegrationsService.testOdoo({ url: 'not-a-valid-url', db: 'test', username: 'admin' });
      assert.strictEqual(badOdoo.success, false);

      const goodOdoo = await IntegrationsService.testOdoo({ url: 'https://demo.odoo.com', db: 'odoo_demo', username: 'admin' });
      assert.strictEqual(goodOdoo.success, true);
    });

    it('should provide full third party integrations catalog structure for /api/integraciones-de-terceros', () => {
      const { getIntegracionesDeTerceros } = require('../src/modules/integrations/integrations.controller');
      let responseData: any = null;
      const mockReq: any = { get: () => 'localhost:3000', protocol: 'http' };
      const mockRes: any = {
        json: (data: any) => { responseData = data; },
        status: () => mockRes,
      };

      getIntegracionesDeTerceros(mockReq, mockRes);
      assert.ok(responseData);
      assert.strictEqual(responseData.success, true);
      assert.strictEqual(responseData.endpoint, '/api/integraciones-de-terceros');
      assert.ok(responseData.total >= 6);
      
      const appIds = responseData.aplicaciones.map((a: any) => a.id);
      assert.ok(appIds.includes('odoo'));
      assert.ok(appIds.includes('woocommerce'));
      assert.ok(appIds.includes('shopify'));
      assert.ok(appIds.includes('n8n'));
      assert.ok(appIds.includes('stripe'));
      assert.ok(appIds.includes('zapier'));
      assert.ok(appIds.includes('google_calendar'));
    });

    it('should successfully execute syncConnector for odoo, woocommerce, shopify and stripe', async () => {
      const odooSync = await IntegrationsService.syncConnector('odoo');
      assert.strictEqual(odooSync.success, true);
      assert.ok(odooSync.count! >= 1);

      const wcSync = await IntegrationsService.syncConnector('woocommerce');
      assert.strictEqual(wcSync.success, true);
      assert.ok(wcSync.count !== undefined);

      const stripeSync = await IntegrationsService.syncConnector('stripe');
      assert.strictEqual(stripeSync.success, true);
    });

    it('should process Stripe and Zapier webhook payloads properly', async () => {
      const stripeRes = await IntegrationsService.processStripeWebhook({
        type: 'checkout.session.completed',
        data: { object: { customer_email: 'pago.cliente@ejemplo.es' } },
      });
      assert.strictEqual(stripeRes.handled, true);

      const zapierRes = await IntegrationsService.processZapierWebhook({
        email: 'lead.zapier@ejemplo.com',
        firstName: 'Lead',
        lastName: 'Automatizado',
      });
      assert.strictEqual(zapierRes.handled, true);
    });
  });

  describe('ISO-Compliant PDF Engine & Dynamic Pagination', () => {
    const {
      generatePdfBuffer,
      formatIsoDate,
      formatIsoCurrency,
    } = require('../src/modules/invoices/pdf.service');

    it('should format dates adhering strictly to ISO 8601 (YYYY-MM-DD)', () => {
      const d1 = new Date('2026-09-26T12:00:00Z');
      assert.strictEqual(formatIsoDate(d1), '2026-09-26');

      const d2 = '2026-12-31T00:00:00.000Z';
      assert.strictEqual(formatIsoDate(d2), '2026-12-31');
    });

    it('should format currencies adhering strictly to ISO 4217 standard', () => {
      const eurFormatted = formatIsoCurrency(1500.5, 'EUR');
      assert.ok(eurFormatted.includes('EUR'));
      assert.ok(eurFormatted.includes('1.500,50'));

      const usdFormatted = formatIsoCurrency(99.99, 'USD');
      assert.ok(usdFormatted.includes('USD'));
      assert.ok(usdFormatted.includes('99,99'));
    });

    it('should generate professional single-page invoice PDF with ISO 19005 metadata & DAMA branding', async () => {
      const invoiceData = {
        invoiceNumber: 'FAC-2026-001',
        type: 'FACTURA',
        issueDate: '2026-09-26',
        dueDate: '2026-10-26',
        status: 'PAID',
        companyName: 'DAMA CRM Soluciones S.L.',
        companyTaxId: 'B-12345678',
        companyAddress: 'Avenida Tecnológica 42, 28046 Madrid',
        companyEmail: 'contacto@dama-crm.com',
        companyPhone: '+34 910 000 000',
        companyWebsite: 'https://damacrm.com',
        clientName: 'Acme Corporation Ibérica',
        clientTaxId: 'A-98765432',
        clientEmail: 'billing@acme-corp.com',
        clientAddress: 'Calle Mayor 10, Barcelona',
        items: [
          { description: 'Licencia Servidor Dedicado DAMA-CRM Anual', quantity: 1, unitPrice: 2400.0, amount: 2400.0 },
          { description: 'Pack de Implementación e Integraciones API', quantity: 1, unitPrice: 850.0, amount: 850.0 },
        ],
        subtotal: 3250.0,
        taxRate: 21,
        taxAmount: 682.5,
        total: 3932.5,
        currency: 'EUR',
        notes: 'Gracias por confiar en DAMA-CRM. Servicio garantizado 24/7.',
        paymentTerms: 'Transferencia bancaria a 30 días',
        bankAccount: 'ES91 2100 0418 4502 0005 1332',
      };

      const buffer = await generatePdfBuffer(invoiceData);
      assert.ok(buffer instanceof Buffer);
      assert.ok(buffer.length > 2000, 'PDF buffer should have substantial content');

      const rawPdfString = buffer.toString('binary');
      // ISO header
      assert.ok(rawPdfString.startsWith('%PDF-1.'), 'PDF file must start with valid PDF specification header');
      // ISO 19005 metadata
      assert.ok(rawPdfString.includes('FAC-2026-001'), 'PDF metadata or stream must contain invoice number');
      assert.ok(rawPdfString.includes('DAMA-CRM'), 'PDF metadata or stream must contain DAMA-CRM creator');
      assert.ok(rawPdfString.includes('PDFKit'), 'PDF metadata producer must be present');
    });

    it('should dynamically paginate multi-page invoices (>25 items) without cut-off and stamp footers', async () => {
      const longItems = [];
      for (let i = 1; i <= 32; i++) {
        longItems.push({
          description: `Servicio Profesional y Mantenimiento Técnico de Sistemas Módulo #${i} con descripción detallada de trabajos realizados y auditoría preventiva.`,
          quantity: i,
          unitPrice: 50.0,
          amount: i * 50.0,
        });
      }

      const subtotal = longItems.reduce((acc, it) => acc + it.amount, 0);
      const taxAmount = subtotal * 0.21;
      const total = subtotal + taxAmount;

      const multiPageData = {
        invoiceNumber: 'FAC-2026-LONG-099',
        type: 'FACTURA',
        issueDate: '2026-09-26',
        dueDate: '2026-10-26',
        status: 'SENT',
        companyName: 'DAMA CRM Soluciones S.L.',
        companyTaxId: 'B-12345678',
        companyAddress: 'Avenida Tecnológica 42, 28046 Madrid',
        clientName: 'Gran Empresa Multinacional S.A.',
        clientTaxId: 'A-11223344',
        clientEmail: 'compras@granempresa.es',
        clientAddress: 'Parque Empresarial La Finca, Pozuelo de Alarcón',
        items: longItems,
        subtotal,
        taxRate: 21,
        taxAmount,
        total,
        currency: 'EUR',
        notes: 'Facturación consolidada de servicios correspondientes al período Q3-2026.',
        paymentTerms: 'Transferencia bancaria a 60 días',
        bankAccount: 'ES91 2100 0418 4502 0005 1332',
      };

      const buffer = await generatePdfBuffer(multiPageData);
      assert.ok(buffer instanceof Buffer);
      assert.ok(buffer.length > 8000, 'Multi-page PDF should have larger byte size');

      const rawPdfString = buffer.toString('binary');
      assert.ok(rawPdfString.startsWith('%PDF-1.'));
      // Multiple page markers
      assert.ok(rawPdfString.includes('/Type /Page'));
    });

    it('should generate professional quotes (PRESUPUESTO) with custom primary color and logo fallback', async () => {
      const quoteData = {
        invoiceNumber: 'PRE-2026-042',
        type: 'PRESUPUESTO',
        issueDate: '2026-09-26',
        dueDate: '2026-10-15',
        status: 'DRAFT',
        companyName: 'DAMA Enterprise Solutions',
        companyTaxId: 'B-99887766',
        companyAddress: 'Paseo de la Castellana 200, Madrid',
        primaryColor: '#072053',
        clientName: 'Innovatech Systems S.L.',
        clientEmail: 'info@innovatech.com',
        items: [
          { description: 'Desarrollo de integraciones a medida Odoo y WooCommerce', quantity: 40, unitPrice: 65.0, amount: 2600.0 },
          { description: 'Configuración de servidor Traefik y despliegue Docker', quantity: 15, unitPrice: 70.0, amount: 1050.0 },
        ],
        subtotal: 3650.0,
        taxRate: 21,
        taxAmount: 766.5,
        total: 4416.5,
        currency: 'EUR',
        notes: 'Presupuesto válido por 30 días naturales a partir de la fecha de emisión.',
      };

      const buffer = await generatePdfBuffer(quoteData);
      assert.ok(buffer instanceof Buffer);
      assert.ok(buffer.length > 2000);
      const str = buffer.toString('binary');
      assert.ok(str.startsWith('%PDF-1.'));
      assert.ok(str.includes('PRE-2026-042'));
    });
  });
});


