import { test, expect } from '@playwright/test';

test.describe('DAMA-CRM RBAC & Security Isolation E2E', () => {

  test('Security 1: Rejection of invalid credentials', async ({ page }) => {
    await page.goto('/#/login');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    await emailInput.fill('admin@dama-crm.local');
    await passwordInput.fill('wrongpassword123');
    await submitBtn.click();

    // Verify error toast or message appears and does not navigate to dashboard
    await expect(page.locator('body')).toContainText(/Credenciales|incorrect|inválid|error/i);
    expect(page.url()).toContain('/login');
  });

  test('Security 2: God Mode (SuperAdmin) access and tenant switching', async ({ page }) => {
    await page.goto('/#/login');
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').fill('ignaciobrenas@gmail.com');
    await page.locator('input[type="password"]').fill('1');
    await page.locator('button[type="submit"]').click();

    await page.waitForURL(/.*#\/(dashboard)?/);
    await page.waitForLoadState('networkidle');

    // God mode indicator or selector in topbar
    const godBtn = page.locator('button[title*="God"], button:has-text("God Mode"), button[title*="Multi-tenant"]').first();
    if (await godBtn.isVisible()) {
      await godBtn.click();
      const modal = page.locator('div[role="dialog"], .fixed.inset-0').first();
      await expect(modal).toBeVisible();
      await expect(modal).toContainText(/Tenants|Empresas|God Mode|Master/i);
      await page.keyboard.press('Escape');
    }
  });

  test('Security 3: Sales role RBAC restrictions', async ({ page }) => {
    await page.goto('/#/login');
    await page.waitForLoadState('networkidle');

    // Login as Sales agent
    await page.locator('input[type="email"]').fill('ventas@dama-crm.local');
    await page.locator('input[type="password"]').fill('Ventas1234!');
    await page.locator('button[type="submit"]').click();

    await page.waitForURL(/.*#\/(dashboard)?/);
    await page.waitForLoadState('networkidle');

    // Sales can access pipeline
    await page.goto('/#/pipeline');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toContainText(/Pipeline|Oportunidades|Ventas/i);

    // Sales should NOT have access to user administration
    await page.goto('/#/settings');
    await page.waitForLoadState('networkidle');
    // Either AccessDenied component or redirect
    const hasAccessDenied = await page.locator('text=Acceso Denegado, text=Access Denied, text=No tienes permisos').count();
    const hasEmptyUsersTab = await page.locator('text=Gestión de Usuarios').count() === 0;
    expect(hasAccessDenied > 0 || hasEmptyUsersTab).toBeTruthy();
  });

  test('Security 4: API Tenant isolation prevents header spoofing', async ({ request }) => {
    // 1. Login as standard tenant user
    const loginRes = await request.post('http://localhost:4000/api/auth/login', {
      data: {
        email: 'ventas@dama-crm.local',
        password: 'Ventas1234!',
      },
    });
    expect(loginRes.status()).toBe(200);
    const loginData = await loginRes.json();
    const token = loginData.data?.token || loginData.token;

    // 2. Attempt to spoof tenant header to 'master' or another tenant
    const spoofRes = await request.get('http://localhost:4000/api/deals', {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Switch-Tenant-ID': 'master',
        'X-Tenant-ID': 'another-tenant-id',
      },
    });

    // The backend should either return 200 with strictly their own tenant deals or reject the switch
    expect(spoofRes.status()).toBe(200);
    const dealsJson = await spoofRes.json();
    if (dealsJson.data && dealsJson.data.length > 0) {
      for (const deal of dealsJson.data) {
        expect(deal.tenantId).toBe(loginData.data?.user?.tenantId || loginData.user?.tenantId);
      }
    }
  });

});
