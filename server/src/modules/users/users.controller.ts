import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { prisma } from '../../prisma';
import { logAudit } from '../../middlewares/audit.middleware';
import { getRequestTenant, isGodSuperAdmin } from '../../utils/tenant';

export async function listUsers(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const where: any = {};
    if (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) {
      where.tenantId = tenantId;
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const safeUsers = users.map((u) => {
      let customPermissions: any[] = [];
      try {
        const p = JSON.parse(u.preferences || '{}');
        if (Array.isArray(p.customPermissions)) customPermissions = p.customPermissions;
      } catch {}

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        avatar: u.avatar,
        isActive: u.isActive,
        twoFactorEnabled: u.twoFactorEnabled,
        role: u.role.name,
        roleId: u.roleId,
        tenantId: u.tenantId,
        customPermissions,
        rolePermissions: u.role.permissions.map((p) => ({ resource: p.resource, action: p.action })),
        createdAt: u.createdAt,
      };
    });

    res.json({ success: true, data: safeUsers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createUser(req: Request, res: Response): Promise<void> {
  try {
    const currentUser = req.user;
    const isSuper = isGodSuperAdmin(req);
    const effectiveTenant = getRequestTenant(req);

    const { email, password, name, roleId, tenantId: targetTenantId } = req.body;

    if (!email || !password || !name || !roleId) {
      res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
      return;
    }

    const assignedTenantId = isSuper
      ? targetTenantId || effectiveTenant || 'master'
      : effectiveTenant;

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      res.status(400).json({ success: false, message: 'El correo electrónico ya está registrado' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        name: name.trim(),
        roleId,
        tenantId: assignedTenantId,
        isActive: true,
      },
      include: { role: true },
    });

    await logAudit(currentUser?.id || null, 'CREATE', 'User', user.id, { email: user.email, tenantId: assignedTenantId }, req.ip);

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        tenantId: user.tenantId,
        isActive: user.isActive,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, preferences: true, tenantId: true },
    });
    if (!existingUser) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    if (!isSuper && existingUser.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permisos para modificar usuarios de otra organización' });
      return;
    }

    const { name, email, roleId, password, isActive, customPermissions } = req.body;

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name.trim();
    if (email) dataToUpdate.email = email.toLowerCase().trim();
    if (roleId) dataToUpdate.roleId = roleId;
    if (typeof isActive === 'boolean') dataToUpdate.isActive = isActive;
    if (password && password.trim()) {
      dataToUpdate.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    // Merge or update customPermissions inside preferences JSON
    if (customPermissions !== undefined) {
      let currentPrefs: any = {};
      try {
        currentPrefs = JSON.parse(existingUser.preferences || '{}');
      } catch {}
      currentPrefs.customPermissions = Array.isArray(customPermissions) ? customPermissions : [];
      dataToUpdate.preferences = JSON.stringify(currentPrefs);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    await logAudit(
      req.user?.id || null,
      'UPDATE',
      'User',
      id,
      { name: updated.name, email: updated.email, role: updated.role.name, tenantId },
      req.ip
    );

    let parsedCustomPermissions: any[] = [];
    try {
      const p = JSON.parse(updated.preferences || '{}');
      if (Array.isArray(p.customPermissions)) {
        parsedCustomPermissions = p.customPermissions;
      }
    } catch {}

    res.json({
      success: true,
      message: `Usuario ${updated.name} actualizado con éxito`,
      data: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        avatar: updated.avatar,
        isActive: updated.isActive,
        twoFactorEnabled: updated.twoFactorEnabled,
        role: updated.role.name,
        roleId: updated.roleId,
        tenantId: updated.tenantId,
        customPermissions: parsedCustomPermissions,
        rolePermissions: updated.role.permissions.map((p) => ({ resource: p.resource, action: p.action })),
        createdAt: updated.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    if (id === currentUserId) {
      res.status(400).json({
        success: false,
        message: 'Por seguridad, no puedes eliminar tu propia cuenta en sesión activa.',
      });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    if (!isSuper && user.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes permisos para eliminar este usuario' });
      return;
    }

    await prisma.user.delete({ where: { id } });
    await logAudit(currentUserId || null, 'DELETE', 'User', id, { email: user.email, tenantId }, req.ip);

    res.json({ success: true, message: `Usuario ${user.name} eliminado correctamente` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function listRoles(req: Request, res: Response): Promise<void> {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: true,
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: roles });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateRolePermissions(req: Request, res: Response): Promise<void> {
  try {
    const { roleId } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      res.status(400).json({ success: false, message: 'Formato de permisos inválido' });
      return;
    }

    // Delete existing permissions for role
    await prisma.permission.deleteMany({ where: { roleId } });

    // Insert new permissions
    for (const p of permissions) {
      await prisma.permission.create({
        data: {
          roleId,
          resource: p.resource,
          action: p.action,
        },
      });
    }

    await logAudit(req.user?.id || null, 'UPDATE_PERMISSIONS', 'Role', roleId, { count: permissions.length }, req.ip);

    const updatedRole = await prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: true },
    });

    res.json({ success: true, data: updatedRole, message: 'Matriz de permisos actualizada correctamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function listAuditLogs(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const where: any = {};
    if (!isSuper || req.query.tenantId || req.headers['x-switch-tenant-id'] || req.headers['x-tenant-id']) {
      where.tenantId = tenantId;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export const DEFAULT_PREFERENCES = {
  soundEnabled: true,
  sidebarCollapsed: false,
  sidebarPinnedItems: [
    '/',
    '/pipeline',
    '/agile',
    '/contacts',
    '/companies',
    '/invoicing',
    '/inventory',
    '/workflows',
    '/omnichannel',
    '/reports',
  ],
  dashboardWidgets: ['kpis', 'pipeline_chart', 'recent_activities', 'top_deals', 'quick_actions'],
  theme: 'light',
  language: 'es',
  emailNotifications: true,
  compactMode: false,
  fontSize: 'md',
  uiScale: 1.0,
  iconStyle: 'animated',
  timezone: 'Europe/Madrid',
  dateFormat: 'DD/MM/YYYY',
};

export async function getUserPreferences(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    let prefs = DEFAULT_PREFERENCES;
    if (user?.preferences) {
      try {
        prefs = { ...DEFAULT_PREFERENCES, ...JSON.parse(user.preferences) };
      } catch {
        prefs = DEFAULT_PREFERENCES;
      }
    }

    res.json({ success: true, data: prefs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateUserPreferences(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    let currentPrefs = DEFAULT_PREFERENCES;
    if (user?.preferences) {
      try {
        currentPrefs = { ...DEFAULT_PREFERENCES, ...JSON.parse(user.preferences) };
      } catch {
        currentPrefs = DEFAULT_PREFERENCES;
      }
    }

    const mergedPrefs = { ...currentPrefs, ...req.body };

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: JSON.stringify(mergedPrefs),
      },
      select: { preferences: true },
    });

    await logAudit(userId, 'UPDATE_PREFERENCES', 'User', userId, mergedPrefs, req.ip);

    res.json({
      success: true,
      message: 'Preferencias guardadas correctamente en la base de datos',
      data: JSON.parse(updatedUser.preferences || '{}'),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    const { name, avatar } = req.body;
    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name.trim();
    if (avatar !== undefined) dataToUpdate.avatar = avatar;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        preferences: true,
      },
    });

    await logAudit(userId, 'UPDATE_PROFILE', 'User', userId, dataToUpdate, req.ip);

    res.json({
      success: true,
      message: 'Perfil de usuario actualizado con éxito',
      data: {
        ...updated,
        preferences: updated.preferences ? JSON.parse(updated.preferences) : DEFAULT_PREFERENCES,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getUserAuditTrail(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = getRequestTenant(req);
    const isSuper = isGodSuperAdmin(req);

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: { permissions: true },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    if (!isSuper && user.tenantId !== tenantId) {
      res.status(403).json({ success: false, message: 'No tienes acceso a los registros de este usuario' });
      return;
    }

    const [logins, changes] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          userId: id,
          action: { in: ['LOGIN', 'LOGIN_GOOGLE', '2FA_VERIFIED', '2FA_ENABLED', '2FA_DISABLED'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.auditLog.findMany({
        where: {
          userId: id,
          action: { notIn: ['LOGIN', 'LOGIN_GOOGLE', '2FA_VERIFIED', '2FA_ENABLED', '2FA_DISABLED'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    let customPermissions: any[] = [];
    try {
      const p = JSON.parse(user.preferences || '{}');
      if (Array.isArray(p.customPermissions)) customPermissions = p.customPermissions;
    } catch {}

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role.name,
          rolePermissions: user.role.permissions.map((p) => ({ resource: p.resource, action: p.action })),
          customPermissions,
          twoFactorEnabled: user.twoFactorEnabled,
          isActive: user.isActive,
          tenantId: user.tenantId,
          createdAt: user.createdAt,
        },
        logins,
        changes,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
