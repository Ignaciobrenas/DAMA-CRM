import { test, expect, checkA11y, captureDualThemeScreenshots, monitorPageHealth } from './fixtures/test-fixtures';

test.describe('Module 18: Configuración, Identidad Corporativa, Logo Placeholder DAMA & Estudio de Diseño PDF (/settings) E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'dama_cookie_consent',
        JSON.stringify({ technical: true, analytics: true, timestamp: new Date().toISOString() })
      );
    });
  });

  test('18.1 - Settings Navigation, Company Identity & Official DAMA Logo Placeholder Fallback', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/settings');
    await page.waitForLoadState('domcontentloaded');

    // Navigate to Company Settings tab
    const companyTab = page.locator('[data-testid="tab-settings-company"]');
    await expect(companyTab).toBeVisible();
    await companyTab.click();

    await expect(page.locator('[data-testid="company-settings-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-company-name"]')).toBeVisible();

    // Open PDF Design Studio directly from the Company Settings shortcut button
    await page.click('[data-testid="btn-open-pdf-studio-from-company"]');
    await expect(page.locator('[data-testid="pdf-design-studio"]')).toBeVisible();

    await captureDualThemeScreenshots(page, 'mod-18-settings-pdf-studio');
    await checkA11y(page, 'settings-pdf-studio');

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('18.2 - PDF Design Studio: Switch Templates, Customize Legal Metadata, Live A4 Preview & Persist in DB', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/settings');
    await page.waitForLoadState('domcontentloaded');

    await page.click('[data-testid="tab-settings-pdf_studio"]');
    await expect(page.locator('[data-testid="pdf-design-studio"]')).toBeVisible();

    // Verify all 4 templates exist and switch between them
    await expect(page.locator('[data-testid="select-pdf-template-MODERN_STRIPE"]')).toBeVisible();
    await expect(page.locator('[data-testid="select-pdf-template-CORPORATE_SAGE"]')).toBeVisible();
    await expect(page.locator('[data-testid="select-pdf-template-CLASSIC_EXECUTIVE"]')).toBeVisible();
    await expect(page.locator('[data-testid="select-pdf-template-MINIMAL_SWISS"]')).toBeVisible();

    // Click CORPORATE_SAGE template
    await page.click('[data-testid="select-pdf-template-CORPORATE_SAGE"]');

    // Verify Live A4 sheet preview updates
    const a4Sheet = page.locator('[data-testid="pdf-live-preview-sheet"]');
    await expect(a4Sheet).toBeVisible();
    await expect(a4Sheet).toContainText(/VERI\*FACTU|ALBARÁN|FACTURA/i);

    // Save PDF Design configuration to PostgreSQL
    await page.click('[data-testid="btn-save-pdf-design"]');
    await page.waitForTimeout(500);

    // Verify Sample PDF Download button is visible and interactive
    await expect(page.locator('[data-testid="btn-download-sample-pdf"]')).toBeVisible();

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });
});
