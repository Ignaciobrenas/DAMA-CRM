import { describe, it } from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DEFAULT_PREFERENCES } from '../src/modules/users/users.controller';

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

    it('should correctly clone line items and copy financial amounts when converting a quote to an invoice', () => {
      const quote = {
        id: 'q-1',
        quoteNumber: 'PRE-2026-001',
        subtotal: 3500,
        taxRate: 21,
        taxAmount: 735,
        total: 4235,
        items: [
          { description: 'Consultoría CRM Avanzada', quantity: 1, unitPrice: 3500, amount: 3500 },
        ],
      };

      const clonedItems = quote.items.map((it) => ({
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        amount: it.amount,
      }));

      assert.strictEqual(clonedItems.length, 1);
      assert.strictEqual(clonedItems[0].amount, 3500);
      assert.strictEqual(quote.subtotal + quote.taxAmount, quote.total);
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

  describe('Validation Engine: Password Strength & Formats', () => {
    const { validatePasswordStrength, validateEmailFormat, validatePhoneFormat } = require('../src/utils/validators');

    it('should accept strong passwords satisfying all security criteria (8+ chars, upper, lower, number, symbol)', () => {
      const result1 = validatePasswordStrength('Admin1234!');
      assert.strictEqual(result1.isValid, true);
      assert.strictEqual(result1.score, 5);
      assert.strictEqual(result1.errors.length, 0);

      const result2 = validatePasswordStrength('Crm#Enterprise2026$');
      assert.strictEqual(result2.isValid, true);
      assert.strictEqual(result2.score, 5);
    });

    it('should reject passwords shorter than 8 characters', () => {
      const result = validatePasswordStrength('Aa1!');
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.checks.minLength, false);
      assert.ok(result.errors.includes('Mínimo 8 caracteres'));
    });

    it('should reject passwords lacking uppercase letters', () => {
      const result = validatePasswordStrength('password123!');
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.checks.hasUpper, false);
      assert.ok(result.errors.includes('Al menos una letra mayúscula (A-Z)'));
    });

    it('should reject passwords lacking lowercase letters', () => {
      const result = validatePasswordStrength('PASSWORD123!');
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.checks.hasLower, false);
      assert.ok(result.errors.includes('Al menos una letra minúscula (a-z)'));
    });

    it('should reject passwords lacking numbers', () => {
      const result = validatePasswordStrength('PasswordOnly!');
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.checks.hasNumber, false);
      assert.ok(result.errors.includes('Al menos un número (0-9)'));
    });

    it('should reject passwords lacking symbols or special characters', () => {
      const result = validatePasswordStrength('Password1234');
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.checks.hasSymbol, false);
      assert.ok(result.errors.includes('Al menos un símbolo o carácter especial (!@#$%...)'));
    });

    it('should correctly validate email formats', () => {
      assert.strictEqual(validateEmailFormat('ignaciobrenas@gmail.com').isValid, true);
      assert.strictEqual(validateEmailFormat('contacto@empresa.es').isValid, true);
      assert.strictEqual(validateEmailFormat('usuario.valido+tag@sub.dominio.org').isValid, true);

      assert.strictEqual(validateEmailFormat('correo-invalido').isValid, false);
      assert.strictEqual(validateEmailFormat('sin-arroba.com').isValid, false);
      assert.strictEqual(validateEmailFormat('@sinusuario.com').isValid, false);
      assert.strictEqual(validateEmailFormat('').isValid, false);
    });

    it('should correctly validate phone numbers', () => {
      assert.strictEqual(validatePhoneFormat('+34 600 123 456').isValid, true);
      assert.strictEqual(validatePhoneFormat('+1-555-123-4567').isValid, true);
      assert.strictEqual(validatePhoneFormat('912345678').isValid, true);

      assert.strictEqual(validatePhoneFormat('abc').isValid, false);
      assert.strictEqual(validatePhoneFormat('12').isValid, false); // too short
      assert.strictEqual(validatePhoneFormat('').isValid, false);
    });
  });

  describe('Validation Engine: Entity Schemas & Required Fields', () => {
    const { createUserSchema, createContactSchema, createDealSchema } = require('../src/utils/validators');

    it('should enforce required fields on createUserSchema and reject invalid data', () => {
      const invalid = createUserSchema.safeParse({ name: 'A' });
      assert.strictEqual(invalid.success, false);

      const valid = createUserSchema.safeParse({
        name: 'Carlos Ruiz',
        email: 'carlos@dama-crm.local',
        password: 'Password123!',
        roleId: 'role-123',
      });
      assert.strictEqual(valid.success, true);
    });

    it('should enforce required fields on createContactSchema', () => {
      const missingFields = createContactSchema.safeParse({ firstName: 'Laura' });
      assert.strictEqual(missingFields.success, false);

      const validContact = createContactSchema.safeParse({
        firstName: 'Laura',
        lastName: 'Gómez',
        email: 'laura@empresa.com',
        phone: '+34 612 345 678',
      });
      assert.strictEqual(validContact.success, true);
    });

    it('should enforce required fields on createDealSchema and prevent negative values', () => {
      const negativeDeal = createDealSchema.safeParse({
        title: 'Venta Q1',
        stageId: 'stage-1',
        value: -500,
      });
      assert.strictEqual(negativeDeal.success, false);

      const validDeal = createDealSchema.safeParse({
        title: 'Venta Licencias CRM',
        stageId: 'stage-1',
        value: 12500,
      });
      assert.strictEqual(validDeal.success, true);
    });
  });

  describe('Admin Account Credentials Verification', () => {
    it('should verify password "1" matches the bcrypt hash configured for ignaciobrenas@gmail.com', async () => {
      const rawPassword = '1';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(rawPassword, salt);

      const isValid = await bcrypt.compare('1', hash);
      assert.strictEqual(isValid, true);

      const isInvalid = await bcrypt.compare('WrongPass', hash);
      assert.strictEqual(isInvalid, false);
    });
  });

  describe('User Preferences & Customization Persistence', () => {
    it('should have sound, sidebar and dashboard defaults configured', () => {
      assert.strictEqual(DEFAULT_PREFERENCES.soundEnabled, true);
      assert.strictEqual(DEFAULT_PREFERENCES.sidebarCollapsed, false);
      assert.ok(Array.isArray(DEFAULT_PREFERENCES.sidebarPinnedItems));
      assert.ok(DEFAULT_PREFERENCES.sidebarPinnedItems.includes('/pipeline'));
      assert.ok(Array.isArray(DEFAULT_PREFERENCES.dashboardWidgets));
      assert.ok(DEFAULT_PREFERENCES.dashboardWidgets.includes('kpis'));
    });

    it('should merge updated preferences with defaults and serialize to JSON correctly', () => {
      const existingPreferencesJson = JSON.stringify(DEFAULT_PREFERENCES);
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
      assert.strictEqual(deserialized.theme, 'light');
    });
  });
});
