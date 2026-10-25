import { test, expect, checkA11y, captureDualThemeScreenshots, monitorPageHealth } from './fixtures/test-fixtures';

test.describe('Module 07: Inventario Multi-Almacén, Traspasos Sage 2 Fases, Lotes FEFO & Kardex (/inventory) E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'dama_cookie_consent',
        JSON.stringify({ technical: true, analytics: true, timestamp: new Date().toISOString() })
      );
    });
  });

  test('07.1 - Inventory Dashboard, Multi-Warehouse Switcher, Tabs & a11y', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/inventory');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1')).toContainText(/Inventario|Inventory/i);
    await expect(page.locator('[data-testid="tab-inventory-catalog"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-inventory-transfers"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-inventory-batches"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-inventory-kardex"]')).toBeVisible();

    await expect(page.locator('[data-testid="warehouse-card-ALL"]')).toBeVisible();

    await captureDualThemeScreenshots(page, 'mod-07-inventory-warehouses');
    await checkA11y(page, 'inventory-dashboard');

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('07.2 - Sage 50/200 2-Phase Inter-Warehouse Stock Transfer (Phase 1 Outbound & Phase 2 Reception)', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/inventory');
    await page.waitForLoadState('domcontentloaded');

    // Switch to Transfers tab
    await page.click('[data-testid="tab-inventory-transfers"]');
    await expect(page.locator('[data-testid="section-stock-transfers"]')).toBeVisible();

    // Open New Stock Transfer Modal (Phase 1)
    await page.click('[data-testid="btn-new-stock-transfer"]');

    const modal = page.locator('div[role="dialog"]').first();
    await expect(modal).toBeVisible();
    expect(await modal.getAttribute('class')).toContain('m-auto');

    // Fill LOTT Road Transport Fields
    await page.fill('[data-testid="input-transfer-carrier"]', 'SEUR Geopost Iberia');
    await page.fill('[data-testid="input-transfer-driver"]', 'Miguel Ángel Torres');
    await page.fill('[data-testid="input-transfer-plate"]', '9281-LKM');

    // Submit Phase 1 Outbound Dispatch
    await page.click('[data-testid="btn-submit-stock-transfer"]');
    await expect(modal).not.toBeVisible({ timeout: 10000 });

    // Verify transfer appears in IN_TRANSIT and click Phase 2 Receive button
    const receiveBtn = page.locator('button[data-testid^="btn-receive-transfer-"]').first();
    await expect(receiveBtn).toBeVisible({ timeout: 10000 });
    await receiveBtn.click();

    const receiveModal = page.locator('div[role="dialog"]').first();
    await expect(receiveModal).toBeVisible();
    expect(await receiveModal.getAttribute('class')).toContain('m-auto');

    await page.click('[data-testid="btn-confirm-reception"]');
    await expect(receiveModal).not.toBeVisible({ timeout: 10000 });

    // Verify Albarán de Circulación PDF button exists
    const pdfBtn = page.locator('button[data-testid^="btn-transfer-pdf-"]').first();
    await expect(pdfBtn).toBeVisible();

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('07.3 - FEFO Batches & Expiry Matrix + Kardex Contable PMP Ledger', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/inventory');
    await page.waitForLoadState('domcontentloaded');

    // 1. Batches FEFO Tab
    await page.click('[data-testid="tab-inventory-batches"]');
    await expect(page.locator('[data-testid="section-stock-batches"]')).toBeVisible();

    // Open New Batch Modal
    await page.click('[data-testid="btn-new-batch"]');
    const batchModal = page.locator('div[role="dialog"]').first();
    await expect(batchModal).toBeVisible();
    expect(await batchModal.getAttribute('class')).toContain('m-auto');

    await page.keyboard.press('Escape');
    await expect(batchModal).not.toBeVisible();

    // 2. Kardex PMP Tab
    await page.click('[data-testid="tab-inventory-kardex"]');
    await expect(page.locator('[data-testid="section-stock-kardex"]')).toBeVisible();

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });
});
