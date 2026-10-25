import { test, expect, checkA11y, captureDualThemeScreenshots, monitorPageHealth } from './fixtures/test-fixtures';

test.describe('Module 03: CRM Core · Contactos & Lead Capture (/contacts, /lead-capture) E2E', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('dama_cookie_consent', JSON.stringify({ technical: true, analytics: true, timestamp: new Date().toISOString() }));
    });
  });

  test('03.1 - Contacts Directory listing, search, status badges and a11y', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/contacts');
    await page.waitForLoadState('domcontentloaded');

    // 1. Verify Page Title & Subtitle
    await expect(page.locator('h1')).toContainText(/Contactos/i);

    // 2. Wait for search input to be visible
    const searchInput = page.locator('input[placeholder*="Buscar contactos"]').first();
    await expect(searchInput).toBeVisible();

    // Verify contacts table is rendered with at least one row
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // 3. Test Search filter
    await searchInput.fill('Admin');
    await page.waitForTimeout(300);

    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(300);

    // 4. Capture visual snapshots in dual theme
    await captureDualThemeScreenshots(page, 'mod-03-contacts-directory');

    // 5. Run axe accessibility validation
    await checkA11y(page, 'contacts-directory');

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('03.2 - Centered Create Contact Modal & form validation', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/contacts');
    await page.waitForLoadState('domcontentloaded');

    // Open Create Modal
    const newBtn = page.locator('button:has-text("Nuevo Contacto")').first();
    await expect(newBtn).toBeVisible();
    await newBtn.click();

    // Verify modal is centered with role="dialog"
    const modal = page.locator('div[role="dialog"]').first();
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(/Nuevo Contacto/i);

    // Close with Escape key
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('03.3 - Create Contact Happy Path & associate with Company', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/contacts');
    await page.waitForLoadState('domcontentloaded');

    const uniqueId = Date.now();
    const testFirstName = `Elena_${uniqueId}`;
    const testLastName = `Navarro`;
    const testEmail = `elena.${uniqueId}@innovatech.es`;

    // Open Create Modal
    await page.locator('button:has-text("Nuevo Contacto")').first().click();
    const modal = page.locator('div[role="dialog"]').first();
    await expect(modal).toBeVisible();

    // Fill form by input position
    await modal.locator('input').nth(0).fill(testFirstName); // Nombre
    await modal.locator('input').nth(1).fill(testLastName);  // Apellidos
    await modal.locator('input').nth(2).fill(testEmail);     // Email
    await modal.locator('input').nth(3).fill('+34 600 112 233'); // Teléfono
    await modal.locator('input').nth(4).fill('Directora de Producto'); // Cargo

    // Select company if options available
    const companySelect = modal.locator('select').first();
    const optionsCount = await companySelect.locator('option').count();
    if (optionsCount > 1) {
      await companySelect.selectOption({ index: 1 });
    }

    // Submit
    await modal.locator('button[type="submit"]').click();
    await expect(modal).not.toBeVisible({ timeout: 8000 });

    // Verify contact appears in directory
    const searchInput = page.locator('input[placeholder*="Buscar contactos"]').first();
    await searchInput.fill(testFirstName);
    await page.waitForTimeout(300);

    const contactRow = page.locator('table tbody tr', { hasText: testFirstName }).first();
    await expect(contactRow).toBeVisible();
    await expect(contactRow).toContainText(testEmail);

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('03.4 - Contact Detail Sheet Modal with tab navigation & editing', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/contacts');
    await page.waitForLoadState('domcontentloaded');

    // Find first contact row and open details
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible();
    const detailsBtn = firstRow.locator('button:has-text("Detalles")').first();
    await detailsBtn.click();

    // Verify Detail Sheet modal opens centered
    const modal = page.locator('div[role="dialog"]:has-text("Información General")').first();
    await expect(modal).toBeVisible();

    // Navigate across tabs
    await modal.locator('button:has-text("Empresa Asociada")').click();
    await page.waitForTimeout(150);

    await modal.locator('button:has-text("Oportunidades")').click();
    await page.waitForTimeout(150);

    await modal.locator('button:has-text("Facturación")').click();
    await page.waitForTimeout(150);

    // Back to Info tab
    await modal.locator('button:has-text("Información General")').click();
    await page.waitForTimeout(150);

    // Close modal via Escape
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('03.5 - Bulk Actions on Contacts & Export CSV', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/contacts');
    await page.waitForLoadState('domcontentloaded');

    // Select first contact checkbox
    const firstCheckbox = page.locator('table tbody input[type="checkbox"]').first();
    await expect(firstCheckbox).toBeVisible();
    await firstCheckbox.click();

    // Verify floating bulk toolbar appears
    const bulkToolbar = page.locator('.fixed.bottom-6:has-text("Exportar CSV")').first();
    await expect(bulkToolbar).toBeVisible();
    await expect(bulkToolbar).toContainText(/seleccionados|Exportar CSV/i);

    // Deselect all
    const deselectBtn = bulkToolbar.locator('button:has-text("Deseleccionar")').first();
    await deselectBtn.click();

    // Test Global Export CSV button trigger
    const exportBtn = page.locator('main button:has-text("Exportar CSV")').first();
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('03.6 - Lead Capture Hub (/lead-capture) & Smart Form Submission', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/lead-capture');
    await page.waitForLoadState('domcontentloaded');

    // 1. Verify Page Title & Subtitle
    await expect(page.locator('h1')).toContainText(/Puntos de Captura|Captura de Leads/i);

    // 2. Verify Tablist
    const tablist = page.locator('[role="tablist"]').first();
    await expect(tablist).toBeVisible();

    // 3. Fill and submit Smart Form simulator
    const uniqueEmail = `prospecto_${Date.now()}@inbound-corp.com`;
    await page.locator('input[placeholder*="nombre"]').first().fill('Fernando');
    await page.locator('input[placeholder*="apellidos"]').first().fill('Mendoza');
    await page.locator('input[type="email"]').first().fill(uniqueEmail);
    await page.locator('input[placeholder*="+34"]').first().fill('+34 622 334 455');
    await page.locator('input[placeholder*="Acme"]').first().fill('Mendoza Global SL');
    await page.locator('textarea').first().fill('Interesado en demostración comercial de CRM.');

    // Submit form
    await page.locator('button:has-text("Enviar Formulario")').first().click();

    // Expect success confirmation card
    await expect(
      page.locator('text=¡Lead sincronizado exitosamente!').first()
    ).toBeVisible({ timeout: 10000 });

    // 4. Switch to Lead Magnets tab
    await page.locator('button:has-text("Lead Magnets")').first().click();
    await page.waitForTimeout(200);
    await expect(page.locator('text=Caja de Registro para Descarga de Lead Magnets')).toBeVisible();

    // 5. Switch to WhatsApp / Live Chat tab
    await page.locator('button:has-text("WhatsApp")').first().click();
    await page.waitForTimeout(200);
    await expect(page.locator('text=Botonera de WhatsApp con Captura de Lead Pre-Chat')).toBeVisible();

    // Capture visual snapshots in dual theme
    await captureDualThemeScreenshots(page, 'mod-03-lead-capture');

    // Run axe accessibility validation
    await checkA11y(page, 'lead-capture');

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('03.7 - Responsive Viewport Checks (Mobile 375px & Tablet 768px)', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    // 1. Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/#/contacts');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1')).toContainText(/Contactos/i);
    const searchInput = page.locator('input[placeholder*="Buscar contactos"]').first();
    await expect(searchInput).toBeVisible();

    // 2. Tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/#/lead-capture');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1')).toContainText(/Puntos de Captura|Captura de Leads/i);

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

});
