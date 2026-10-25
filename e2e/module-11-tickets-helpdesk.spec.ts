import { test, expect, checkA11y, captureDualThemeScreenshots, monitorPageHealth } from './fixtures/test-fixtures';

test.describe('Module 11: Helpdesk, SLA & Sistema de Tickets (/tickets) E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'dama_cookie_consent',
        JSON.stringify({ technical: true, analytics: true, timestamp: new Date().toISOString() })
      );
    });
  });

  test('11.1 - Helpdesk Dashboard, KPIs, Kanban/Table Toggle, Filters & WCAG AA', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/tickets');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByTestId('tickets-kpi-strip')).toBeVisible();
    await expect(page.getByTestId('tickets-search-input')).toBeVisible();
    await expect(page.getByTestId('tickets-status-filter')).toBeVisible();
    await expect(page.getByTestId('tickets-priority-filter')).toBeVisible();
    await expect(page.getByTestId('tickets-category-filter')).toBeVisible();
    await expect(page.getByTestId('tickets-agent-filter')).toBeVisible();

    // Switch between Kanban and Table views
    await page.getByTestId('tickets-view-kanban').click();
    await page.getByTestId('tickets-view-table').click();

    await captureDualThemeScreenshots(page, 'mod-11-tickets-helpdesk');
    await checkA11y(page, 'tickets-helpdesk-dashboard');

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('11.2 - Crear Ticket en BD, Modal de Detalle Estrictamente Centrado, Nota Interna Confidencial y Escape', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/tickets');
    await page.waitForLoadState('domcontentloaded');

    // Open New Ticket Modal and verify it is strictly centered
    await page.getByTestId('tickets-new-btn').click();
    const newModal = page.getByTestId('new-ticket-modal');
    await expect(newModal).toBeVisible();

    const viewport = page.viewportSize()!;
    const newBox = await newModal.boundingBox();
    expect(newBox).not.toBeNull();
    if (newBox) {
      const centerX = newBox.x + newBox.width / 2;
      expect(Math.abs(centerX - viewport.width / 2)).toBeLessThan(80);
    }

    const ticketTitle = `Incidencia VeriFactu API E2E ${Date.now().toString().slice(-4)}`;
    await page.getByTestId('new-ticket-title-input').fill(ticketTitle);
    await page.getByTestId('new-ticket-priority-select').selectOption('HIGH');
    await page.getByTestId('new-ticket-category-select').selectOption('TECHNICAL');
    await page.getByTestId('new-ticket-description-input').fill('El endpoint de encadenamiento requiere validación de certificado.');
    await page.getByTestId('new-ticket-submit-btn').click();

    await expect(newModal).toBeHidden({ timeout: 10000 });
    await expect(page.getByText(ticketTitle).first()).toBeVisible({ timeout: 10000 });

    // Click the created ticket to open the Detail Modal (formerly right drawer, now strictly centered)
    await page.getByText(ticketTitle).first().click();
    const detailModal = page.getByTestId('ticket-detail-modal');
    await expect(detailModal).toBeVisible();

    const detailBox = await detailModal.boundingBox();
    expect(detailBox).not.toBeNull();
    if (detailBox) {
      const centerX = detailBox.x + detailBox.width / 2;
      expect(Math.abs(centerX - viewport.width / 2)).toBeLessThan(80);
    }

    // Post an internal confidential note
    await page.getByTestId('ticket-detail-internal-checkbox').check();
    const noteText = `Nota interna de soporte nivel 2 - ${Date.now().toString().slice(-4)}`;
    await page.getByTestId('ticket-detail-reply-input').fill(noteText);
    await page.getByTestId('ticket-detail-send-btn').click();

    await expect(detailModal.getByText(noteText)).toBeVisible({ timeout: 10000 });

    // Close detail modal with Escape
    await page.keyboard.press('Escape');
    await expect(detailModal).toBeHidden();

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });
});
