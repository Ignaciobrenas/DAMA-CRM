import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { prisma } from '../../prisma';
import { config } from '../../config';
import { generateToken, verifyToken } from '../../utils/jwt';
import { sendOtpEmail } from '../../utils/mailer';
import { verifyTotpCode } from '../../utils/totp';
import { logAudit } from '../../middlewares/audit.middleware';

function buildUserPermissions(user: any): Array<{ resource: string; action: string }> {
  const map = new Map<string, { resource: string; action: string }>();
  for (const p of user.role?.permissions || []) {
    map.set(`${p.resource}:${p.action}`, { resource: p.resource, action: p.action });
  }
  if (user.preferences) {
    try {
      const prefs = typeof user.preferences === 'string' ? JSON.parse(user.preferences) : user.preferences;
      if (Array.isArray(prefs.customPermissions)) {
        for (const cp of prefs.customPermissions) {
          if (cp.resource && cp.action) {
            map.set(`${cp.resource}:${cp.action}`, { resource: cp.resource, action: cp.action });
          }
        }
      }
    } catch {}
  }
  return Array.from(map.values());
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email y contraseña requeridos' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'Credenciales inválidas o cuenta inactiva' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Credenciales inválidas' });
      return;
    }

    // 2FA Requirement Logic:
    // Strictly mandatory in production (NODE_ENV === 'production').
    // In dev (NODE_ENV === 'development' || NODE_ENV === 'dev'), 2FA is NOT necessary.
    const envStr = (config.env || process.env.NODE_ENV || 'development').toLowerCase();
    const isDev = envStr.includes('dev');
    const isProd = envStr === 'production' || process.env.NODE_ENV === 'production';

    // Mandatory in production; in dev it is completely skipped/not necessary
    const requires2FA = isProd ? true : (isDev ? false : Boolean(user.twoFactorEnabled));

    if (requires2FA) {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await prisma.twoFactorToken.create({
        data: {
          userId: user.id,
          code: otpCode,
          expiresAt,
        },
      });

      console.log(`🔐 [2FA Engine] Código 2FA generado para ${user.email}: ${otpCode}`);

      // Send OTP via SMTP & display in console
      await sendOtpEmail(user.email, user.name, otpCode);

      const tempToken = generateToken(
        { userId: user.id, email: user.email, role: user.role.name, isTemp2FA: true },
        '10m'
      );

      res.json({
        success: true,
        require2FA: true,
        tempToken,
        message: isProd
          ? 'Autenticación 2FA obligatoria en entorno de Producción. Introduce el código enviado a tu correo o app.'
          : 'Código de verificación 2FA enviado a tu correo electrónico',
      });
      return;
    }

    // Direct login without 2FA
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role.name,
    });

    await logAudit(user.id, 'LOGIN', 'User', user.id, { email: user.email }, req.ip);

    res.json({
      success: true,
      require2FA: false,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        twoFactorEnabled: user.twoFactorEnabled,
        role: user.role.name,
        preferences: user.preferences ? JSON.parse(user.preferences) : {},
        permissions: buildUserPermissions(user),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function verify2FA(req: Request, res: Response): Promise<void> {
  try {
    const { tempToken, code } = req.body;

    if (!tempToken || !code) {
      res.status(400).json({ success: false, message: 'Token temporal y código de 6 dígitos requeridos' });
      return;
    }

    const payload = verifyToken(tempToken);
    if (!payload || !payload.isTemp2FA) {
      res.status(400).json({ success: false, message: 'Token temporal inválido o expirado' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    // 1. Check database OTP token
    const validToken = await prisma.twoFactorToken.findFirst({
      where: {
        userId: payload.userId,
        code: code.trim(),
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Check authenticator app (Google Authenticator / RFC 6238)
    const isTotpValid = user.twoFactorSecret ? verifyTotpCode(user.twoFactorSecret, code.trim()) : false;

    if (!validToken && !isTotpValid) {
      res.status(401).json({ success: false, message: 'Código de verificación 2FA incorrecto o expirado' });
      return;
    }

    if (validToken) {
      // Mark token as used
      await prisma.twoFactorToken.update({
        where: { id: validToken.id },
        data: { used: true },
      });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role.name,
    });

    await logAudit(user.id, '2FA_VERIFIED', 'User', user.id, { email: user.email }, req.ip);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        twoFactorEnabled: user.twoFactorEnabled,
        role: user.role.name,
        preferences: user.preferences ? JSON.parse(user.preferences) : {},
        permissions: buildUserPermissions(user),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function toggle2FA(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { enable } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: Boolean(enable) },
    });

    await logAudit(
      userId,
      enable ? '2FA_ENABLED' : '2FA_DISABLED',
      'User',
      userId,
      { enabled: enable },
      req.ip
    );

    res.json({
      success: true,
      twoFactorEnabled: updatedUser.twoFactorEnabled,
      message: updatedUser.twoFactorEnabled
        ? 'Doble factor (2FA) activado con éxito'
        : 'Doble factor (2FA) desactivado',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        twoFactorEnabled: user.twoFactorEnabled,
        role: user.role.name,
        preferences: user.preferences ? JSON.parse(user.preferences) : {},
        permissions: buildUserPermissions(user),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
