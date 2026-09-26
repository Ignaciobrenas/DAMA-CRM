import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { prisma } from '../../prisma';
import { logAudit } from '../../middlewares/audit.middleware';

export async function listUsers(req: Request, res: Response): Promise<void> {
  try {
    const users = await prisma.user.findMany({
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
    const currentUser = (req as any).user;
    const isSuperAdmin =
      currentUser?.role === 'ADMIN' &&
      (currentUser?.email === 'ignaciobrenas@gmail.com' ||
        currentUser?.email === 'admin@dama-crm.local' ||
        currentUser?.tenantId === 'master');

    const { email, password, name, roleId, tenantId: targetTenantId } = req.body;

    if (!email || !password || !name || !roleId) {
      res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
      return;
    }

    const assignedTenantId = isSuperAdmin
      ? targetTenantId || currentUser?.tenantId || 'master'
      : currentUser?.tenantId || 'master';

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
        name,
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
    const { name, email, roleId, password, isActive, customPermissions } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, preferences: true },
    });
    if (!existingUser) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

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
      (req as any).user?.id || null,
      'UPDATE',
      'User',
      id,
      { name: updated.name, email: updated.email, role: updated.role.name },
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
    const currentUserId = (req as any).user?.id;

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

    await prisma.user.delete({ where: { id } });
    await logAudit(currentUserId || null, 'DELETE', 'User', id, { email: user.email }, req.ip);

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
    const { permissions } = req.body; // Array of { resource: string, action: string }

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

    await logAudit((req as any).user?.id || null, 'UPDATE_PERMISSIONS', 'Role', roleId, { count: permissions.length }, req.ip);

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
    const logs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
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
};

export async function getUserPreferences(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
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
    const userId = (req as any).user?.id;
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
    const userId = (req as any).user?.id;
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


