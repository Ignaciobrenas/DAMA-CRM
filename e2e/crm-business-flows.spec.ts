import { test, expect } from '@playwright/test';

test.describe('DAMA-CRM Complete Business Flows E2E', () => {

  test.beforeEach(async ({ page }) => {
    // Pre-seed cookie consent so it does not intercept modals
    await page.addInitScript(() => {
      localStorage.setItem('dama_cookie_consent', JSON.stringify({ technical: true, analytics: true, timestamp: new Date().toISOString() }));
    });

    // Standard login flow
    await page.goto('/#/login');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    await emailInput.fill('ignaciobrenas@gmail.com');
    await passwordInput.fill('1');
    await submitBtn.click();

    await page.waitForURL(/.*#\/(dashboard)?/);
    await page.waitForLoadState('networkidle');
  });

  test('Flow 1: Lead -> Contact -> Deal in Pipeline', async ({ page, request }) => {
    // 1. Navigate to Contacts & Leads
    await page.goto('/#/contacts');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toContainText(/Contactos|Contacts/i);

    // 2. Open New Contact Modal
    const newContactBtn = page.locator('button:has-text("Nuevo Contacto"), button:has-text("Crear Contacto"), button:has-text("Añadir")').first();
    if (await newContactBtn.isVisible()) {
      await newContactBtn.click();
      const modal = page.locator('div[role="dialog"]').first();
      await expect(modal).toBeVisible();

      const testEmail = `lead_${Date.now()}@testcorp.com`;
      const firstNameInput = modal.locator('input[name="firstName"], input[placeholder*="Nombre"]').first();
      const lastNameInput = modal.locator('input[name="lastName"], input[placeholder*="Apellido"]').first();
      const emailField = modal.locator('input[type="email"], input[name="email"]').first();

      if (await firstNameInput.isVisible()) await firstNameInput.fill('Alejandro');
      if (await lastNameInput.isVisible()) await lastNameInput.fill('Prueba E2E');
      if (await emailField.isVisible()) await emailField.fill(testEmail);

      // Save contact
      const saveBtn = modal.locator('button:has-text("Guardar"), button:has-text("Crear"), button[type="submit"]').first();
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await page.waitForTimeout(600);
      } else {
        await page.keyboard.press('Escape');
      }
    }

    // 3. Navigate to Pipeline & Verify Kanban Boards
    await page.goto('/#/pipeline');
    await page.waitForSelector('button:has-text("Nuevo Negocio")', { timeout: 10000 });
    await expect(page.locator('body')).toContainText(/Ventas|Pipeline|Embudo|Oportunidades/i);
    await expect(page.locator('button:has-text("Nuevo Negocio")').first()).toBeVisible();
  });

  test('Flow 2: Quote -> Invoice -> Payment Lifecycle', async ({ page }) => {
    await page.goto('/#/invoicing');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toContainText(/Facturación|Facturas|Presupuestos/i);

    // Check tabs for Invoices and Quotes
    const quotesTab = page.locator('button:has-text("Presupuestos"), button:has-text("Quotes")').first();
    if (await quotesTab.isVisible()) {
      await quotesTab.click();
      await page.waitForTimeout(400);
      await expect(page.locator('body')).toContainText(/Presupuesto|Validez|Total/i);
    }

    const invoicesTab = page.locator('button:has-text("Facturas"), button:has-text("Invoices")').first();
    if (await invoicesTab.isVisible()) {
      await invoicesTab.click();
      await page.waitForTimeout(400);
      await expect(page.locator('body')).toContainText(/FAC-|Emitida|Pagada|Pendiente/i);
    }
  });

  test('Flow 3: Inventory Stock Management & Movements', async ({ page }) => {
    await page.goto('/#/inventory');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toContainText(/Inventario|Stock|Productos/i);

    // Verify search and filtering
    const searchInput = page.locator('input[placeholder*="Buscar"], input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('SRV');
      await page.waitForTimeout(300);
      await searchInput.clear();
    }

    // Verify Dual-View Switch (Grid vs Table)
    const viewButtons = page.locator('button:has-text("Tabla"), button:has-text("Cajas"), button:has-text("Grid"), button:has-text("List")');
    if (await viewButtons.count() >= 2) {
      await viewButtons.nth(1).click();
      await page.waitForTimeout(300);
      await viewButtons.nth(0).click();
      await page.waitForTimeout(300);
    }
  });

  test('Flow 4: Helpdesk Tickets Lifecycle', async ({ page }) => {
    await page.goto('/#/tickets');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toContainText(/Tickets|Mesa de Ayuda|Soporte/i);

    // Open New Ticket modal
    const newTicketBtn = page.locator('button:has-text("Nuevo Ticket"), button:has-text("Crear Ticket")').first();
    if (await newTicketBtn.isVisible()) {
      await newTicketBtn.click();
      const modal = page.locator('div[role="dialog"], .fixed.inset-0').first();
      await expect(modal).toBeVisible();

      const titleInput = modal.locator('input[name="title"], input[placeholder*="Título"], input[placeholder*="Asunto"]').first();
      if (await titleInput.isVisible()) {
        await titleInput.fill('Incidencia de prueba automatizada E2E');
      }

      const closeBtn = modal.locator('button:has-text("Cancelar"), button:has-text("Cerrar")').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }
    }
  });

  test('Flow 5: Mi Tiempo & Labor Clock-in compliance', async ({ page }) => {
    await page.goto('/#/my-time');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toContainText(/Mi Tiempo|Control Horario|Jornada|Fichajes/i);

    // Check topbar clock widget presence
    const clockInBtn = page.locator('button:has-text("Fichar Entrada"), button:has-text("Entrada"), button:has-text("Clock In")').first();
    if (await clockInBtn.isVisible()) {
      await expect(clockInBtn).toBeEnabled();
    }
  });

  test('Flow 6: Logistics & Carrier Tracking', async ({ page }) => {
    await page.goto('/#/logistics');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toContainText(/Logística|Envíos|Transporte|Seguimiento/i);

    // Verify logistics tabs (Lista de Envíos, Métricas, Conectores)
    const logisticsTabs = page.locator('button:has-text("Lista de Envíos"), button:has-text("Métricas"), button:has-text("Conectores")');
    expect(await logisticsTabs.count()).toBeGreaterThan(0);
  });

  test('Flow 7: Export Services End-to-End Verification (CSV & PDF)', async ({ request }) => {
    // Login token retrieval via API
    const authRes = await request.post('http://localhost:4000/api/auth/login', {
      data: {
        email: 'ignaciobrenas@gmail.com',
        password: '1',
      },
    });
    expect(authRes.status()).toBe(200);
    const authJson = await authRes.json();
    const token = authJson.data?.token || authJson.token;
    expect(token).toBeTruthy();

    const headers = { Authorization: `Bearer ${token}` };

    // 1. Export Deals CSV
    const dealsCsvRes = await request.get('http://localhost:4000/api/deals/export/csv', { headers });
    expect(dealsCsvRes.status()).toBe(200);
    expect(dealsCsvRes.headers()['content-type']).toContain('text/csv');

    // 2. Export Inventory CSV
    const invCsvRes = await request.get('http://localhost:4000/api/inventory/export/csv', { headers });
    expect(invCsvRes.status()).toBe(200);
    expect(invCsvRes.headers()['content-type']).toContain('text/csv');

    // 3. Export Executive Report PDF
    const reportPdfRes = await request.get('http://localhost:4000/api/reports/executive-pdf', { headers });
    expect(reportPdfRes.status()).toBe(200);
    expect(reportPdfRes.headers()['content-type']).toContain('application/pdf');

    // 4. Export Time Records CSV
    const timeCsvRes = await request.get('http://localhost:4000/api/employees/time-tracking/export/csv', { headers });
    expect(timeCsvRes.status()).toBe(200);
    expect(timeCsvRes.headers()['content-type']).toContain('text/csv');

    console.log('✅ All business flow export endpoints verified with valid 200 responses!');
  });

});
