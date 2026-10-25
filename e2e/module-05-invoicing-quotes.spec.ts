import { test, expect, checkA11y, captureDualThemeScreenshots, monitorPageHealth } from './fixtures/test-fixtures';

test.describe('Module 05: Facturación, Presupuestos, Veri*Factu AEAT & Firma (/invoicing) E2E', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('dama_cookie_consent', JSON.stringify({ technical: true, analytics: true, timestamp: new Date().toISOString() }));
    });
  });

  test('05.1 - Invoicing Dashboard, Navigation Tabs, KPI Metrics Strip & a11y', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/invoicing');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1')).toContainText(/Facturación|Invoicing/i);
    await expect(page.locator('[data-testid="kpi-total-invoiced"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-total-paid"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-total-pending"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-total-quotes"]')).toBeVisible();

    const tabsList = page.locator('div[role="tablist"][aria-label="Secciones de Facturación"]');
    await expect(tabsList).toBeVisible();
    await expect(page.locator('[data-testid="tab-invoices"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-quotes"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-recurring"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-contracts"]')).toBeVisible();

    await captureDualThemeScreenshots(page, 'mod-05-invoicing-dashboard');
    await checkA11y(page, 'invoicing-dashboard');

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('05.2 - Invoices Table Status Filtering (All, Paid, Pending, Draft)', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/invoicing');
    await page.waitForLoadState('domcontentloaded');

    const paidFilter = page.locator('button:has-text("Cobradas")').first();
    const pendingFilter = page.locator('button:has-text("Pendientes")').first();
    const allFilter = page.locator('button:has-text("Todas")').first();

    await expect(allFilter).toBeVisible();
    await expect(paidFilter).toBeVisible();

    await paidFilter.click();
    await page.waitForTimeout(300);

    await pendingFilter.click();
    await page.waitForTimeout(300);

    await allFilter.click();
    await page.waitForTimeout(200);

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('05.3 - Centered New Invoice Modal, AEAT Veri*Factu Type & Line Item Live Math Calculation', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/invoicing');
    await page.waitForLoadState('domcontentloaded');

    const newBtn = page.locator('[data-testid="btn-new-invoice"]');
    await expect(newBtn).toBeVisible();
    await newBtn.click();

    const modal = page.locator('div[role="dialog"]').first();
    await expect(modal).toBeVisible();
    const modalClass = await modal.getAttribute('class');
    expect(modalClass).toContain('m-auto');

    await expect(page.locator('[data-testid="select-invoice-type-aeat"]')).toBeVisible();

    const descInput = page.locator('[data-testid="item-desc-0"]');
    const qtyInput = page.locator('[data-testid="item-qty-0"]');
    const priceInput = page.locator('[data-testid="item-price-0"]');

    const uniqueConcept = `Consultoría Cloud DevOps E2E ${Date.now()}`;
    await descInput.fill(uniqueConcept);
    await qtyInput.fill('2');
    await priceInput.fill('1500');

    await expect(modal).toContainText('3630');

    await page.click('[data-testid="invoice-submit-btn"]');

    await expect(modal).not.toBeVisible({ timeout: 8000 });
    await expect(page.locator('table')).toContainText('3630');

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('05.4 - Invoice Mark as Paid & PDF Export actions', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/invoicing');
    await page.waitForLoadState('domcontentloaded');

    const markPaidBtn = page.locator('button:has-text("Marcar Cobrado")').first();
    if (await markPaidBtn.isVisible()) {
      await markPaidBtn.click();
      await page.waitForTimeout(500);
    }

    const pdfBtn = page.locator('button[title="Descargar PDF"]').first();
    await expect(pdfBtn).toBeVisible({ timeout: 10000 });

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('05.5 - Quotes (Presupuestos) Tab & Creation', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/invoicing');
    await page.waitForLoadState('domcontentloaded');

    await page.click('[data-testid="tab-quotes"]');
    await page.waitForTimeout(300);

    await page.click('[data-testid="btn-new-quote"]');

    const modal = page.locator('div[role="dialog"]').first();
    await expect(modal).toBeVisible();
    expect(await modal.getAttribute('class')).toContain('m-auto');

    const quoteConcept = `Auditoría Ciberseguridad ISO27001 ${Date.now()}`;
    await page.fill('[data-testid="item-desc-0"]', quoteConcept);
    await page.fill('[data-testid="item-qty-0"]', '1');
    await page.fill('[data-testid="item-price-0"]', '4200');

    await page.click('[data-testid="invoice-submit-btn"]');
    await expect(modal).not.toBeVisible({ timeout: 8000 });

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

    const signBtn = page.locator('button:has-text("Firmar")').first();
    if (await signBtn.isVisible()) {
      await signBtn.click();

      const signModal = page.locator('div[role="dialog"][aria-labelledby="quote-sign-title"]');
      await expect(signModal).toBeVisible();
      const modalClass = await signModal.getAttribute('class');
      expect(modalClass).toContain('m-auto');

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

    await page.click('[data-testid="btn-aging-report"]');
    const agingModal = page.locator('div[role="dialog"][aria-labelledby="aging-report-title"]');
    await expect(agingModal).toBeVisible();
    expect(await agingModal.getAttribute('class')).toContain('m-auto');

    await page.keyboard.press('Escape');
    await expect(agingModal).not.toBeVisible();

    await page.click('[data-testid="btn-import-invoices"]');
    const importModal = page.locator('div[role="dialog"][aria-labelledby="import-modal-title"]');
    await expect(importModal).toBeVisible();
    expect(await importModal.getAttribute('class')).toContain('m-auto');

    await page.keyboard.press('Escape');
    await expect(importModal).not.toBeVisible();

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('05.8 - Veri*Factu AEAT Cryptographic SHA-256 Chain Verification Modal', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/invoicing');
    await page.waitForLoadState('domcontentloaded');

    const verifactuBtn = page.locator('[data-testid="btn-verifactu-audit"]');
    await expect(verifactuBtn).toBeVisible();
    await verifactuBtn.click();

    const modal = page.locator('div[role="dialog"]').first();
    await expect(modal).toBeVisible();
    expect(await modal.getAttribute('class')).toContain('m-auto');

    await expect(page.locator('[data-testid="verifactu-chain-modal-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="verifactu-chain-badge"]')).toContainText(/VERIFICADO/i);

    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('05.9 - Responsive Viewport Checks (Mobile 375px & Tablet 768px)', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/#/invoicing');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="btn-new-invoice"]')).toBeVisible();

    const tableContainer = page.locator('.overflow-x-auto').first();
    await expect(tableContainer).toBeVisible();

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    await expect(page.locator('h1')).toBeVisible();

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });
});
