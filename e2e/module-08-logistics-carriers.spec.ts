import { test, expect, checkA11y, captureDualThemeScreenshots, monitorPageHealth } from './fixtures/test-fixtures';

test.describe('Module 08: Logística, 22 Agencias con Logos SVG, Comparador Tarifas & Etiqueta 10x15 (/logistics) E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'dama_cookie_consent',
        JSON.stringify({ technical: true, analytics: true, timestamp: new Date().toISOString() })
      );
    });
  });

  test('08.1 - Logistics Dashboard, Shipments Grid, Carrier Logos & a11y', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/logistics');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1')).toContainText(/Logística|Logistics/i);
    await expect(page.locator('[data-testid="tab-logistics-shipments"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-logistics-analytics"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-logistics-connectors"]')).toBeVisible();

    // Verify thermal label PDF buttons on shipment cards
    const labelBtn = page.locator('button[data-testid^="btn-shipment-label-"]').first();
    await expect(labelBtn).toBeVisible({ timeout: 10000 });

    await captureDualThemeScreenshots(page, 'mod-08-logistics-carriers');
    await checkA11y(page, 'logistics-dashboard');

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('08.2 - Multi-Carrier Rate Comparator Modal & 22 Carrier Connectors Grid', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/logistics');
    await page.waitForLoadState('domcontentloaded');

    // Open Rate Comparator Modal
    await page.click('[data-testid="btn-compare-rates"]');
    const modal = page.locator('div[role="dialog"]').first();
    await expect(modal).toBeVisible();
    expect(await modal.getAttribute('class')).toContain('m-auto');
    await expect(page.locator('[data-testid="rate-comparator-modal"]')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();

    // Switch to 22 Connectors tab
    await page.click('[data-testid="tab-logistics-connectors"]');
    await expect(page.locator('[data-testid="carriers-connectors-grid"]')).toBeVisible();

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('08.3 - Create New Shipment Modal (Centered with m-auto)', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/logistics');
    await page.waitForLoadState('domcontentloaded');

    await page.click('[data-testid="btn-new-shipment"]');
    const modal = page.locator('div[role="dialog"]').first();
    await expect(modal).toBeVisible();
    expect(await modal.getAttribute('class')).toContain('m-auto');

    await page.selectOption('[data-testid="select-shipment-carrier"]', 'DHL');
    await page.fill('[data-testid="input-shipment-recipient"]', `Cliente Enterprise E2E ${Date.now()}`);
    await page.fill('[data-testid="input-shipment-address"]', 'Paseo de la Castellana 200');
    await page.fill('[data-testid="input-shipment-city"]', 'Madrid');
    await page.fill('[data-testid="input-shipment-postal"]', '28046');

    await page.click('[data-testid="btn-submit-new-shipment"]');
    await expect(modal).not.toBeVisible({ timeout: 10000 });

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });
});
