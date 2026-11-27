import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { prisma } from '../../prisma';
import { generateToken, verifyToken } from '../../utils/jwt';
import { sendOtpEmail, sendPasswordResetEmail } from '../../utils/mailer';
import { verifyTotpCode } from '../../utils/totp';
import { logAudit } from '../../middlewares/audit.middleware';
import { config } from '../../config';
import {
  authenticateVerifiedGoogleProfile,
  buildGoogleAuthorizationUrl,
  createSignedOAuthState,
  exchangeGoogleAuthorizationCode,
  getGoogleAuthRuntimeConfig,
  GoogleAuthError,
  verifyGoogleAccessToken,
  verifyGoogleIdToken,
  verifySignedOAuthState,
} from './google-auth.service';

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
        tenantId: user.tenantId,
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

export async function getGoogleAuthConfig(req: Request, res: Response): Promise<void> {
  const runtime = getGoogleAuthRuntimeConfig(req);
  res.json({
    success: true,
    data: {
      configured: runtime.configured,
      clientId: runtime.clientId || null,
      oauthRedirectEnabled: runtime.oauthRedirectEnabled,
      callbackUrl: runtime.callbackUrl,
    },
  });
}

export async function startGoogleOAuthRedirect(req: Request, res: Response): Promise<void> {
  const runtime = getGoogleAuthRuntimeConfig(req);
  const frontendOrigin =
    (typeof req.query.origin === 'string' && /^https?:\/\//i.test(req.query.origin)
      ? req.query.origin.replace(/\/$/, '')
      : config.frontendUrl.replace(/\/$/, ''));

  if (!runtime.oauthRedirectEnabled) {
    const errorMsg = encodeURIComponent(
      'Google OAuth no está configurado en el servidor (falta GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET).'
    );
    res.redirect(`${frontendOrigin}/?googleError=${errorMsg}`);
    return;
  }

  const tenantId =
    typeof req.query.tenant === 'string' && req.query.tenant.trim()
      ? req.query.tenant.trim().toLowerCase()
      : undefined;

  const state = createSignedOAuthState({ tenantId, frontendOrigin });
  const authUrl = buildGoogleAuthorizationUrl({
    clientId: runtime.clientId,
    callbackUrl: runtime.callbackUrl,
    state,
  });

  res.redirect(authUrl);
}

export async function handleGoogleOAuthCallback(req: Request, res: Response): Promise<void> {
  const fallbackOrigin = config.frontendUrl.replace(/\/$/, '');
  try {
    const oauthError = typeof req.query.error === 'string' ? req.query.error : '';
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const stateParam = typeof req.query.state === 'string' ? req.query.state : '';

    const stateData = stateParam ? verifySignedOAuthState(stateParam) : null;
    const targetOrigin = stateData?.frontendOrigin || fallbackOrigin;

    if (oauthError) {
      const msg = encodeURIComponent(
        oauthError === 'access_denied'
          ? 'Inicio de sesión con Google cancelado por el usuario.'
          : `Error de autenticación en Google: ${oauthError}`
      );
      res.redirect(`${targetOrigin}/?googleError=${msg}`);
      return;
    }

    if (!code || !stateData) {
      const msg = encodeURIComponent('Respuesta incompleta de Google OAuth.');
      res.redirect(`${targetOrigin}/?googleError=${msg}`);
      return;
    }

    const runtime = getGoogleAuthRuntimeConfig(req);
    if (!runtime.oauthRedirectEnabled) {
      const msg = encodeURIComponent('Google OAuth no está configurado en el servidor.');
      res.redirect(`${targetOrigin}/?googleError=${msg}`);
      return;
    }

    const verifiedProfile = await exchangeGoogleAuthorizationCode({
      code,
      redirectUri: runtime.callbackUrl,
      clientId: runtime.clientId,
      clientSecret: runtime.clientSecret,
    });

    const session = await authenticateVerifiedGoogleProfile(verifiedProfile, stateData.tenantId);
    await logAudit(
      session.user.id,
      'LOGIN_GOOGLE',
      'User',
      session.user.id,
      { email: session.user.email, provider: 'google', flow: 'oauth2_redirect' },
      req.ip
    );

    res.redirect(`${targetOrigin}/?googleToken=${encodeURIComponent(session.token)}`);
  } catch (error: any) {
    const message = error instanceof GoogleAuthError ? error.message : 'Error al completar el inicio de sesión con Google.';
    res.redirect(`${fallbackOrigin}/?googleError=${encodeURIComponent(message)}`);
  }
}

export async function loginWithGoogle(req: Request, res: Response): Promise<void> {
  try {
    const { credential, accessToken, code, redirectUri, email, name, avatar } = req.body || {};
    const runtime = getGoogleAuthRuntimeConfig(req);
    const tenantHeader = (req.headers['x-switch-tenant-id'] || req.headers['x-tenant-slug']) as string | undefined;
    const requestedTenant = tenantHeader?.trim().toLowerCase() || undefined;

    let verifiedProfile;

    if (credential && typeof credential === 'string') {
      verifiedProfile = await verifyGoogleIdToken(credential, runtime.clientId || undefined);
    } else if (accessToken && typeof accessToken === 'string') {
      verifiedProfile = await verifyGoogleAccessToken(accessToken, runtime.clientId || undefined);
    } else if (code && typeof code === 'string') {
      if (!runtime.oauthRedirectEnabled) {
        throw new GoogleAuthError(
          503,
          'El servidor requiere GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET para intercambiar códigos OAuth.'
        );
      }
      verifiedProfile = await exchangeGoogleAuthorizationCode({
        code,
        redirectUri: typeof redirectUri === 'string' && redirectUri ? redirectUri : runtime.callbackUrl,
        clientId: runtime.clientId,
        clientSecret: runtime.clientSecret,
      });
    } else if (
      config.env !== 'production' &&
      config.googleAuth.allowDevFallback &&
      email &&
      typeof email === 'string'
    ) {
      verifiedProfile = {
        email: email.toLowerCase().trim(),
        name: name || email.split('@')[0] || 'Usuario Google',
        avatar: avatar || null,
        emailVerified: true,
      };
    } else {
      throw new GoogleAuthError(
        runtime.configured ? 400 : 503,
        runtime.configured
          ? 'Se requiere una credencial verificada de Google (ID Token, Access Token o código OAuth).'
          : 'Google Sign-In no está configurado en el servidor. Añade GOOGLE_CLIENT_ID (y opcionalmente GOOGLE_CLIENT_SECRET) en el archivo .env o en Integraciones.'
      );
    }

    const session = await authenticateVerifiedGoogleProfile(verifiedProfile, requestedTenant);

    await logAudit(
      session.user.id,
      'LOGIN_GOOGLE',
      'User',
      session.user.id,
      { email: session.user.email, provider: 'google' },
      req.ip
    );

    res.json({
      success: true,
      require2FA: false,
      token: session.token,
      user: session.user,
    });
  } catch (error: any) {
    if (error instanceof GoogleAuthError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Error en autenticación con Google' });
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

    const validToken = await prisma.twoFactorToken.findFirst({
      where: {
        userId: payload.userId,
        code: code.trim(),
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    const isTotpValid = user.twoFactorSecret ? verifyTotpCode(user.twoFactorSecret, code.trim()) : false;

    if (!validToken && !isTotpValid) {
      res.status(401).json({ success: false, message: 'Código de verificación 2FA incorrecto o expirado' });
      return;
    }

    if (validToken) {
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
        tenantId: user.tenantId,
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
        tenantId: user.tenantId,
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

export async function register(req: Request, res: Response): Promise<void> {
  res.status(403).json({
    success: false,
    message: 'El registro público de cuentas está deshabilitado. Los nuevos usuarios deben ser aprovisionados por el Administrador de su Empresa o por el Administrador Principal.',
  });
}


export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: 'El correo electrónico es obligatorio' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    // For security, do not disclose if email exists or not
    if (!user) {
      res.json({
        success: true,
        message: 'Si el correo está registrado, recibirás un código de recuperación en breve',
      });
      return;
    }

    // Generate 6-digit verification code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.twoFactorToken.create({
      data: {
        userId: user.id,
        code: resetCode,
        expiresAt,
      },
    });

    await sendPasswordResetEmail(user.email, user.name, resetCode);
    await logAudit(user.id, 'FORGOT_PASSWORD_REQUEST', 'User', user.id, { email: cleanEmail }, req.ip);

    res.json({
      success: true,
      message: 'Código de recuperación enviado. Revisa tu bandeja de entrada.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      res.status(400).json({ success: false, message: 'Email, código y nueva contraseña requeridos' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'La nueva contraseña debe tener al menos 6 caracteres' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      res.status(400).json({ success: false, message: 'Usuario no encontrado o código inválido' });
      return;
    }

    const validToken = await prisma.twoFactorToken.findFirst({
      where: {
        userId: user.id,
        code: code.trim(),
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!validToken) {
      res.status(400).json({ success: false, message: 'Código de recuperación incorrecto o caducado' });
      return;
    }

    // Mark token as used
    await prisma.twoFactorToken.update({
      where: { id: validToken.id },
      data: { used: true },
    });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await logAudit(user.id, 'PASSWORD_RESET_SUCCESS', 'User', user.id, { email: cleanEmail }, req.ip);

    res.json({
      success: true,
      message: 'Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Contraseña actual y nueva contraseña requeridas' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'La nueva contraseña debe tener al menos 6 caracteres' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'La contraseña actual no es correcta' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await logAudit(userId, 'PASSWORD_CHANGED', 'User', userId, {}, req.ip);

    res.json({
      success: true,
      message: 'Contraseña actualizada con éxito',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
