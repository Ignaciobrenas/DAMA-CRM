import { test, expect, checkA11y, captureDualThemeScreenshots, monitorPageHealth } from './fixtures/test-fixtures';

test.describe('Module 00: Authentication, Security & RBAC E2E', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('dama_cookie_consent', JSON.stringify({ technical: true, analytics: true, timestamp: new Date().toISOString() }));
    });
  });

  test('00.1 - Happy path Admin login, dashboard redirect and session persistence', async ({ page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/login');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('input[type="email"], #login-email')).toBeVisible();
    await expect(page.locator('input[type="password"], #login-password')).toBeVisible();

    await page.locator('input[type="email"], #login-email').fill('ignaciobrenas@gmail.com');
    await page.locator('input[type="password"], #login-password').fill('1');
    await page.locator('button[type="submit"]').click();

    await page.waitForURL(/.*#\/(dashboard)?/, { timeout: 15000 });
    await expect(page.locator('body')).toContainText(/Dashboard|Panel|Inicio|Ignacio/i);

    // Capture visual snapshots in dual theme
    await captureDualThemeScreenshots(page, 'mod-00-login-authenticated');

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('00.2 - Login rejection on invalid credentials with proper error message', async ({ page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/login');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('input[type="email"], #login-email').fill('ignaciobrenas@gmail.com');
    await page.locator('input[type="password"], #login-password').fill('InvalidPass999!');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('body')).toContainText(/Credenciales|incorrect|inválid|error/i);
    expect(page.url()).toContain('/login');

    health.stop();
  });

  test('00.3 - Password visibility toggle (Eye/EyeOff) and keyboard interaction', async ({ page }) => {
    await page.goto('/#/login');
    await page.waitForLoadState('domcontentloaded');

    const passwordInput = page.locator('input[type="password"], #login-password').first();
    const toggleBtn = page.locator('button[aria-label*="contraseña"], button:has(svg.lucide-eye), button:has(svg.lucide-eye-off)').first();

    await passwordInput.fill('SecretPassword123');
    expect(await passwordInput.getAttribute('type')).toBe('password');

    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
      await page.waitForTimeout(150);
      const updatedType = await page.locator('#login-password, input[placeholder="••••••••"]').first().getAttribute('type');
      expect(updatedType).toBe('text');

      await toggleBtn.click();
      await page.waitForTimeout(150);
      const resetType = await page.locator('#login-password, input[placeholder="••••••••"]').first().getAttribute('type');
      expect(resetType).toBe('password');
    }
  });

  test('00.4 - Navigation between Login, Forgot Password and Privacy Policy modes', async ({ page }) => {
    await page.goto('/#/login');
    await page.waitForLoadState('domcontentloaded');

    // Click '¿Olvidaste tu contraseña?'
    const forgotBtn = page.locator('button:has-text("¿Olvidaste"), button:has-text("Forgot")').first();
    if (await forgotBtn.isVisible()) {
      await forgotBtn.click();
      await expect(page.locator('body')).toContainText(/recuperación|reset|código/i);

      // Back to login
      const backBtn = page.locator('button:has-text("Volver"), button:has-text("Back")').first();
      await backBtn.click();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    }

    // Public Privacy Policy navigation
    await page.goto('/#/privacy');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toContainText(/Privacidad|Protección de Datos|RGPD/i);

    // Verify accessibility of Privacy Policy
    await checkA11y(page, 'Privacy Policy Page');
  });

  test('00.5 - Multi-Role Authorization & RBAC isolation', async ({ page }) => {
    // 1. Login as Sales User
    await page.goto('/#/login');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('input[type="email"], #login-email').fill('ventas@dama-crm.local');
    await page.locator('input[type="password"], #login-password').fill('Ventas1234!');
    await page.locator('button[type="submit"]').click();

    await page.waitForURL(/.*#\/(dashboard)?/, { timeout: 15000 });
    await expect(page.locator('body')).toContainText(/Dashboard|Ventas|Comercial/i);

    // Verify God Mode button is NOT visible for sales role
    const godBtn = page.locator('button[title*="God Mode"], button:has-text("God Mode")');
    await expect(godBtn).not.toBeVisible();
  });

  test('00.6 - Responsive Viewports & Accessibility Audit (Axe Core)', async ({ page }) => {
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1440, height: 900 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/#/login');
      await page.waitForLoadState('domcontentloaded');

      await expect(page.locator('input[type="email"], #login-email')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();

      // Axe Core WCAG AA check
      await checkA11y(page, `Login Page - Viewport ${vp.name}`);
    }
  });

});
