process.env.NODE_ENV = 'test';

import { after, describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { prisma } from '../src/prisma';
import { verifyToken } from '../src/utils/jwt';
import {
  authenticateVerifiedGoogleProfile,
  buildGoogleAuthorizationUrl,
  createSignedOAuthState,
  exchangeGoogleAuthorizationCode,
  GoogleAuthError,
  verifyGoogleAccessToken,
  verifyGoogleIdToken,
  verifySignedOAuthState,
} from '../src/modules/auth/google-auth.service';

function loadClientToastDedupeModule(): { ToastDeduplicator: new (cooldownMs?: number) => any } {
  const filePath = path.resolve(__dirname, '../../client/src/utils/toast-dedupe.ts');
  const source = fs.readFileSync(filePath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const mod = { exports: {} as any };
  const fn = new Function('exports', 'require', 'module', compiled.outputText);
  fn(mod.exports, require, mod);
  return mod.exports;
}

const { ToastDeduplicator } = loadClientToastDedupeModule();

const TEST_EMAIL = `google-oauth-test-${Date.now()}@example.com`;

function createMockResponse(status: number, body: Record<string, unknown>): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

describe('Google OAuth Verification & Toast Error Deduplication Suite', () => {
  after(async () => {
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
    await prisma.$disconnect();
  });

  describe('Google OAuth State, Token Verification & Provisioning', () => {
    it('should sign and verify OAuth state with HMAC and reject tampered tokens', () => {
      const state = createSignedOAuthState({
        tenantId: 'acme',
        frontendOrigin: 'https://app.damacrm.com',
      });
      const verified = verifySignedOAuthState(state);
      assert.strictEqual(verified.tenantId, 'acme');
      assert.strictEqual(verified.frontendOrigin, 'https://app.damacrm.com');

      assert.throws(() => verifySignedOAuthState(`${state}tampered`), GoogleAuthError);
      assert.throws(() => verifySignedOAuthState('invalid-state-without-dot'), GoogleAuthError);

      const authUrl = buildGoogleAuthorizationUrl({
        clientId: 'client-123.apps.googleusercontent.com',
        callbackUrl: 'https://app.damacrm.com/api/auth/google/callback',
        state,
      });
      const parsed = new URL(authUrl);
      assert.strictEqual(parsed.hostname, 'accounts.google.com');
      assert.strictEqual(parsed.searchParams.get('client_id'), 'client-123.apps.googleusercontent.com');
      assert.strictEqual(parsed.searchParams.get('response_type'), 'code');
      assert.strictEqual(parsed.searchParams.get('prompt'), 'select_account');
      assert.strictEqual(parsed.searchParams.get('state'), state);
    });

    it('should verify Google ID tokens via tokeninfo and reject audience mismatch or unverified emails', async () => {
      const fakeJwt = 'header.payload.signature';
      const futureExp = Math.floor(Date.now() / 1000) + 3600;

      const validProfile = await verifyGoogleIdToken(
        fakeJwt,
        'my-client-id',
        async () =>
          createMockResponse(200, {
            aud: 'my-client-id',
            exp: String(futureExp),
            email: '  User@Example.COM ',
            email_verified: 'true',
            name: 'Test Google User',
            picture: 'https://lh3.googleusercontent.com/avatar.png',
            sub: 'google-sub-001',
          })
      );

      assert.strictEqual(validProfile.email, 'user@example.com');
      assert.strictEqual(validProfile.name, 'Test Google User');
      assert.strictEqual(validProfile.emailVerified, true);

      // Audience mismatch
      await assert.rejects(
        () =>
          verifyGoogleIdToken(fakeJwt, 'expected-client-id', async () =>
            createMockResponse(200, {
              aud: 'other-client-id',
              exp: String(futureExp),
              email: 'user@example.com',
              email_verified: 'true',
            })
          ),
        /audience inválida/
      );

      // Unverified email
      await assert.rejects(
        () =>
          verifyGoogleIdToken(fakeJwt, 'my-client-id', async () =>
            createMockResponse(200, {
              aud: 'my-client-id',
              exp: String(futureExp),
              email: 'user@example.com',
              email_verified: 'false',
            })
          ),
        /correo electrónico verificado/
      );
    });

    it('should verify Google access tokens and exchange authorization codes cleanly', async () => {
      const mockFetch = async (input: string | URL | Request): Promise<Response> => {
        const url = String(input);
        if (url.includes('oauth2.googleapis.com/tokeninfo?access_token=')) {
          return createMockResponse(200, { aud: 'my-client-id' });
        }
        if (url.includes('googleapis.com/oauth2/v3/userinfo')) {
          return createMockResponse(200, {
            email: TEST_EMAIL,
            email_verified: true,
            name: 'Google OAuth User',
            picture: 'https://lh3.googleusercontent.com/photo.jpg',
            sub: 'sub-999',
          });
        }
        if (url.includes('oauth2.googleapis.com/token')) {
          return createMockResponse(200, { access_token: 'ya29.valid_access_token' });
        }
        return createMockResponse(404, {});
      };

      const profileFromAccess = await verifyGoogleAccessToken(
        'ya29.valid_access_token',
        'my-client-id',
        mockFetch as typeof fetch
      );
      assert.strictEqual(profileFromAccess.email, TEST_EMAIL);

      const profileFromCode = await exchangeGoogleAuthorizationCode(
        {
          code: '4/0AcvDMr-sample-code',
          redirectUri: 'https://app.damacrm.com/api/auth/google/callback',
          clientId: 'my-client-id',
          clientSecret: 'secret-xyz',
        },
        mockFetch as typeof fetch
      );
      assert.strictEqual(profileFromCode.email, TEST_EMAIL);

      // Authenticate and provision user in DB
      const session = await authenticateVerifiedGoogleProfile(profileFromCode, 'master');
      assert.ok(session.token);
      assert.strictEqual(session.user.email, TEST_EMAIL);
      const decoded = verifyToken(session.token);
      assert.strictEqual(decoded.userId, session.user.id);

      // Inactive user must be rejected
      await prisma.user.update({
        where: { id: session.user.id },
        data: { isActive: false },
      });
      await assert.rejects(
        () => authenticateVerifiedGoogleProfile(profileFromCode, 'master'),
        /inactiva/
      );
    });
  });

  describe('Toast Alert Single-Fire Deduplication', () => {
    it('should collapse 4 identical concurrent error alerts into a single alert', () => {
      const dedupe = new ToastDeduplicator(4000);
      const t0 = 1_700_000_000_000;
      let shownCount = 0;

      for (let i = 0; i < 4; i++) {
        const res = dedupe.check(
          'error',
          'Fallo de Red',
          'No se pudo conectar con el servidor. Comprueba tu conexión de red.',
          t0 + i * 20
        );
        if (res.allowed) {
          shownCount++;
          dedupe.register(`toast-${i}`, res.keys, 4000, t0 + i * 20);
        }
      }

      assert.strictEqual(shownCount, 1, 'Only 1 alert should be displayed for 4 simultaneous identical failures');
    });

    it('should prevent double alerts when api.ts and a component emit the same error message with different titles', () => {
      const dedupe = new ToastDeduplicator(4000);
      const t0 = 1_700_000_000_000;

      const globalApiCheck = dedupe.check(
        'error',
        'Permiso Denegado',
        'No tienes permisos suficientes para realizar esta acción.',
        t0
      );
      assert.strictEqual(globalApiCheck.allowed, true);
      dedupe.register('toast-global', globalApiCheck.keys, 4000, t0);

      const componentCheck = dedupe.check(
        'error',
        'Error al guardar',
        'No tienes permisos suficientes para realizar esta acción',
        t0 + 15
      );
      assert.strictEqual(componentCheck.allowed, false);
    });

    it('should allow distinct alerts simultaneously and allow repeat alerts after dismissal or cooldown', () => {
      const dedupe = new ToastDeduplicator(4000);
      const t0 = 1_700_000_000_000;

      const first = dedupe.check('error', 'Error de Factura', 'El CIF introducido no es válido', t0);
      assert.strictEqual(first.allowed, true);
      dedupe.register('toast-1', first.keys, 4000, t0);

      // Distinct error message is allowed
      const second = dedupe.check('error', 'Error de Stock', 'No hay existencias disponibles para SKU-99', t0 + 10);
      assert.strictEqual(second.allowed, true);
      dedupe.register('toast-2', second.keys, 4000, t0 + 10);

      // Manual release allows immediate retry feedback
      dedupe.release('toast-1');
      const retryAfterDismiss = dedupe.check('error', 'Error de Factura', 'El CIF introducido no es válido', t0 + 100);
      assert.strictEqual(retryAfterDismiss.allowed, true);

      // After cooldown expires, alert is allowed again
      const afterExpiry = dedupe.check('error', 'Error de Stock', 'No hay existencias disponibles para SKU-99', t0 + 5000);
      assert.strictEqual(afterExpiry.allowed, true);
    });
  });
});
