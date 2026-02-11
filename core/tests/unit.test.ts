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
});
