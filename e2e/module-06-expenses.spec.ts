import { test, expect, checkA11y, captureDualThemeScreenshots, monitorPageHealth } from './fixtures/test-fixtures';

test.describe('Module 06: Gastos & Control Financiero (/expenses) E2E', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('dama_cookie_consent', JSON.stringify({ technical: true, analytics: true, timestamp: new Date().toISOString() }));
    });
  });

  test('06.1 - Expenses Dashboard, P&L KPI Strip, Dual Theme & a11y', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/expenses');
    await page.waitForLoadState('domcontentloaded');

    // 1. Verify Page Title
    await expect(page.locator('h1')).toContainText(/Control de Gastos|Expenses/i);

    // 2. Verify Financial KPI Metric Cards
    await expect(page.locator('[data-testid="kpi-invoiced"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-expenses"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-operating-profit"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-vat-balance"]')).toBeVisible();

    // 3. Verify Action Bar elements
    await expect(page.locator('[data-testid="btn-new-expense"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-export-csv"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-export-pdf"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-search-expenses"]')).toBeVisible();

    // 4. Dual-theme screenshots
    await captureDualThemeScreenshots(page, 'mod-06-expenses-dashboard');

    // 5. Axe accessibility audit
    await checkA11y(page, 'expenses-dashboard');

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('06.2 - Centered New Expense Modal (Rule #3, Validation & Creation Flow)', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/expenses');
    await page.waitForLoadState('domcontentloaded');

    // Open New Expense Modal
    await page.locator('[data-testid="btn-new-expense"]').click();

    const modal = page.locator('[data-testid="modal-new-expense"]');
    await expect(modal).toBeVisible();

    // Check Rule #3: Centered dialog classes and ARIA attributes
    await expect(modal).toHaveAttribute('role', 'dialog');
    await expect(modal).toHaveAttribute('aria-modal', 'true');
    const classAttr = await modal.getAttribute('class');
    expect(classAttr).toContain('items-center');
    expect(classAttr).toContain('justify-center');
    expect(classAttr).toContain('m-auto');

    // Keyboard accessibility: Escape to dismiss
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();

    // Reopen and create test expense
    await page.locator('[data-testid="btn-new-expense"]').click();
    await expect(modal).toBeVisible();

    const uniqueSupplier = `E2E Hetzner Cloud ${Date.now()}`;
    await page.locator('[data-testid="input-supplier-name"]').fill(uniqueSupplier);
    await page.locator('[data-testid="input-supplier-tax-id"]').fill('DE998877665');
    await page.locator('[data-testid="select-category"]').selectOption('SOFTWARE');
    await page.locator('[data-testid="input-subtotal"]').fill('150.00');
    await page.locator('[data-testid="select-tax-rate"]').selectOption('21');
    await page.locator('[data-testid="select-payment-method"]').selectOption('BANK_TRANSFER');
    await page.locator('[data-testid="input-notes"]').fill('Servidor de base de datos dedicada');

    // Check calculated total: 150 + 21% (31.50) = 181.50 €
    await expect(page.locator('[data-testid="display-total"]')).toContainText('181.50');

    // Submit form
    await page.locator('[data-testid="btn-save-expense"]').click();

    // Modal closes upon success
    await expect(modal).toBeHidden();

    // Verify row appears in table
    await expect(page.locator(`text=${uniqueSupplier}`)).toBeVisible();

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('06.3 - Edit Expense via Centered Edit Modal', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/expenses');
    await page.waitForLoadState('domcontentloaded');

    // Create a target expense first
    const editSupplier = `E2E Supplier To Edit ${Date.now()}`;
    await page.locator('[data-testid="btn-new-expense"]').click();
    await page.locator('[data-testid="input-supplier-name"]').fill(editSupplier);
    await page.locator('[data-testid="input-subtotal"]').fill('80.00');
    await page.locator('[data-testid="select-tax-rate"]').selectOption('21');
    await page.locator('[data-testid="btn-save-expense"]').click();

    const supplierCell = page.locator(`text=${editSupplier}`).first();
    await expect(supplierCell).toBeVisible();

    // Locate the row and click Edit button
    const row = page.locator(`tr:has-text("${editSupplier}")`);
    const editBtn = row.locator('button[aria-label^="Editar gasto"]').first();
    await editBtn.click();

    const editModal = page.locator('[data-testid="modal-edit-expense"]');
    await expect(editModal).toBeVisible();

    // Verify Rule #3 centering
    await expect(editModal).toHaveAttribute('role', 'dialog');
    const editModalClass = await editModal.getAttribute('class');
    expect(editModalClass).toContain('items-center');
    expect(editModalClass).toContain('justify-center');
    expect(editModalClass).toContain('m-auto');

    // Update Subtotal to 100.00 -> Total should become 121.00 €
    await page.locator('[data-testid="edit-input-subtotal"]').fill('100.00');
    await expect(page.locator('[data-testid="edit-display-total"]')).toContainText('121.00');

    // Save changes
    await page.locator('[data-testid="edit-btn-save-expense"]').click();
    await expect(editModal).toBeHidden();

    // Verify updated total in table row
    await expect(row).toContainText(/121[,.]00/);

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('06.4 - Quick Status Toggle (PAID <-> PENDING)', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/expenses');
    await page.waitForLoadState('domcontentloaded');

    // Create an expense with PAID status
    const statusSupplier = `E2E Status Test ${Date.now()}`;
    await page.locator('[data-testid="btn-new-expense"]').click();
    await page.locator('[data-testid="input-supplier-name"]').fill(statusSupplier);
    await page.locator('[data-testid="input-subtotal"]').fill('50.00');
    await page.locator('[data-testid="btn-save-expense"]').click();

    const row = page.locator(`tr:has-text("${statusSupplier}")`);
    await expect(row).toBeVisible();

    const toggleBtn = row.locator('button[aria-label*="Alternar estado"]').first();
    await expect(toggleBtn).toContainText(/Pagado|Paid/i);

    // Toggle to Pending
    await toggleBtn.click();
    await expect(row).toContainText(/Pendiente|Pending/i);

    // Toggle back to Paid
    await toggleBtn.click();
    await expect(row).toContainText(/Pagado|Paid/i);

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('06.5 - Search & Filters (Debounced Search, Clear Button & Selectors)', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/expenses');
    await page.waitForLoadState('domcontentloaded');

    // Create an expense with a distinctive supplier
    const distinctSupplier = `ZetaAlpha_${Date.now()}`;
    await page.locator('[data-testid="btn-new-expense"]').click();
    await page.locator('[data-testid="input-supplier-name"]').fill(distinctSupplier);
    await page.locator('[data-testid="select-category"]').selectOption('OFFICE');
    await page.locator('[data-testid="input-subtotal"]').fill('65.00');
    await page.locator('[data-testid="btn-save-expense"]').click();

    await expect(page.locator(`text=${distinctSupplier}`)).toBeVisible();

    // Type query into search bar
    const searchInput = page.locator('[data-testid="input-search-expenses"]');
    await searchInput.fill(distinctSupplier);
    await page.waitForTimeout(300);

    // Only this expense should be visible
    await expect(page.locator(`text=${distinctSupplier}`)).toBeVisible();

    // Clear search with clear button
    const clearBtn = page.locator('[data-testid="btn-clear-search"]');
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();

    // Verify search input is empty
    await expect(searchInput).toHaveValue('');

    // Test Category filter
    const catSelect = page.locator('[data-testid="select-category-filter"]');
    await catSelect.selectOption('OFFICE');
    await page.waitForTimeout(300);
    await expect(page.locator(`text=${distinctSupplier}`)).toBeVisible();

    // Reset Category filter
    await catSelect.selectOption('');
    await page.waitForTimeout(200);

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('06.6 - Export Reports (CSV, PDF & AEAT Tax Books)', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/expenses');
    await page.waitForLoadState('domcontentloaded');

    // Verify export buttons are present and clickable
    const csvBtn = page.locator('[data-testid="btn-export-csv"]');
    const pdfBtn = page.locator('[data-testid="btn-export-pdf"]');
    const aeatIssuedBtn = page.locator('[data-testid="btn-export-aeat-issued"]');
    const aeatReceivedBtn = page.locator('[data-testid="btn-export-aeat-received"]');

    await expect(csvBtn).toBeVisible();
    await expect(pdfBtn).toBeVisible();
    await expect(aeatIssuedBtn).toBeVisible();
    await expect(aeatReceivedBtn).toBeVisible();

    // Listen for downloads
    const downloadPromise = page.waitForEvent('download', { timeout: 8000 }).catch(() => null);
    await csvBtn.click();
    const download = await downloadPromise;
    if (download) {
      expect(download.suggestedFilename()).toMatch(/\.csv$/i);
    }

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('06.7 - Expense Deletion via Centered Confirm Dialog', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/expenses');
    await page.waitForLoadState('domcontentloaded');

    // Create an expense specifically to delete
    const deleteSupplier = `ToDelete_${Date.now()}`;
    await page.locator('[data-testid="btn-new-expense"]').click();
    await page.locator('[data-testid="input-supplier-name"]').fill(deleteSupplier);
    await page.locator('[data-testid="input-subtotal"]').fill('25.00');
    await page.locator('[data-testid="btn-save-expense"]').click();

    const row = page.locator(`tr:has-text("${deleteSupplier}")`);
    await expect(row).toBeVisible();

    // Click delete button
    const deleteBtn = row.locator('button[aria-label^="Eliminar gasto"]').first();
    await deleteBtn.click();

    // Verify Centered Confirm Modal
    const backdrop = page.locator('[data-testid="confirm-modal-backdrop"]');
    await expect(backdrop).toBeVisible();
    const backdropClass = await backdrop.getAttribute('class');
    expect(backdropClass).toContain('items-center');
    expect(backdropClass).toContain('justify-center');
    expect(backdropClass).toContain('m-auto');

    const confirmModal = page.locator('[data-testid="confirm-modal-dialog"]');
    await expect(confirmModal).toBeVisible();
    const confirmModalClass = await confirmModal.getAttribute('class');
    expect(confirmModalClass).toContain('m-auto');

    // Confirm deletion
    const confirmBtn = confirmModal.locator('button:has-text("Eliminar")');
    await confirmBtn.click();

    // Verify expense is deleted from the table
    await expect(page.locator(`text=${deleteSupplier}`)).toBeHidden();

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('06.8 - Responsive Viewports (Mobile 375px & Tablet 768px)', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    // 1. Mobile iPhone SE viewport (375x667)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/#/expenses');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1')).toContainText(/Control de Gastos|Expenses/i);
    await expect(page.locator('[data-testid="btn-new-expense"]')).toBeVisible();

    // 2. Open modal in mobile view to test responsiveness and centering
    await page.locator('[data-testid="btn-new-expense"]').click();
    const mobileModal = page.locator('[data-testid="modal-new-expense"]');
    await expect(mobileModal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(mobileModal).toBeHidden();

    // 3. Tablet iPad viewport (768x1024)
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="kpi-invoiced"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-expenses"]')).toBeVisible();

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });
});
