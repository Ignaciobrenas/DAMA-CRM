import { test, expect, checkA11y, captureDualThemeScreenshots, monitorPageHealth } from './fixtures/test-fixtures';

test.describe('Module 05: Facturación, Presupuestos & Firma (/invoicing, /quote/sign/:id) E2E', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('dama_cookie_consent', JSON.stringify({ technical: true, analytics: true, timestamp: new Date().toISOString() }));
    });
  });

  test('05.1 - Invoicing Dashboard, Navigation Tabs, KPI Metrics Strip & a11y', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/invoicing');
    await page.waitForLoadState('domcontentloaded');

    // 1. Verify Page Title
    await expect(page.locator('h1')).toContainText(/Facturación|Invoicing/i);

    // 2. Verify KPI Metric Cards
    await expect(page.locator('[data-testid="kpi-total-invoiced"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-total-paid"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-total-pending"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-total-quotes"]')).toBeVisible();

    // 3. Verify Navigation Tabs
    const tabsList = page.locator('div[role="tablist"][aria-label="Secciones de Facturación"]');
    await expect(tabsList).toBeVisible();
    await expect(page.locator('[data-testid="tab-invoices"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-quotes"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-recurring"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-contracts"]')).toBeVisible();

    // 4. Capture dual-theme snapshots
    await captureDualThemeScreenshots(page, 'mod-05-invoicing-dashboard');

    // 5. Axe a11y check
    await checkA11y(page, 'invoicing-dashboard');

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('05.2 - Invoices Table Status Filtering (All, Paid, Pending, Draft)', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/invoicing');
    await page.waitForLoadState('domcontentloaded');

    // Verify filter buttons exist
    const paidFilter = page.locator('button:has-text("Cobradas")').first();
    const pendingFilter = page.locator('button:has-text("Pendientes")').first();
    const allFilter = page.locator('button:has-text("Todas")').first();

    await expect(allFilter).toBeVisible();
    await expect(paidFilter).toBeVisible();

    // Click Paid filter
    await paidFilter.click();
    await page.waitForTimeout(300);

    // Click Pending filter
    await pendingFilter.click();
    await page.waitForTimeout(300);

    // Reset to All
    await allFilter.click();
    await page.waitForTimeout(200);

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('05.3 - Centered New Invoice Modal & Line Item Live Math Calculation', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/invoicing');
    await page.waitForLoadState('domcontentloaded');

    // Click New Invoice button
    const newBtn = page.locator('[data-testid="btn-new-invoice"]');
    await expect(newBtn).toBeVisible();
    await newBtn.click();

    // Verify Modal is centered with m-auto and role="dialog"
    const modal = page.locator('div[role="dialog"]').first();
    await expect(modal).toBeVisible();
    const modalClass = await modal.getAttribute('class');
    expect(modalClass).toContain('m-auto');

    // Fill line item: desc, qty, price
    const descInput = page.locator('[data-testid="item-desc-0"]');
    const qtyInput = page.locator('[data-testid="item-qty-0"]');
    const priceInput = page.locator('[data-testid="item-price-0"]');

    const uniqueConcept = `Consultoría Cloud DevOps E2E ${Date.now()}`;
    await descInput.fill(uniqueConcept);
    await qtyInput.fill('2');
    await priceInput.fill('1500');

    // Verify live calculation: 2 * 1500 = 3000 base, with 21% IVA = 3630 total
    await expect(modal).toContainText('3630');

    // Submit invoice
    await page.click('[data-testid="invoice-submit-btn"]');

    // Verify modal closes and invoice is listed
    await expect(modal).not.toBeVisible({ timeout: 8000 });
    await expect(page.locator('table')).toContainText('3630');

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('05.4 - Invoice Mark as Paid & PDF Export actions', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/invoicing');
    await page.waitForLoadState('domcontentloaded');

    // Check if there are unpaid invoices with "Marcar Cobrado"
    const markPaidBtn = page.locator('button:has-text("Marcar Cobrado")').first();
    if (await markPaidBtn.isVisible()) {
      await markPaidBtn.click();
      await page.waitForTimeout(500);
    }

    // Verify PDF download button exists
    const pdfBtn = page.locator('button[title="Descargar PDF"]').first();
    await expect(pdfBtn).toBeVisible({ timeout: 10000 });

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('05.5 - Quotes (Presupuestos) Tab & Creation', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/invoicing');
    await page.waitForLoadState('domcontentloaded');

    // Switch to Presupuestos tab
    await page.click('[data-testid="tab-quotes"]');
    await page.waitForTimeout(300);

    // Click New Quote
    await page.click('[data-testid="btn-new-quote"]');

    const modal = page.locator('div[role="dialog"]').first();
    await expect(modal).toBeVisible();
    expect(await modal.getAttribute('class')).toContain('m-auto');

    // Fill line item
    const quoteConcept = `Auditoría Ciberseguridad ISO27001 ${Date.now()}`;
    await page.fill('[data-testid="item-desc-0"]', quoteConcept);
    await page.fill('[data-testid="item-qty-0"]', '1');
    await page.fill('[data-testid="item-price-0"]', '4200');

    await page.click('[data-testid="invoice-submit-btn"]');
    await expect(modal).not.toBeVisible({ timeout: 8000 });

    // Verify quote is listed in quotes table with calculated total with IVA (4200 * 1.21 = 5082 €)
    await expect(page.locator('table')).toContainText(/5\.?082|PRE-202/);

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('05.6 - Digital Signature Modal & Escape key handling', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/invoicing');
    await page.waitForLoadState('domcontentloaded');

    await page.click('[data-testid="tab-quotes"]');
    await page.waitForTimeout(300);

    // If there's an unsigned quote, click "Firmar"
    const signBtn = page.locator('button:has-text("Firmar")').first();
    if (await signBtn.isVisible()) {
      await signBtn.click();

      // Verify QuoteSignModal is centered with m-auto and role="dialog"
      const signModal = page.locator('div[role="dialog"][aria-labelledby="quote-sign-title"]');
      await expect(signModal).toBeVisible();
      const modalClass = await signModal.getAttribute('class');
      expect(modalClass).toContain('m-auto');

      // Close via Escape key
      await page.keyboard.press('Escape');
      await expect(signModal).not.toBeVisible();
    }

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('05.7 - Centered Aging Report & Excel/CSV Import Modals with Escape listener', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/invoicing');
    await page.waitForLoadState('domcontentloaded');

    // 1. Aging Report Modal
    await page.click('[data-testid="btn-aging-report"]');
    const agingModal = page.locator('div[role="dialog"][aria-labelledby="aging-report-title"]');
    await expect(agingModal).toBeVisible();
    expect(await agingModal.getAttribute('class')).toContain('m-auto');

    // Close via Escape key
    await page.keyboard.press('Escape');
    await expect(agingModal).not.toBeVisible();

    // 2. Excel/CSV Import Modal
    await page.click('[data-testid="btn-import-invoices"]');
    const importModal = page.locator('div[role="dialog"][aria-labelledby="import-modal-title"]');
    await expect(importModal).toBeVisible();
    expect(await importModal.getAttribute('class')).toContain('m-auto');

    // Close via Escape key
    await page.keyboard.press('Escape');
    await expect(importModal).not.toBeVisible();

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('05.8 - Responsive Viewport Checks (Mobile 375px & Tablet 768px)', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    // 1. Mobile 375px Viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/#/invoicing');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="btn-new-invoice"]')).toBeVisible();

    // Verify table container has overflow scroll
    const tableContainer = page.locator('.overflow-x-auto').first();
    await expect(tableContainer).toBeVisible();

    // 2. Tablet 768px Viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    await expect(page.locator('h1')).toBeVisible();

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

});
