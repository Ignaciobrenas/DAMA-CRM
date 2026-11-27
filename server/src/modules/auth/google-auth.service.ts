import crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { Request } from 'express';
import { config } from '../../config';
import { prisma } from '../../prisma';
import { generateToken } from '../../utils/jwt';
import { IntegrationsConfigStore } from '../integrations/core/config.store';

export interface VerifiedGoogleProfile {
  email: string;
  name: string;
  avatar: string | null;
  emailVerified: boolean;
  googleSub?: string;
}

export interface GoogleAuthRuntimeConfig {
  clientId: string;
  clientSecret: string;
  configured: boolean;
  oauthRedirectEnabled: boolean;
  callbackUrl: string;
}

export interface SignedOAuthStatePayload {
  nonce: string;
  exp: number;
  tenantId?: string;
  frontendOrigin: string;
}

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_TOKENINFO_ENDPOINT = 'https://oauth2.googleapis.com/tokeninfo';
const GOOGLE_USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/userinfo';
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

export class GoogleAuthError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'GoogleAuthError';
    this.statusCode = statusCode;
  }
}

export function resolveRequestOrigin(req?: Request): string {
  if (!req) return config.frontendUrl;
  const forwardedProto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0]?.trim();
  const forwardedHost = (req.headers['x-forwarded-host'] as string)?.split(',')[0]?.trim();
  const proto = forwardedProto || req.protocol || 'http';
  const host = forwardedHost || req.get('host');
  return host ? `${proto}://${host}` : config.frontendUrl;
}

export function getGoogleAuthRuntimeConfig(req?: Request): GoogleAuthRuntimeConfig {
  let storeClientId = '';
  let storeClientSecret = '';
  try {
    const raw = IntegrationsConfigStore.loadConfig();
    storeClientId = raw.google_calendar?.clientId?.trim() || '';
    storeClientSecret = raw.google_calendar?.clientSecret?.trim() || '';
  } catch {
    // Ignore store read failures; fall back to env variables
  }

  const clientId = (
    process.env.GOOGLE_CLIENT_ID ||
    config.googleAuth.clientId ||
    storeClientId ||
    ''
  ).trim();
  const clientSecret = (
    process.env.GOOGLE_CLIENT_SECRET ||
    config.googleAuth.clientSecret ||
    storeClientSecret ||
    ''
  ).trim();

  const origin = resolveRequestOrigin(req);
  const callbackUrl = (
    process.env.GOOGLE_CALLBACK_URL ||
    config.googleAuth.callbackUrl ||
    `${origin}/api/auth/google/callback`
  ).trim();

  return {
    clientId,
    clientSecret,
    configured: Boolean(clientId),
    oauthRedirectEnabled: Boolean(clientId && clientSecret),
    callbackUrl,
  };
}

export function createSignedOAuthState(params: {
  tenantId?: string;
  frontendOrigin: string;
}): string {
  const payload: SignedOAuthStatePayload = {
    nonce: crypto.randomBytes(16).toString('hex'),
    exp: Date.now() + OAUTH_STATE_TTL_MS,
    tenantId: params.tenantId,
    frontendOrigin: params.frontendOrigin,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', config.jwt.secret)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifySignedOAuthState(state: string): SignedOAuthStatePayload {
  if (!state || !state.includes('.')) {
    throw new GoogleAuthError(400, 'Parámetro de estado OAuth inválido.');
  }
  const [encoded, signature] = state.split('.');
  const expectedSig = crypto
    .createHmac('sha256', config.jwt.secret)
    .update(encoded)
    .digest('base64url');

  const sigBuf = Buffer.from(signature || '', 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    throw new GoogleAuthError(400, 'Firma de estado OAuth inválida.');
  }

  let parsed: SignedOAuthStatePayload;
  try {
    parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    throw new GoogleAuthError(400, 'Estado OAuth corrupto.');
  }

  if (!parsed.exp || Date.now() > parsed.exp) {
    throw new GoogleAuthError(400, 'La sesión de inicio con Google ha caducado. Inténtalo de nuevo.');
  }

  return parsed;
}

export function buildGoogleAuthorizationUrl(params: {
  clientId: string;
  callbackUrl: string;
  state: string;
}): string {
  const url = new URL(GOOGLE_AUTH_ENDPOINT);
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', params.callbackUrl);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('prompt', 'select_account');
  url.searchParams.set('access_type', 'online');
  url.searchParams.set('state', params.state);
  return url.toString();
}

export async function verifyGoogleIdToken(
  idToken: string,
  expectedClientId?: string,
  fetchImpl: typeof fetch = fetch
): Promise<VerifiedGoogleProfile> {
  const cleanToken = idToken.trim();
  if (!cleanToken || cleanToken.split('.').length !== 3) {
    throw new GoogleAuthError(400, 'El token ID de Google tiene un formato inválido.');
  }

  const response = await fetchImpl(
    `${GOOGLE_TOKENINFO_ENDPOINT}?id_token=${encodeURIComponent(cleanToken)}`,
    { method: 'GET', headers: { Accept: 'application/json' } }
  );

  if (!response.ok) {
    throw new GoogleAuthError(401, 'No se pudo verificar el token de Google. Intenta iniciar sesión de nuevo.');
  }

  const data = (await response.json()) as Record<string, any>;
  if (expectedClientId && data.aud && data.aud !== expectedClientId) {
    throw new GoogleAuthError(401, 'El token de Google no corresponde a esta aplicación (audience inválida).');
  }

  const expSeconds = Number(data.exp);
  if (Number.isFinite(expSeconds) && expSeconds * 1000 < Date.now()) {
    throw new GoogleAuthError(401, 'El token de Google ha caducado.');
  }

  const email = typeof data.email === 'string' ? data.email.toLowerCase().trim() : '';
  const emailVerified = data.email_verified === true || data.email_verified === 'true';
  if (!email) {
    throw new GoogleAuthError(400, 'Google no proporcionó un correo electrónico válido.');
  }
  if (!emailVerified) {
    throw new GoogleAuthError(403, 'Tu cuenta de Google debe tener el correo electrónico verificado.');
  }

  return {
    email,
    name: (data.name || email.split('@')[0] || 'Usuario Google').trim(),
    avatar: typeof data.picture === 'string' ? data.picture : null,
    emailVerified: true,
    googleSub: typeof data.sub === 'string' ? data.sub : undefined,
  };
}

export async function verifyGoogleAccessToken(
  accessToken: string,
  expectedClientId?: string,
  fetchImpl: typeof fetch = fetch
): Promise<VerifiedGoogleProfile> {
  const cleanToken = accessToken.trim();
  if (!cleanToken) {
    throw new GoogleAuthError(400, 'Token de acceso de Google vacío.');
  }

  // Validate token audience when clientId is configured
  if (expectedClientId) {
    const infoRes = await fetchImpl(
      `${GOOGLE_TOKENINFO_ENDPOINT}?access_token=${encodeURIComponent(cleanToken)}`,
      { method: 'GET', headers: { Accept: 'application/json' } }
    );
    if (!infoRes.ok) {
      throw new GoogleAuthError(401, 'El token de acceso de Google es inválido o ha expirado.');
    }
    const tokenInfo = (await infoRes.json()) as Record<string, any>;
    const tokenAud = tokenInfo.aud || tokenInfo.azp;
    if (tokenAud && tokenAud !== expectedClientId) {
      throw new GoogleAuthError(401, 'El token de Google no pertenece a este cliente OAuth.');
    }
  }

  const profileRes = await fetchImpl(GOOGLE_USERINFO_ENDPOINT, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${cleanToken}`,
      Accept: 'application/json',
    },
  });

  if (!profileRes.ok) {
    throw new GoogleAuthError(401, 'No se pudo obtener el perfil verificado desde Google.');
  }

  const profile = (await profileRes.json()) as Record<string, any>;
  const email = typeof profile.email === 'string' ? profile.email.toLowerCase().trim() : '';
  const emailVerified = profile.email_verified === true || profile.email_verified === 'true';
  if (!email) {
    throw new GoogleAuthError(400, 'Google no devolvió un correo electrónico asociado.');
  }
  if (!emailVerified) {
    throw new GoogleAuthError(403, 'El correo de tu cuenta de Google no está verificado.');
  }

  return {
    email,
    name: (profile.name || email.split('@')[0] || 'Usuario Google').trim(),
    avatar: typeof profile.picture === 'string' ? profile.picture : null,
    emailVerified: true,
    googleSub: typeof profile.sub === 'string' ? profile.sub : undefined,
  };
}

export async function exchangeGoogleAuthorizationCode(
  params: {
    code: string;
    redirectUri: string;
    clientId: string;
    clientSecret: string;
  },
  fetchImpl: typeof fetch = fetch
): Promise<VerifiedGoogleProfile> {
  const body = new URLSearchParams({
    code: params.code,
    client_id: params.clientId,
    client_secret: params.clientSecret,
    redirect_uri: params.redirectUri,
    grant_type: 'authorization_code',
  });

  const tokenRes = await fetchImpl(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: body.toString(),
  });

  if (!tokenRes.ok) {
    throw new GoogleAuthError(401, 'No se pudo intercambiar el código de autorización con Google.');
  }

  const tokenData = (await tokenRes.json()) as Record<string, any>;
  if (tokenData.id_token) {
    return verifyGoogleIdToken(tokenData.id_token, params.clientId, fetchImpl);
  }
  if (tokenData.access_token) {
    return verifyGoogleAccessToken(tokenData.access_token, params.clientId, fetchImpl);
  }

  throw new GoogleAuthError(401, 'Google no devolvió ningún token de identidad válido.');
}

function buildPermissionsList(user: any): Array<{ resource: string; action: string }> {
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

export async function authenticateVerifiedGoogleProfile(
  profile: VerifiedGoogleProfile,
  tenantId?: string
) {
  let user = await prisma.user.findUnique({
    where: { email: profile.email },
    include: {
      role: {
        include: {
          permissions: true,
        },
      },
    },
  });

  if (!user) {
    const isAdminEmail = config.googleAuth.adminEmails.includes(profile.email);
    const defaultRole =
      (await prisma.role.findUnique({ where: { name: isAdminEmail ? 'ADMIN' : 'SALES' } })) ||
      (await prisma.role.findFirst({ where: { name: 'USER' } })) ||
      (await prisma.role.findFirst());

    if (!defaultRole) {
      throw new GoogleAuthError(500, 'Roles del sistema no configurados.');
    }

    user = await prisma.user.create({
      data: {
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
        passwordHash: await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10),
        roleId: defaultRole.id,
        tenantId: tenantId || 'master',
        isActive: true,
      },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });
  }

  if (!user.isActive) {
    throw new GoogleAuthError(401, 'La cuenta asociada a este correo de Google está inactiva.');
  }

  if (profile.avatar && (!user.avatar || user.avatar !== profile.avatar)) {
    await prisma.user
      .update({
        where: { id: user.id },
        data: { avatar: profile.avatar },
      })
      .catch(() => {});
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role.name,
  });

  return {
    token,
    user: {
      id: user.id,
      tenantId: user.tenantId,
      name: user.name,
      email: user.email,
      avatar: user.avatar || profile.avatar,
      twoFactorEnabled: user.twoFactorEnabled,
      role: user.role.name,
      preferences: user.preferences ? JSON.parse(user.preferences) : {},
      permissions: buildPermissionsList(user),
    },
  };
}
