import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { prisma } from '../../prisma';
import { generateToken, verifyToken } from '../../utils/jwt';
import { sendOtpEmail } from '../../utils/mailer';
import { logAudit } from '../../middlewares/audit.middleware';

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

    // Check if 2FA is required
    if (user.twoFactorEnabled) {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await prisma.twoFactorToken.create({
        data: {
          userId: user.id,
          code: otpCode,
          expiresAt,
        },
      });

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
        message: 'Código de verificación 2FA enviado a tu correo electrónico',
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
        permissions: user.role.permissions.map((p) => ({
          resource: p.resource,
          action: p.action,
        })),
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

    const validToken = await prisma.twoFactorToken.findFirst({
      where: {
        userId: payload.userId,
        code: code.trim(),
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!validToken) {
      res.status(401).json({ success: false, message: 'Código de verificación incorrecto o expirado' });
      return;
    }

    // Mark token as used
    await prisma.twoFactorToken.update({
      where: { id: validToken.id },
      data: { used: true },
    });

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
        permissions: user.role.permissions.map((p) => ({
          resource: p.resource,
          action: p.action,
        })),
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
        permissions: user.role.permissions.map((p) => ({
          resource: p.resource,
          action: p.action,
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
