import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../prisma';
import { generateToken } from '../../utils/jwt';
import { logAudit } from '../../middlewares/audit.middleware';
import { isGodSuperAdmin } from '../../utils/tenant';

const RESERVED_SLUGS = ['master', 'admin', 'api', 'system', 'god', 'godmode', 'auth', 'public', 'static'];

export async function createInvitation(req: Request, res: Response): Promise<void> {
  try {
    const isSuper = isGodSuperAdmin(req);
    if (!isSuper && req.user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Solo los administradores pueden generar invitaciones de alta' });
      return;
    }

    const { email, tenantSlug, companyName, role = 'ADMIN', expiresInDays = 7, metadata = {} } = req.body;

    if (!email || !String(email).includes('@')) {
      res.status(400).json({ success: false, message: 'Se requiere un correo electrónico válido' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (Number(expiresInDays) || 7));

    const invitation = await prisma.tenantInvitation.create({
      data: {
        token,
        email: email.trim().toLowerCase(),
        tenantSlug: tenantSlug ? String(tenantSlug).trim().toLowerCase().replace(/[^a-z0-9-]/g, '') : null,
        companyName: companyName ? String(companyName).trim() : null,
        role,
        expiresAt,
        metadata: JSON.stringify(metadata),
        createdById: req.user?.id || null,
      },
    });

    const origin = req.headers.origin || req.headers.host || 'http://localhost:5173';
    const baseUrl = origin.startsWith('http') ? origin : `http://${origin}`;
    const onboardingUrl = `${baseUrl}/onboarding?token=${token}`;

    await logAudit(req.user?.id || null, 'CREATE_INVITATION', 'TenantInvitation', invitation.id, { email, token, tenantSlug }, req.ip);

    res.status(201).json({
      success: true,
      data: {
        ...invitation,
        onboardingUrl,
      },
      message: 'Enlace de onboarding generado con éxito',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function verifyInvitationToken(req: Request, res: Response): Promise<void> {
  try {
    const token = String(req.query.token || '');
    if (!token) {
      res.status(400).json({ success: false, message: 'Token de invitación no proporcionado' });
      return;
    }

    const invitation = await prisma.tenantInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      res.status(404).json({ success: false, message: 'Enlace de invitación no válido o inexistente' });
      return;
    }

    if (invitation.status !== 'PENDING') {
      res.status(400).json({
        success: false,
        message: invitation.status === 'ACCEPTED' ? 'Esta invitación ya ha sido utilizada' : 'Esta invitación ha expirado',
      });
      return;
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.tenantInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      res.status(400).json({ success: false, message: 'La invitación ha expirado. Solicita un nuevo enlace.' });
      return;
    }

    let meta = {};
    try {
      meta = invitation.metadata ? JSON.parse(invitation.metadata) : {};
    } catch {}

    res.json({
      success: true,
      data: {
        token: invitation.token,
        email: invitation.email,
        tenantSlug: invitation.tenantSlug,
        companyName: invitation.companyName,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        metadata: meta,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function checkSlugAvailability(req: Request, res: Response): Promise<void> {
  try {
    const rawSlug = String(req.query.slug || '').trim().toLowerCase();
    const slug = rawSlug.replace(/[^a-z0-9-]/g, '');

    if (!slug || slug.length < 3) {
      res.json({
        success: true,
        available: false,
        message: 'El slug debe tener al menos 3 caracteres alfanuméricos',
      });
      return;
    }

    if (RESERVED_SLUGS.includes(slug)) {
      res.json({
        success: true,
        available: false,
        message: 'Este identificador es reservado del sistema',
      });
      return;
    }

    const existing = await prisma.tenant.findUnique({ where: { slug } });
    res.json({
      success: true,
      available: !existing,
      slug,
      message: existing ? 'El identificador ya está en uso por otra empresa' : 'Identificador disponible',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function completeOnboarding(req: Request, res: Response): Promise<void> {
  try {
    const {
      token,
      slug: rawSlug,
      company,
      branding,
      adminUser,
      invitedMembers = [],
    } = req.body;

    if (!token) {
      res.status(400).json({ success: false, message: 'Token de invitación requerido' });
      return;
    }

    const invitation = await prisma.tenantInvitation.findUnique({ where: { token } });
    if (!invitation || invitation.status !== 'PENDING' || new Date() > invitation.expiresAt) {
      res.status(400).json({ success: false, message: 'Invitación no válida o expirada' });
      return;
    }

    const slug = String(rawSlug || invitation.tenantSlug || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!slug || slug.length < 3 || RESERVED_SLUGS.includes(slug)) {
      res.status(400).json({ success: false, message: 'Identificador de empresa (slug) inválido o reservado' });
      return;
    }

    const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
    if (existingTenant) {
      res.status(400).json({ success: false, message: 'El identificador de empresa ya está registrado' });
      return;
    }

    if (!adminUser?.password || adminUser.password.length < 6) {
      res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    // Default admin role
    let adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } });
    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: { name: 'ADMIN', description: 'Administrador de Empresa' },
      });
    }

    let userRole = await prisma.role.findFirst({ where: { name: 'USER' } });
    if (!userRole) {
      userRole = await prisma.role.create({
        data: { name: 'USER', description: 'Usuario Estándar' },
      });
    }

    const passwordHash = await bcrypt.hash(adminUser.password, 10);
    const companyName = company?.name || invitation.companyName || slug.toUpperCase();

    const brandingData = {
      companyName,
      companyTaxId: company?.taxId || '',
      companyAddress: company?.address || '',
      companyPhone: company?.phone || '',
      companyEmail: company?.email || invitation.email,
      companyWebsite: company?.website || '',
      logoUrl: branding?.logoUrl || '',
      primaryColor: branding?.primaryColor || '#072053',
      secondaryColor: branding?.secondaryColor || '#2563EB',
    };

    const modulesSettings = {
      crm: true,
      sales: true,
      invoicing: true,
      inventory: true,
      agile: true,
      employees: true,
      reports: true,
      helpdesk: true,
      omnichannel: true,
    };

    // Transaction to provision tenant and company
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const newTenant = await tx.tenant.create({
        data: {
          slug,
          name: companyName,
          status: 'ACTIVE',
          plan: 'ENTERPRISE',
          maxUsers: 50,
          branding: JSON.stringify(brandingData),
          settings: JSON.stringify(modulesSettings),
        },
      });

      // 2. Create Company Record
      const newCompany = await tx.company.create({
        data: {
          name: companyName,
          taxId: company?.taxId || null,
          industry: company?.industry || 'Tecnología y Servicios',
          address: company?.address || null,
          city: company?.city || null,
          country: company?.country || 'España',
          phone: company?.phone || null,
          email: company?.email || invitation.email,
          website: company?.website || null,
          tenantId: slug,
        },
      });

      // 3. Create Admin User
      const user = await tx.user.upsert({
        where: { email: invitation.email },
        update: {
          name: adminUser.name || 'Admin',
          passwordHash,
          roleId: adminRole!.id,
          tenantId: slug,
          isActive: true,
        },
        create: {
          email: invitation.email,
          name: adminUser.name || 'Admin',
          passwordHash,
          roleId: adminRole!.id,
          tenantId: slug,
          isActive: true,
        },
        include: { role: true },
      });

      // 4. Create Employee Record for Admin
      const nameParts = (adminUser.name || 'Admin Empresa').split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || 'Principal';
      await tx.employee.upsert({
        where: { userId: user.id },
        update: { tenantId: slug },
        create: {
          userId: user.id,
          tenantId: slug,
          firstName,
          lastName,
          email: invitation.email,
          jobTitle: 'Director / Administrador',
          department: 'MANAGEMENT',
          contractType: 'INDEFINIDO',
        },
      });

      // 5. Create default initial pipeline stages for sales if none exist
      const defaultStages = [
        { name: 'Lead / Prospecto', order: 0, color: '#3B82F6', probability: 20 },
        { name: 'Contacto Cualificado', order: 1, color: '#8B5CF6', probability: 40 },
        { name: 'Presupuesto Enviado', order: 2, color: '#F59E0B', probability: 70 },
        { name: 'Negociación / Cierre', order: 3, color: '#10B981', probability: 90 },
      ];
      for (const st of defaultStages) {
        await tx.dealStage.create({ data: st });
      }

      // 6. Create invited team members if any
      if (Array.isArray(invitedMembers) && invitedMembers.length > 0) {
        const defaultMemberHash = await bcrypt.hash('DamaCRM2026!', 10);
        for (const member of invitedMembers) {
          if (!member.email) continue;
          const memberRole = member.role === 'ADMIN' ? adminRole!.id : userRole!.id;
          const mUser = await tx.user.upsert({
            where: { email: member.email.trim().toLowerCase() },
            update: { tenantId: slug, roleId: memberRole },
            create: {
              email: member.email.trim().toLowerCase(),
              name: member.name || 'Colaborador',
              passwordHash: defaultMemberHash,
              roleId: memberRole,
              tenantId: slug,
              isActive: true,
            },
          });

          const mParts = (member.name || 'Colaborador').split(' ');
          await tx.employee.create({
            data: {
              userId: mUser.id,
              tenantId: slug,
              firstName: mParts[0],
              lastName: mParts.slice(1).join(' ') || 'Equipo',
              email: member.email.trim().toLowerCase(),
              jobTitle: member.role || 'Especialista',
              department: 'OPERATIONS',
            },
          });
        }
      }

      // 7. Mark Invitation as Accepted
      await tx.tenantInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED', tenantSlug: slug },
      });

      return { tenant: newTenant, company: newCompany, user };
    });

    const jwtToken = generateToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role.name,
    });

    await logAudit(result.user.id, 'COMPLETE_ONBOARDING', 'Tenant', result.tenant.id, { slug, companyName }, req.ip);

    res.status(201).json({
      success: true,
      token: jwtToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role.name,
        tenantId: result.tenant.slug,
      },
      tenant: result.tenant,
      company: result.company,
      message: `¡Bienvenido a DAMA CRM! Tu entorno para "${companyName}" ha sido configurado correctamente.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
