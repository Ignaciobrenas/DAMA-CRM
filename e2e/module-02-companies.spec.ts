import { test, expect, checkA11y, captureDualThemeScreenshots, monitorPageHealth } from './fixtures/test-fixtures';

function generateValidSpanishCif(): string {
  const letter = 'B';
  const digits = Math.floor(1000000 + Math.random() * 9000000).toString();
  let evenSum = 0;
  let oddSum = 0;
  for (let i = 0; i < digits.length; i++) {
    const d = parseInt(digits[i], 10);
    if (i % 2 === 0) {
      const doubled = d * 2;
      oddSum += Math.floor(doubled / 10) + (doubled % 10);
    } else {
      evenSum += d;
    }
  }
  const totalSum = evenSum + oddSum;
  const unitDigit = totalSum % 10;
  const controlDigit = unitDigit === 0 ? 0 : 10 - unitDigit;
  return `${letter}${digits}${controlDigit}`;
}

test.describe('Module 02: CRM Core · Empresas (/companies) E2E', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('dama_cookie_consent', JSON.stringify({ technical: true, analytics: true, timestamp: new Date().toISOString() }));
    });
  });

  test('02.1 - Directory listing, search, industry filter, sorting and a11y', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/companies');
    await page.waitForLoadState('domcontentloaded');

    // 1. Verify Page Title & Subtitle
    await expect(page.locator('h1')).toContainText(/Empresas/i);
    await expect(page.locator('p').first()).toContainText(/Directorio corporativo|cuentas/i);

    // 2. Wait for search input to be visible
    const searchInput = page.locator('input[aria-label="Buscar empresas"]').first();
    await expect(searchInput).toBeVisible();

    // Verify at least one seeded company is displayed
    const cards = page.locator('.grid > div');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    // 3. Test Search filtering by name or city
    await searchInput.fill('Barcelona');
    await page.waitForTimeout(300);
    await expect(page.locator('.grid')).toContainText(/Logística Ibérica/i);

    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(300);

    // 4. Test Industry filter
    const industrySelect = page.locator('select[aria-label="Filtrar por sector"]').first();
    await expect(industrySelect).toBeVisible();
    await industrySelect.selectOption({ label: 'Todos los sectores' });

    // 5. Test Sorting dropdown
    const sortSelect = page.locator('select[aria-label="Ordenar empresas"]').first();
    await expect(sortSelect).toBeVisible();
    await sortSelect.selectOption('NAME_DESC');
    await page.waitForTimeout(200);

    // Capture visual snapshots in dual theme
    await captureDualThemeScreenshots(page, 'mod-02-companies-directory');

    // Run axe accessibility validation
    await checkA11y(page, 'companies-directory');

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('02.2 - Centered Create Modal & Spanish CIF validation', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/companies');
    await page.waitForLoadState('domcontentloaded');

    // Open Create Modal
    const newBtn = page.locator('button[aria-label="Añadir nueva empresa"]').first();
    await expect(newBtn).toBeVisible();
    await newBtn.click();

    // Verify modal is centered with role="dialog"
    const modal = page.locator('div[role="dialog"]').first();
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(/Nueva Empresa/i);

    // Try submitting with invalid CIF format
    const nameInput = modal.locator('input').first();
    await nameInput.fill('Empresa Prueba Test SL');

    const cifInput = modal.locator('input[placeholder="B12345678"]').first();
    await cifInput.fill('12345');

    const submitBtn = modal.locator('button[type="submit"]').first();
    await submitBtn.click();

    // Expect CIF validation error (either inline or form level)
    await expect(modal).toContainText(/CIF\/NIF\/NIE no válido|El NIF \/ CIF/i);

    // Verify modal closes with Escape key
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('02.3 - Create Company (CRUD Happy Path)', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/companies');
    await page.waitForLoadState('domcontentloaded');

    const testCompanyName = `E2E Tech Global ${Date.now()}`;
    const testCif = generateValidSpanishCif();

    // Open Create Modal
    await page.locator('button[aria-label="Añadir nueva empresa"]').first().click();
    const modal = page.locator('div[role="dialog"]').first();
    await expect(modal).toBeVisible();

    // Fill form with valid dynamic CIF
    await modal.locator('input').nth(0).fill(testCompanyName); // Name
    await modal.locator('input[placeholder="B12345678"]').fill(testCif); // Valid unique Spanish CIF
    await modal.locator('input[placeholder*="Software"]').fill('Consultoría TI'); // Sector
    await modal.locator('input[placeholder="Madrid"]').fill('Sevilla'); // City
    await modal.locator('input[placeholder="250000"]').fill('450000'); // Revenue
    await modal.locator('input[placeholder="+34 912 345 678"]').fill('+34 954 112 233'); // Phone
    await modal.locator('input[placeholder="contacto@empresa.com"]').fill('contacto@e2etech.es'); // Email

    // Submit
    await modal.locator('button[type="submit"]').click();
    await expect(modal).not.toBeVisible({ timeout: 8000 });

    // Verify the company appears in the directory
    const searchInput = page.locator('input[aria-label="Buscar empresas"]').first();
    await searchInput.fill(testCompanyName);
    await page.waitForTimeout(300);

    const card = page.locator('.grid > div', { hasText: testCompanyName });
    await expect(card).toBeVisible();
    await expect(card).toContainText('Sevilla');
    await expect(card).toContainText('Consultoría TI');
    await expect(card).toContainText(testCif);

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('02.4 - Edit Company Details', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/companies');
    await page.waitForLoadState('domcontentloaded');

    // Find the first company card
    const firstCard = page.locator('.grid > div').first();
    await expect(firstCard).toBeVisible();

    // Click edit button
    const editBtn = firstCard.locator('button[aria-label*="Editar"]').first();
    await editBtn.click();

    // Verify Edit Modal opens centered
    const modal = page.locator('div[role="dialog"]').first();
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(/Editar Empresa/i);

    // Update city
    const cityInput = modal.locator('input[placeholder="Madrid"]').first();
    if (await cityInput.isVisible()) {
      await cityInput.fill('Valencia Centro');
    }

    // Submit update
    await modal.locator('button[type="submit"]').click();
    await expect(modal).not.toBeVisible({ timeout: 8000 });

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('02.5 - Delete Company Flow with centered confirmation modal', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/companies');
    await page.waitForLoadState('domcontentloaded');

    // Create a temporary company to safely delete
    const tempName = `DeleteMe Corp ${Date.now()}`;
    await page.locator('button[aria-label="Añadir nueva empresa"]').first().click();
    const createModal = page.locator('div[role="dialog"]').first();
    await createModal.locator('input').nth(0).fill(tempName);
    await createModal.locator('button[type="submit"]').click();
    await expect(createModal).not.toBeVisible({ timeout: 8000 });

    // Filter by tempName
    const searchInput = page.locator('input[aria-label="Buscar empresas"]').first();
    await searchInput.fill(tempName);
    await page.waitForTimeout(300);

    const card = page.locator('.grid > div', { hasText: tempName }).first();
    await expect(card).toBeVisible();

    // Click delete button
    const deleteBtn = card.locator('button[aria-label*="Eliminar"]').first();
    await deleteBtn.click();

    // Verify confirmation modal opens centered
    const confirmModal = page.locator('div[role="dialog"]:has-text("Eliminar Empresa")').first();
    await expect(confirmModal).toBeVisible();
    await expect(confirmModal).toContainText(tempName);

    // Confirm deletion
    const confirmDeleteBtn = confirmModal.locator('button:has-text("Eliminar")').first();
    await confirmDeleteBtn.click();
    await expect(confirmModal).not.toBeVisible({ timeout: 8000 });

    // Verify company is deleted (search now shows empty state or card disappears)
    await page.waitForTimeout(400);
    await expect(page.locator(`text="${tempName}"`)).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=No se encontraron empresas')).toBeVisible({ timeout: 5000 });

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('02.6 - Bulk Operations & CSV Export', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/companies');
    await page.waitForLoadState('domcontentloaded');

    // Select first company checkbox
    const firstCheckbox = page.locator('.grid input[type="checkbox"]').first();
    await expect(firstCheckbox).toBeVisible();
    await firstCheckbox.click();

    // Verify floating enterprise toolbar appears
    const bulkToolbar = page.locator('[data-testid="bulk-toolbar"]').first();
    await expect(bulkToolbar).toBeVisible();
    await expect(bulkToolbar).toContainText(/seleccionadas|Exportar CSV/i);

    // Deselect all
    const deselectBtn = bulkToolbar.locator('button:has-text("Deseleccionar")').first();
    await deselectBtn.click();
    await expect(bulkToolbar).not.toBeVisible({ timeout: 5000 });

    // Test Global Export CSV button trigger
    const exportBtn = page.locator('button[aria-label="Exportar todas las empresas a CSV"]').first();
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('02.7 - Responsive Viewport Checks (Mobile 375px & Tablet 768px)', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    // 1. Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/#/companies');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1')).toContainText(/Empresas/i);
    const newBtn = page.locator('button[aria-label="Añadir nueva empresa"]').first();
    await expect(newBtn).toBeVisible();

    const searchInput = page.locator('input[aria-label="Buscar empresas"]').first();
    await expect(searchInput).toBeVisible();

    // 2. Tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(200);
    const cards = page.locator('.grid > div');
    await expect(cards.first()).toBeVisible();

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

});
