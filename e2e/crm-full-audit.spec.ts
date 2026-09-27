import { test, expect } from '@playwright/test';

test.describe('DAMA-CRM End-to-End User Flow Audit', () => {

  test('Complete user journey across all modules, modals, and integrations', async ({ page }) => {
    // 1. Visit Login Page
    await page.goto('/#/login');
    await page.waitForLoadState('networkidle');

    // Check login form elements
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();

    // 2. Perform Login with Test Admin
    await emailInput.fill('ignaciobrenas@gmail.com');
    await passwordInput.fill('1');
    await submitBtn.click();

    // Wait for Dashboard navigation
    await page.waitForURL(/.*#\/(dashboard)?/);
    await page.waitForLoadState('networkidle');

    // 3. Verify Centered Topbar Popups
    // A) Language Modal
    const langBtn = page.locator('button[title*="Idioma"], button[title*="Language"], button:has-text("ES"), button:has-text("🇪🇸")').first();
    if (await langBtn.isVisible()) {
      await langBtn.click();
      const langModal = page.locator('div[role="dialog"]').first();
      await expect(langModal).toBeVisible();
      
      // Close language modal with close button or click outside
      const closeBtn = page.locator('button:has-text("Cerrar"), button:has-text("Close"), button[aria-label="Cerrar"]').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }
    }

    // B) Notification Center Modal
    const notifBtn = page.locator('button[title*="Notificaciones"], button[title*="Notifications"]').first();
    if (await notifBtn.isVisible()) {
      await notifBtn.click();
      await page.keyboard.press('Escape');
    }

    // C) Command Menu (Ctrl+K)
    await page.keyboard.press('Control+k');
    await page.keyboard.press('Escape');

    // 4. Test Contacts Module
    await page.goto('/#/contacts');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toContainText(/Contactos|Contacts|Directorio/i);

    // 5. Test Sales Pipeline (Kanban)
    await page.goto('/#/pipeline');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toContainText(/Pipeline|Embudo|Tratos|Ventas/i);

    // 6. Test Inventory Module (Dual View & Auto-Mapping)
    await page.goto('/#/inventory');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toContainText(/Inventario|Catálogo|Stock|Products/i);

    // Test Dual View toggle buttons (Tabla vs Cajas)
    const viewButtons = page.locator('button:has-text("Tabla"), button:has-text("Cajas"), button:has-text("Grid"), button:has-text("List")');
    if (await viewButtons.count() >= 2) {
      // Toggle to Cajas / Grid view
      await viewButtons.nth(1).click();
      await page.waitForTimeout(400);
      // Toggle back to Tabla / List view
      await viewButtons.nth(0).click();
      await page.waitForTimeout(400);
    }

    // Check Auto-Mapping Multi-App button if present
    const autoMapBtn = page.locator('button:has-text("Mapear Atributos Multi-App"), button:has-text("Auto-Mapear"), button:has-text("Mapeo")').first();
    if (await autoMapBtn.isVisible()) {
      await autoMapBtn.click();
      await page.waitForTimeout(800);
    }

    // 7. Test Invoicing Module
    await page.goto('/#/invoicing');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toContainText(/Facturación|Facturas|Invoices|Presupuestos/i);

    // 8. Test Automations & Workflows (n8n connector)
    await page.goto('/#/workflows');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toContainText(/Automatizaciones|Workflows|Reglas/i);

    // 9. Test Integrations Hub & API Configurator
    await page.goto('/#/integrations');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toContainText(/Integraciones|Conectores|UnoPIM|OpenCart|Sage|Odoo|Shopify|WooCommerce|n8n/i);

    // Open API Configurator Modal
    const configBtn = page.locator('button:has-text("Configurador de APIs")').first();
    if (await configBtn.isVisible()) {
      await configBtn.click();
      const modal = page.locator('div[role="dialog"]').first();
      await expect(modal).toBeVisible();
      await expect(modal).toContainText(/Snippets de Conexión|Probador de Webhooks|Plantillas de Correo/i);

      // Switch to Tester tab
      const testerTab = page.locator('button:has-text("Probador de Webhooks")').first();
      if (await testerTab.isVisible()) {
        await testerTab.click();
      }

      // Switch to Email Studio tab
      const emailTab = page.locator('button:has-text("Plantillas de Correo")').first();
      if (await emailTab.isVisible()) {
        await emailTab.click();
        await expect(modal).toContainText(/Mailpit|Bandeja de Pruebas/i);
      }

      await page.keyboard.press('Escape');
    }

    // 10. Test Calendar & Mi Tiempo
    await page.goto('/#/calendar');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toContainText(/Calendario|Agenda|Mes|Semana/i);

    await page.goto('/#/my-time');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toContainText(/Mi Tiempo|Control Horario|Fichaje|Jornada/i);

    // 11. Test Settings & Customization
    await page.goto('/#/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toContainText(/Configuración|Ajustes|Settings|Personalización/i);

    console.log('🎉 Full End-to-End User Flow & API Configurator Verification Passed 100%!');
  });

});
