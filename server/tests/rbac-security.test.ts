import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('DAMA-CRM RBAC & Permission Security Test Suite', () => {
  // Mock permission checker logic matching server rbac.middleware.ts
  interface MockUser {
    id: string;
    email: string;
    role: string;
    tenantId: string;
    isActive: boolean;
    rolePermissions?: Array<{ resource: string; action: string }>;
    customPermissions?: Array<{ resource: string; action: string }>;
  }

  function checkPermission(user: MockUser | undefined, resource: string, action: string): { allowed: boolean; status: number; message: string } {
    if (!user) {
      return { allowed: false, status: 401, message: 'No autenticado: se requiere sesión activa' };
    }
    if (!user.isActive) {
      return { allowed: false, status: 403, message: 'Cuenta desactivada: acceso revocado' };
    }
    if (user.role === 'ADMIN' || user.role === 'GOD' || user.email === 'ignaciobrenas@gmail.com') {
      return { allowed: true, status: 200, message: 'Acceso total de administrador concedido' };
    }

    const hasCustom = user.customPermissions?.some(
      (p) => (p.resource === resource || p.resource === '*') && (p.action === action || p.action === 'manage')
    );
    if (hasCustom) {
      return { allowed: true, status: 200, message: 'Permiso personalizado concedido' };
    }

    const hasRolePerm = user.rolePermissions?.some(
      (p) => (p.resource === resource || p.resource === '*') && (p.action === action || p.action === 'manage')
    );
    if (hasRolePerm) {
      return { allowed: true, status: 200, message: 'Permiso de rol concedido' };
    }

    return { allowed: false, status: 403, message: `Acceso denegado: se requiere permiso ${resource}:${action}` };
  }

  describe('1. Deny-by-Default and Authentication Checks', () => {
    it('should strictly return 401 if request has no authenticated user session', () => {
      const result = checkPermission(undefined, 'deals', 'read');
      assert.strictEqual(result.allowed, false);
      assert.strictEqual(result.status, 401);
    });

    it('should strictly return 403 and immediately block deactivated users even with valid tokens', () => {
      const inactiveUser: MockUser = {
        id: 'usr_inactive_1',
        email: 'fired@company.com',
        role: 'SALES',
        tenantId: 'acme',
        isActive: false,
        rolePermissions: [{ resource: 'deals', action: 'read' }],
      };
      const result = checkPermission(inactiveUser, 'deals', 'read');
      assert.strictEqual(result.allowed, false);
      assert.strictEqual(result.status, 403);
    });

    it('should return 403 when user attempts an unassigned action on an authorized resource', () => {
      const viewerUser: MockUser = {
        id: 'usr_viewer_1',
        email: 'viewer@company.com',
        role: 'VIEWER',
        tenantId: 'acme',
        isActive: true,
        rolePermissions: [{ resource: 'companies', action: 'read' }],
      };
      // Can read
      assert.strictEqual(checkPermission(viewerUser, 'companies', 'read').allowed, true);
      // Deny delete by default
      const deleteResult = checkPermission(viewerUser, 'companies', 'delete');
      assert.strictEqual(deleteResult.allowed, false);
      assert.strictEqual(deleteResult.status, 403);
    });

    it('should grant ADMIN full authorization bypass across all modules', () => {
      const adminUser: MockUser = {
        id: 'usr_admin_1',
        email: 'admin@acme.com',
        role: 'ADMIN',
        tenantId: 'acme',
        isActive: true,
      };
      assert.strictEqual(checkPermission(adminUser, 'users', 'manage').allowed, true);
      assert.strictEqual(checkPermission(adminUser, 'settings', 'update').allowed, true);
      assert.strictEqual(checkPermission(adminUser, 'expenses', 'delete').allowed, true);
      assert.strictEqual(checkPermission(adminUser, 'logistics', 'read').allowed, true);
    });
  });

  describe('2. Custom Permission Overrides (Exceptions per User)', () => {
    it('should grant access to specific resource when custom permission is added to standard user', () => {
      const techUser: MockUser = {
        id: 'usr_tech_1',
        email: 'tech@company.com',
        role: 'TECH',
        tenantId: 'acme',
        isActive: true,
        rolePermissions: [{ resource: 'projects', action: 'read' }],
        customPermissions: [{ resource: 'invoices', action: 'read' }], // Granted exception
      };
      // Normal role permission
      assert.strictEqual(checkPermission(techUser, 'projects', 'read').allowed, true);
      // Custom permission override
      assert.strictEqual(checkPermission(techUser, 'invoices', 'read').allowed, true);
      // Unassigned still blocked
      assert.strictEqual(checkPermission(techUser, 'invoices', 'delete').allowed, false);
    });
  });

  describe('3. Privilege Escalation Prevention Logic', () => {
    function validateUserUpdate(
      currentUser: MockUser,
      targetUser: { id: string; role: string; roleId: string; tenantId: string; isActive: boolean },
      payload: { roleId?: string; targetRoleName?: string; customPermissions?: any[]; isActive?: boolean },
      activeAdminsCountInTenant: number
    ): { valid: boolean; status: number; message: string } {
      const isSelf = currentUser.id === targetUser.id;

      // 1. Self modification checks
      if (isSelf) {
        if (payload.roleId && payload.roleId !== targetUser.roleId) {
          return { valid: false, status: 403, message: 'No puedes modificar tu propio rol por motivos de seguridad.' };
        }
        if (payload.customPermissions !== undefined) {
          return { valid: false, status: 403, message: 'No puedes modificar tus propios permisos personalizados.' };
        }
        if (payload.isActive === false) {
          return { valid: false, status: 400, message: 'No puedes desactivar tu propia cuenta en sesión activa.' };
        }
      }

      // 2. Non-admin cannot assign ADMIN role
      if (payload.targetRoleName === 'ADMIN' && currentUser.role !== 'ADMIN' && currentUser.role !== 'GOD') {
        return { valid: false, status: 403, message: 'Solo un administrador puede asignar el rol de Administrador.' };
      }

      // 3. Non-admin cannot modify an ADMIN user
      if (targetUser.role === 'ADMIN' && currentUser.role !== 'ADMIN' && currentUser.role !== 'GOD') {
        return { valid: false, status: 403, message: 'Solo un administrador puede modificar a otro administrador.' };
      }

      // 4. Last active admin protection
      const isDowngradingAdmin = targetUser.role === 'ADMIN' && payload.targetRoleName && payload.targetRoleName !== 'ADMIN';
      const isDeactivatingAdmin = targetUser.role === 'ADMIN' && payload.isActive === false;
      if ((isDowngradingAdmin || isDeactivatingAdmin) && activeAdminsCountInTenant <= 1) {
        return { valid: false, status: 400, message: 'Operación denegada: no puedes desactivar ni degradar al único administrador activo de la organización.' };
      }

      return { valid: true, status: 200, message: 'Actualización autorizada' };
    }

    it('should block a user from promoting themselves or changing their own role', () => {
      const salesUser: MockUser = { id: 'usr_sales_1', email: 'sales@co.com', role: 'SALES', tenantId: 'acme', isActive: true };
      const targetUser = { id: 'usr_sales_1', role: 'SALES', roleId: 'role_sales', tenantId: 'acme', isActive: true };

      const attempt = validateUserUpdate(salesUser, targetUser, { roleId: 'role_admin', targetRoleName: 'ADMIN' }, 2);
      assert.strictEqual(attempt.valid, false);
      assert.strictEqual(attempt.status, 403);
      assert.match(attempt.message, /No puedes modificar tu propio rol/);
    });

    it('should block a user from granting themselves arbitrary customPermissions', () => {
      const employeeUser: MockUser = { id: 'usr_emp_1', email: 'emp@co.com', role: 'EMPLOYEE', tenantId: 'acme', isActive: true };
      const targetUser = { id: 'usr_emp_1', role: 'EMPLOYEE', roleId: 'role_emp', tenantId: 'acme', isActive: true };

      const attempt = validateUserUpdate(employeeUser, targetUser, { customPermissions: [{ resource: 'users', action: 'manage' }] }, 2);
      assert.strictEqual(attempt.valid, false);
      assert.strictEqual(attempt.status, 403);
      assert.match(attempt.message, /No puedes modificar tus propios permisos personalizados/);
    });

    it('should prevent an admin from deactivating their own active account', () => {
      const adminUser: MockUser = { id: 'usr_admin_1', email: 'admin@co.com', role: 'ADMIN', tenantId: 'acme', isActive: true };
      const targetUser = { id: 'usr_admin_1', role: 'ADMIN', roleId: 'role_admin', tenantId: 'acme', isActive: true };

      const attempt = validateUserUpdate(adminUser, targetUser, { isActive: false }, 3);
      assert.strictEqual(attempt.valid, false);
      assert.strictEqual(attempt.status, 400);
      assert.match(attempt.message, /No puedes desactivar tu propia cuenta/);
    });

    it('should prevent non-admin from modifying an existing ADMIN user', () => {
      const hrUser: MockUser = { id: 'usr_hr_1', email: 'hr@co.com', role: 'HR', tenantId: 'acme', isActive: true };
      const targetAdmin = { id: 'usr_admin_2', role: 'ADMIN', roleId: 'role_admin', tenantId: 'acme', isActive: true };

      const attempt = validateUserUpdate(hrUser, targetAdmin, { isActive: false }, 2);
      assert.strictEqual(attempt.valid, false);
      assert.strictEqual(attempt.status, 403);
      assert.match(attempt.message, /Solo un administrador puede modificar a otro administrador/);
    });

    it('should block deactivating or downgrading the last remaining active ADMIN in the organization', () => {
      const admin1: MockUser = { id: 'usr_admin_1', email: 'admin1@co.com', role: 'ADMIN', tenantId: 'acme', isActive: true };
      const targetAdmin2 = { id: 'usr_admin_2', role: 'ADMIN', roleId: 'role_admin', tenantId: 'acme', isActive: true };

      // Case: only 1 active admin exists in this tenant
      const attempt = validateUserUpdate(admin1, targetAdmin2, { targetRoleName: 'VIEWER' }, 1);
      assert.strictEqual(attempt.valid, false);
      assert.strictEqual(attempt.status, 400);
      assert.match(attempt.message, /no puedes desactivar ni degradar al único administrador activo/);
    });
  });

  describe('4. Tenant Data Isolation & IDOR Guards', () => {
    function enforceTenantAccess(userTenant: string, resourceTenant: string, isGod: boolean): boolean {
      if (isGod) return true;
      return userTenant === resourceTenant;
    }

    it('should prevent cross-tenant access between different organizations', () => {
      const acmeUser: MockUser = { id: 'u1', email: 'user@acme.com', role: 'ADMIN', tenantId: 'acme', isActive: true };
      const resourceOfInnova = { id: 'inv_123', tenantId: 'innovatech' };

      const hasAccess = enforceTenantAccess(acmeUser.tenantId, resourceOfInnova.tenantId, false);
      assert.strictEqual(hasAccess, false);
    });

    it('should allow superadmin (GOD) multi-tenant cross-organization governance', () => {
      const godUser: MockUser = { id: 'u_god', email: 'ignaciobrenas@gmail.com', role: 'ADMIN', tenantId: 'master', isActive: true };
      const acmeResource = { id: 'rec_456', tenantId: 'acme' };

      const hasAccess = enforceTenantAccess(godUser.tenantId, acmeResource.tenantId, true);
      assert.strictEqual(hasAccess, true);
    });
  });

  describe('5. External CLIENT Privacy & Ticket Isolation', () => {
    function sanitizeTicketForUser(ticket: any, requester: MockUser): any {
      if (requester.role === 'CLIENT') {
        // Must match email
        if (ticket.customerEmail?.toLowerCase() !== requester.email.toLowerCase()) {
          return null; // IDOR blocked
        }
        // Filter out internal confidential notes
        const safeMessages = ticket.messages?.filter((m: any) => !m.isInternal) || [];
        return { ...ticket, messages: safeMessages };
      }
      return ticket;
    }

    it('should hide confidential internal staff messages from external CLIENT users', () => {
      const clientUser: MockUser = { id: 'u_cli', email: 'client@external.com', role: 'CLIENT', tenantId: 'acme', isActive: true };
      const mockTicket = {
        id: 'tick_101',
        customerEmail: 'client@external.com',
        title: 'Issue with payment gateway',
        messages: [
          { id: 'm1', content: 'Customer report: card failed', isInternal: false },
          { id: 'm2', content: 'CONFIDENTIAL: Staff note - check Stripe webhook status', isInternal: true },
        ],
      };

      const sanitized = sanitizeTicketForUser(mockTicket, clientUser);
      assert.notStrictEqual(sanitized, null);
      assert.strictEqual(sanitized.messages.length, 1);
      assert.strictEqual(sanitized.messages[0].isInternal, false);
      assert.strictEqual(sanitized.messages.some((m: any) => m.isInternal), false);
    });

    it('should completely block CLIENT from viewing tickets belonging to a different customer', () => {
      const clientUser: MockUser = { id: 'u_cli_1', email: 'attacker@evil.com', role: 'CLIENT', tenantId: 'acme', isActive: true };
      const otherCustomerTicket = {
        id: 'tick_999',
        customerEmail: 'victim@company.com',
        title: 'Confidential billing inquiry',
      };

      const result = sanitizeTicketForUser(otherCustomerTicket, clientUser);
      assert.strictEqual(result, null);
    });
  });

  describe('6. Role Management & Immutability Rules', () => {
    function validateRoleDeletion(role: { name: string; isSystem: boolean; userCount: number }): { canDelete: boolean; message: string } {
      if (role.isSystem) {
        return { canDelete: false, message: 'No se pueden eliminar roles de sistema.' };
      }
      if (role.userCount > 0) {
        return { canDelete: false, message: 'No se puede eliminar el rol porque tiene usuarios asignados.' };
      }
      return { canDelete: true, message: 'Rol eliminado correctamente.' };
    }

    it('should protect built-in system roles (ADMIN, CLIENT) from being deleted', () => {
      const adminRole = { name: 'ADMIN', isSystem: true, userCount: 0 };
      const check = validateRoleDeletion(adminRole);
      assert.strictEqual(check.canDelete, false);
      assert.match(check.message, /No se pueden eliminar roles de sistema/);
    });

    it('should block deletion of custom roles if they have active users assigned', () => {
      const customRole = { name: 'CUSTOM_LEAD', isSystem: false, userCount: 4 };
      const check = validateRoleDeletion(customRole);
      assert.strictEqual(check.canDelete, false);
      assert.match(check.message, /tiene usuarios asignados/);
    });

    it('should allow deletion of unused custom roles', () => {
      const unusedRole = { name: 'OBSOLETE_ROLE', isSystem: false, userCount: 0 };
      const check = validateRoleDeletion(unusedRole);
      assert.strictEqual(check.canDelete, true);
    });
  });

  describe('7. Confidential Salary & IBAN Privacy Masking', () => {
    function sanitizeEmployeeView(employee: any, requester: MockUser): any {
      const isHrOrAdmin = requester.role === 'ADMIN' || requester.role === 'HR' || requester.role === 'GOD';
      const isSelf = employee.userId === requester.id;

      if (!isHrOrAdmin && !isSelf) {
        return {
          ...employee,
          baseSalary: 0,
          iban: employee.iban ? '••••••••••••' : null,
        };
      }
      return employee;
    }

    it('should mask salary and IBAN of other coworkers for a standard employee', () => {
      const employeeUser: MockUser = { id: 'usr_emp_1', email: 'emp1@co.com', role: 'EMPLOYEE', tenantId: 'acme', isActive: true };
      const coworkerRecord = {
        id: 'emp_2',
        userId: 'usr_emp_2',
        firstName: 'Carlos',
        baseSalary: 45000,
        iban: 'ES9121000418450200051332',
      };

      const sanitized = sanitizeEmployeeView(coworkerRecord, employeeUser);
      assert.strictEqual(sanitized.baseSalary, 0);
      assert.strictEqual(sanitized.iban, '••••••••••••');
    });

    it('should reveal full salary and IBAN to HR and Admin roles', () => {
      const hrUser: MockUser = { id: 'usr_hr_1', email: 'hr@co.com', role: 'HR', tenantId: 'acme', isActive: true };
      const employeeRecord = {
        id: 'emp_2',
        userId: 'usr_emp_2',
        firstName: 'Carlos',
        baseSalary: 45000,
        iban: 'ES9121000418450200051332',
      };

      const view = sanitizeEmployeeView(employeeRecord, hrUser);
      assert.strictEqual(view.baseSalary, 45000);
      assert.strictEqual(view.iban, 'ES9121000418450200051332');
    });
  });
});
