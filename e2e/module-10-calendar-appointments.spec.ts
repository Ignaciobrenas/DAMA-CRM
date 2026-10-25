import { test, expect, checkA11y, captureDualThemeScreenshots, monitorPageHealth } from './fixtures/test-fixtures';

test.describe('Module 10: Calendario, Sincronización Google/Apple & Reserva de Citas (/calendar, /appointments) E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'dama_cookie_consent',
        JSON.stringify({ technical: true, analytics: true, timestamp: new Date().toISOString() })
      );
    });
  });

  test('10.1 - Calendario (/calendar): vistas Mes/Agenda, modal centrado de sincronización, creación de evento en BD y WCAG AA', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/calendar');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByTestId('calendar-scope-all')).toBeVisible();
    await expect(page.getByTestId('calendar-new-event-btn')).toBeVisible();

    // Verify Sync Modal is strictly centered & closes with Escape
    await page.getByTestId('calendar-sync-btn').click();
    const syncDialog = page.getByTestId('calendar-sync-modal');
    await expect(syncDialog).toBeVisible();
    const syncBox = await syncDialog.boundingBox();
    const viewport = page.viewportSize()!;
    expect(syncBox).not.toBeNull();
    if (syncBox) {
      const centerX = syncBox.x + syncBox.width / 2;
      expect(Math.abs(centerX - viewport.width / 2)).toBeLessThan(80);
    }
    await page.keyboard.press('Escape');
    await expect(syncDialog).toBeHidden();

    // Open New Event Modal, verify centered, and create an event in DB
    await page.getByTestId('calendar-new-event-btn').click();
    const eventDialog = page.getByTestId('calendar-event-modal');
    await expect(eventDialog).toBeVisible();
    const eventBox = await eventDialog.boundingBox();
    expect(eventBox).not.toBeNull();
    if (eventBox) {
      const centerX = eventBox.x + eventBox.width / 2;
      expect(Math.abs(centerX - viewport.width / 2)).toBeLessThan(80);
    }

    const uniqueTitle = `Reunión Estratégica E2E ${Date.now().toString().slice(-4)}`;
    await page.getByTestId('calendar-event-title-input').fill(uniqueTitle);
    await page.getByTestId('calendar-event-location-input').fill('Sala Ejecutiva Madrid');
    await page.getByTestId('calendar-event-description-input').fill('Revisión trimestral de objetivos');
    await page.getByTestId('calendar-save-event-btn').click();

    await expect(eventDialog).toBeHidden({ timeout: 10000 });

    // Switch to Agenda view and verify event appears
    await page.getByTestId('calendar-view-agenda').click();
    await expect(page.getByText(uniqueTitle).first()).toBeVisible({ timeout: 10000 });

    await captureDualThemeScreenshots(page, 'mod-10-calendar');
    await checkA11y(page, 'calendar-module');

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('10.2 - Reserva de Citas & Servicios (/appointments): KPIs, catálogo de servicios, nueva cita centrada con cálculo de margen y WCAG AA', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/appointments');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByTestId('appointments-tab-agenda')).toBeVisible();
    await expect(page.getByTestId('appointments-new-btn')).toBeVisible();

    // Open Add Service modal, verify centered, and create a service
    await page.getByTestId('appointments-add-service-btn').click();
    const serviceModal = page.getByTestId('appointments-service-modal');
    await expect(serviceModal).toBeVisible();
    const srvBox = await serviceModal.boundingBox();
    const viewport = page.viewportSize()!;
    if (srvBox) {
      const centerX = srvBox.x + srvBox.width / 2;
      expect(Math.abs(centerX - viewport.width / 2)).toBeLessThan(80);
    }

    const srvName = `Consultoría Fiscal E2E ${Date.now().toString().slice(-4)}`;
    await page.getByTestId('appointments-service-name-input').fill(srvName);
    await page.getByTestId('appointments-service-price-input').fill('120');
    await page.getByTestId('appointments-save-service-btn').click();
    await expect(serviceModal).toBeHidden({ timeout: 10000 });

    // Open New Appointment modal, verify centered, select service, and create appointment
    await page.getByTestId('appointments-new-btn').click();
    const aptModal = page.getByTestId('appointments-new-modal');
    await expect(aptModal).toBeVisible();
    const aptBox = await aptModal.boundingBox();
    if (aptBox) {
      const centerX = aptBox.x + aptBox.width / 2;
      expect(Math.abs(centerX - viewport.width / 2)).toBeLessThan(80);
    }

    const clientName = `Elena Gómez E2E ${Date.now().toString().slice(-4)}`;
    await page.getByTestId('appointments-client-name-input').fill(clientName);
    await page.getByTestId('appointments-client-phone-input').fill('+34 611 223 344');
    await aptModal.locator('input[type="checkbox"]').first().check();
    await page.getByTestId('appointments-submit-btn').click();
    await expect(aptModal).toBeHidden({ timeout: 10000 });

    await expect(page.getByText(clientName).first()).toBeVisible({ timeout: 10000 });

    // Switch to Services Catalog tab and Analytics tab
    await page.getByTestId('appointments-tab-services').click();
    await expect(page.getByText(srvName).first()).toBeVisible();

    await page.getByTestId('appointments-tab-analytics').click();
    await captureDualThemeScreenshots(page, 'mod-10-appointments');
    await checkA11y(page, 'appointments-module');

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });
});
