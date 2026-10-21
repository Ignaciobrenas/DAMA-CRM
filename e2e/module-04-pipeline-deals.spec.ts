import { test, expect, checkA11y, captureDualThemeScreenshots, monitorPageHealth } from './fixtures/test-fixtures';

test.describe('Module 04: Pipeline de Ventas, Kanban & Deals (/pipeline) E2E', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('dama_cookie_consent', JSON.stringify({ technical: true, analytics: true, timestamp: new Date().toISOString() }));
    });
  });

  test('04.1 - Pipeline Kanban board, KPI summary cards & a11y', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/pipeline');
    await page.waitForLoadState('domcontentloaded');

    // 1. Verify Page Title & Subtitle
    await expect(page.locator('h1')).toContainText(/Pipeline|Ventas/i);

    // 2. Verify Executive KPI Cards
    await expect(page.locator('[data-testid="kpi-total-deals"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-total-value"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-weighted-value"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-won-deals"]')).toBeVisible();

    // 3. Verify Kanban Columns
    const columns = page.locator('[data-testid^="stage-column-"]');
    await expect(columns.first()).toBeVisible({ timeout: 10000 });
    const colCount = await columns.count();
    expect(colCount).toBeGreaterThanOrEqual(3);

    // 4. Capture visual snapshots in dual theme
    await captureDualThemeScreenshots(page, 'mod-04-pipeline-kanban');

    // 5. Run axe accessibility validation on board
    await checkA11y(page, 'pipeline-kanban');

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('04.2 - Multi-filters, presets and search functionality', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/pipeline');
    await page.waitForLoadState('domcontentloaded');

    // Wait for board to load
    await expect(page.locator('[data-testid^="stage-column-"]').first()).toBeVisible();

    // Test Search input
    const searchInput = page.locator('[data-testid="pipeline-search-input"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Contrato');
    await page.waitForTimeout(300);

    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(200);

    // Test Min Value Preset Buttons
    const preset5k = page.locator('[data-testid="preset-filter-5000"]');
    await expect(preset5k).toBeVisible();
    await preset5k.click();
    await page.waitForTimeout(300);

    // Reset to All
    const presetAll = page.locator('[data-testid="preset-filter-0"]');
    await presetAll.click();
    await page.waitForTimeout(200);

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('04.3 - Centered New Deal Modal & Form Validation', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/pipeline');
    await page.waitForLoadState('domcontentloaded');

    // Open Modal
    const createBtn = page.locator('[data-testid="create-deal-button"]');
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    // Verify Modal is centered with m-auto
    const modal = page.locator('div[role="dialog"]').first();
    await expect(modal).toBeVisible();
    const modalClass = await modal.getAttribute('class');
    expect(modalClass).toContain('m-auto');

    // Check empty submit prevention (HTML5 required field on title)
    const titleInput = page.locator('[data-testid="create-deal-title"]');
    await expect(titleInput).toHaveAttribute('required', '');

    // Fill new deal form
    const dealTitle = `Deal Playwright E2E ${Date.now()}`;
    await titleInput.fill(dealTitle);

    const valueInput = page.locator('[data-testid="create-deal-value"]');
    await valueInput.fill('45000');

    // Pick stage
    const stageSelect = page.locator('[data-testid="create-deal-stage"]');
    await expect(stageSelect).toBeVisible();

    // Submit form
    await page.click('[data-testid="submit-create-deal"]');

    // Verify Modal closes and deal card appears on the board
    await expect(modal).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator(`text=${dealTitle}`)).toBeVisible({ timeout: 10000 });

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('04.4 - Deal Detail Modal (RecordDrawer) Centered & Interaction Activity', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/pipeline');
    await page.waitForLoadState('domcontentloaded');

    // Create a specific deal to inspect
    const dealTitle = `Inspect Deal ${Date.now()}`;
    await page.click('[data-testid="create-deal-button"]');
    await page.fill('[data-testid="create-deal-title"]', dealTitle);
    await page.fill('[data-testid="create-deal-value"]', '18000');
    await page.click('[data-testid="submit-create-deal"]');

    // Locate and click the newly created deal card title/header
    const dealCard = page.locator(`div[data-testid^="deal-card-"]:has-text("${dealTitle}")`).first();
    await expect(dealCard).toBeVisible({ timeout: 10000 });
    await dealCard.locator('[data-testid="deal-header-clickable"]').click();

    // Verify RecordDrawer is rendered as a centered modal with m-auto
    const drawerModal = page.locator('div[role="dialog"][aria-labelledby="record-drawer-title"]');
    await expect(drawerModal).toBeVisible();
    const drawerClass = await drawerModal.getAttribute('class');
    expect(drawerClass).toContain('m-auto');

    // Check tabs
    const activitiesTab = drawerModal.locator('button[role="tab"]:has-text("Actividades")');
    await expect(activitiesTab).toBeVisible();

    // Register a test activity
    const registerBtn = drawerModal.locator('button:has-text("Registrar")');
    if (await registerBtn.isVisible()) {
      await registerBtn.click();
      const activityInput = drawerModal.locator('[data-testid="activity-title-input"]');
      await expect(activityInput).toBeVisible({ timeout: 5000 });
      await activityInput.fill('Llamada inicial de cualificación E2E');
      await drawerModal.locator('[data-testid="submit-activity-btn"]').click();
      await expect(drawerModal.locator('text=Llamada inicial de cualificación E2E')).toBeVisible({ timeout: 5000 });
    }

    // Close via Escape key
    await page.keyboard.press('Escape');
    await expect(drawerModal).not.toBeVisible();

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('04.5 - Quick Stage Change & Confetti Celebration on Won', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/pipeline');
    await page.waitForLoadState('domcontentloaded');

    // Create a deal
    const dealTitle = `Win Test Deal ${Date.now()}`;
    await page.click('[data-testid="create-deal-button"]');
    await page.fill('[data-testid="create-deal-title"]', dealTitle);
    await page.fill('[data-testid="create-deal-value"]', '60000');
    await page.click('[data-testid="submit-create-deal"]');

    const card = page.locator(`div[data-testid^="deal-card-"]:has-text("${dealTitle}")`).first();
    await expect(card).toBeVisible({ timeout: 10000 });

    // Find the quick stage selector inside the deal card
    const stageSelect = card.locator('select[aria-label^="Mover etapa"]');
    await expect(stageSelect).toBeVisible();

    // Get all options and select the "Ganada" stage
    const options = await stageSelect.locator('option').allTextContents();
    const wonIndex = options.findIndex((opt) => /ganada|won/i.test(opt));

    if (wonIndex >= 0) {
      const optionValues = await stageSelect.locator('option').evaluateAll((opts: any[]) => opts.map(o => o.value));
      const targetWonId = optionValues[wonIndex];
      await stageSelect.selectOption(targetWonId);

      // Verify success feedback
      await expect(page.locator('text=Negocio Ganado').or(page.locator('text=actualizada correctamente'))).toBeVisible({ timeout: 8000 });
    }

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('04.6 - Edit Deal & Centered Delete Confirmation Dialog', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/pipeline');
    await page.waitForLoadState('domcontentloaded');

    // 1. Create a deal to edit and delete
    const dealTitle = `Deal To EditDelete ${Date.now()}`;
    await page.click('[data-testid="create-deal-button"]');
    await page.fill('[data-testid="create-deal-title"]', dealTitle);
    await page.fill('[data-testid="create-deal-value"]', '12000');
    await page.click('[data-testid="submit-create-deal"]');

    const card = page.locator(`div[data-testid^="deal-card-"]:has-text("${dealTitle}")`).first();
    await expect(card).toBeVisible({ timeout: 10000 });

    // 2. Click Edit button
    const editBtn = card.locator('button[aria-label^="Editar "]');
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Verify Edit Modal is centered with m-auto
    const editModal = page.locator('div[role="dialog"]:has-text("Editar Oportunidad Comercial")');
    await expect(editModal).toBeVisible();
    const editClass = await editModal.getAttribute('class');
    expect(editClass).toContain('m-auto');

    // Update value to 19500
    const valueInput = page.locator('[data-testid="edit-deal-value"]');
    await valueInput.fill('19500');
    await page.click('[data-testid="submit-edit-deal"]');
    await expect(editModal).not.toBeVisible();

    // Verify updated value shows on card
    await page.waitForTimeout(500);
    const updatedCard = page.locator(`div[data-testid^="deal-card-"]:has-text("${dealTitle}")`).first();
    await expect(updatedCard).toContainText(/19\.500|19500/);

    // 3. Click Delete button
    const deleteBtn = updatedCard.locator('button[aria-label^="Eliminar "]');
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // Verify Centered Delete Dialog with m-auto
    const deleteDialog = page.locator('div[role="dialog"][aria-labelledby="delete-deal-title"]');
    await expect(deleteDialog).toBeVisible();
    const deleteClass = await deleteDialog.getAttribute('class');
    expect(deleteClass).toContain('m-auto');

    // Confirm Delete
    await page.click('[data-testid="confirm-delete-deal-btn"]');
    await expect(deleteDialog).not.toBeVisible();

    // Verify deal card is removed
    await expect(page.locator(`div[data-testid^="deal-card-"]:has-text("${dealTitle}")`)).toHaveCount(0, { timeout: 8000 });

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('04.7 - Export CSV and PDF buttons respond cleanly', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/pipeline');
    await page.waitForLoadState('domcontentloaded');

    // Verify export buttons exist and are clickable
    const excelBtn = page.locator('button[aria-label="Exportar Pipeline a Excel"]');
    await expect(excelBtn).toBeVisible();

    const pdfBtn = page.locator('button[aria-label="Descargar Informe PDF de Pipeline"]');
    await expect(pdfBtn).toBeVisible();

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('04.8 - Responsive Viewport Checks (Mobile 375px & Tablet 768px)', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    // 1. Mobile 375px Viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/#/pipeline');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="create-deal-button"]')).toBeVisible();

    // Verify Kanban board has horizontal scroll container
    const kanbanRegion = page.locator('div[role="region"][aria-label="Tablero Kanban de Ventas"]');
    await expect(kanbanRegion).toBeVisible();

    // 2. Tablet 768px Viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    await expect(kanbanRegion).toBeVisible();

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

});
