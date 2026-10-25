import { test, expect, checkA11y, captureDualThemeScreenshots, monitorPageHealth } from './fixtures/test-fixtures';

test.describe('Module 01: Global Layout, Navigation & Centered Modals E2E', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('dama_cookie_consent', JSON.stringify({ technical: true, analytics: true, timestamp: new Date().toISOString() }));
    });
  });

  test('01.1 - Desktop Topbar & Sidebar layout hierarchy and navigation links', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/');
    await page.waitForLoadState('domcontentloaded');

    // 1. Verify Topbar components
    const header = page.locator('header').first();
    await expect(header).toBeVisible();
    await expect(header.locator('button[title*="Buscar"]')).toBeVisible();

    // 2. Verify Sidebar components and branding logo
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();
    const logoImg = sidebar.locator('img').first();
    await expect(logoImg).toBeVisible();

    // Check presence of core navigation categories
    await expect(sidebar).toContainText(/PRINCIPAL|AGENDA/i);
    await expect(sidebar).toContainText(/GESTIÓN COMERCIAL|COMERCIAL/i);
    await expect(sidebar).toContainText(/OPERACIONES|FINANZAS/i);

    // Capture visual snapshots in dual theme
    await captureDualThemeScreenshots(page, 'mod-01-desktop-layout');

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('01.2 - Centered Language Selection Modal', async ({ adminPage: page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('domcontentloaded');

    // Open Language Modal from Topbar
    const langBtn = page.locator('header button[aria-label*="dioma"], header button[aria-label*="anguage"], header button[title*="dioma"], header button[title*="anguage"]').first();
    await expect(langBtn).toBeVisible();
    await langBtn.click();

    // Verify modal is centered with role="dialog"
    const modal = page.locator('div[role="dialog"]').first();
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(/Seleccionar Idioma|Select Language/i);

    // Verify search filter in language modal
    const filterInput = modal.locator('input[type="text"]').first();
    if (await filterInput.isVisible()) {
      await filterInput.fill('English');
      await page.waitForTimeout(150);
      await expect(modal).toContainText(/English/i);
    }

    // Close modal via Escape
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible({ timeout: 5000 });
  });

  test('01.3 - Centered User Profile & Account Switcher Modal', async ({ adminPage: page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('domcontentloaded');

    // Open User Profile Modal
    const userBtn = page.locator('header button[title*="perfil"], header button[title*="profile"]').first();
    await expect(userBtn).toBeVisible();
    await userBtn.click();

    const profileModal = page.locator('.fixed.inset-0:has-text("Perfil de Usuario")').first();
    await expect(profileModal).toBeVisible();
    await expect(profileModal).toContainText(/Ignacio|Admin/i);
    await expect(profileModal).toContainText(/Recordar sesión/i);

    // Close modal via close button
    const closeBtn = profileModal.locator('button[aria-label*="Cerrar"], button:has(svg.lucide-x)').first();
    await closeBtn.click();
    await expect(profileModal).not.toBeVisible();
  });

  test('01.4 - Clean Topbar: Absence of God Mode / Master Tenant & Centered Guide Modal', async ({ adminPage: page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('domcontentloaded');

    // Verify absence of God Mode / Master Tenant jargon
    const topbar = page.locator('header').first();
    await expect(topbar).toBeVisible();
    await expect(topbar).not.toContainText(/God Mode/i);
    await expect(topbar).not.toContainText(/Master Tenant/i);
    await expect(topbar).not.toContainText(/Salir a Master/i);

    // Verify Module Quick Guide trigger opens centered onboarding modal
    const guideBtn = page.getByTestId('reopen-module-onboarding-btn');
    if (await guideBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await guideBtn.click();
      const tourModal = page.getByTestId('module-onboarding-modal');
      await expect(tourModal).toBeVisible();
      await expect(tourModal).toHaveClass(/items-center/);
      await expect(tourModal).toHaveClass(/justify-center/);
      await expect(tourModal).toHaveClass(/m-auto/);

      // Close via skip or close button
      const closeBtn = page.getByTestId('module-onboarding-skip-btn');
      await closeBtn.click();
      await expect(tourModal).toBeHidden({ timeout: 5000 });
    }
  });

  test('01.5 - Centered Command Menu (Cmd+K) Universal Search', async ({ adminPage: page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('domcontentloaded');

    // Trigger via search pill button or Ctrl+k
    const searchPill = page.locator('header button[title*="Buscar"]').first();
    await searchPill.click();

    const cmdMenu = page.locator('.fixed.inset-0:has(input[placeholder*="Buscar"])').first();
    await expect(cmdMenu).toBeVisible();

    // Type query
    const input = cmdMenu.locator('input').first();
    await input.fill('test');
    await page.waitForTimeout(200);

    // Close via ESC
    await page.keyboard.press('Escape');
    await expect(cmdMenu).not.toBeVisible({ timeout: 5000 });
  });

  test('01.6 - Mobile Responsive Layout & Drawer Navigation', async ({ page }) => {
    // Set Mobile Viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/#/login');
    await page.locator('input[type="email"], #login-email').fill('ignaciobrenas@gmail.com');
    await page.locator('input[type="password"], #login-password').fill('1');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/.*#\/(dashboard)?/, { timeout: 15000 });

    // Dismiss first-visit module onboarding modal if visible on fresh page context
    const onboardingSkip = page.locator('[data-testid="module-onboarding-skip-btn"]');
    if (await onboardingSkip.isVisible({ timeout: 2000 }).catch(() => false)) {
      await onboardingSkip.click();
    }

    // Verify Mobile Bottom Navigation is visible
    const mobileBottomNav = page.locator('nav.fixed.bottom-0').first();
    await expect(mobileBottomNav).toBeVisible();

    // Open Mobile Drawer via hamburger
    const menuBtn = page.locator('header button[aria-label="Menú"], header button[aria-label="Menu"]').first();
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();

    // Verify drawer appears and backdrop is present
    const backdrop = page.locator('[data-testid="sidebar-mobile-backdrop"], .fixed.inset-0.bg-slate-900\\/40, .fixed.inset-0.bg-slate-900\\/50').first();
    await expect(backdrop).toBeVisible();

    // Close drawer via backdrop click
    await backdrop.click({ position: { x: 320, y: 100 }, force: true });
    await page.waitForTimeout(250);

    // Check Axe Core accessibility on mobile layout
    await checkA11y(page, 'Mobile Layout & Navigation');
  });

});
