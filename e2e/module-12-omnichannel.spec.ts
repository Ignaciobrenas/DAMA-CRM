import { test, expect, checkA11y, captureDualThemeScreenshots, monitorPageHealth } from './fixtures/test-fixtures';

test.describe('Module 12: Omnicanalidad WhatsApp / Email & Chat Interno de Equipo (/omnichannel) E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'dama_cookie_consent',
        JSON.stringify({ technical: true, analytics: true, timestamp: new Date().toISOString() })
      );
    });
  });

  test('12.1 - Bandeja Unificada WhatsApp & Email: búsqueda de contactos, plantillas rápidas, envío en BD y WCAG AA', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/omnichannel');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByTestId('omnichannel-tab-whatsapp')).toBeVisible();
    await expect(page.getByTestId('omnichannel-contact-search')).toBeVisible();
    await expect(page.getByTestId('omnichannel-message-input')).toBeVisible();

    // Click a canned response template and verify it populates the message input
    await page.getByTestId('omnichannel-canned-0').click();
    const inputVal = await page.getByTestId('omnichannel-message-input').inputValue();
    expect(inputVal.length).toBeGreaterThan(5);

    // Send a unique outbound message persisted in PostgreSQL
    const uniqueMsg = `Confirmación de pedido DAMA E2E ${Date.now().toString().slice(-4)}`;
    await page.getByTestId('omnichannel-message-input').fill(uniqueMsg);
    await page.getByTestId('omnichannel-send-btn').click();

    await expect(page.getByText(uniqueMsg).first()).toBeVisible({ timeout: 10000 });

    await captureDualThemeScreenshots(page, 'mod-12-omnichannel-whatsapp');
    await checkA11y(page, 'omnichannel-whatsapp-view');

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('12.2 - Chat Interno de Equipo: canales por departamento, envío de mensaje corporativo en BD y WCAG AA', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/omnichannel');
    await page.waitForLoadState('domcontentloaded');

    await page.getByTestId('omnichannel-tab-internal').click();
    await expect(page.getByTestId('omnichannel-internal-search')).toBeVisible();
    await expect(page.getByTestId('omnichannel-internal-input')).toBeVisible();

    const internalMsg = `Aviso de despliegue en #general E2E ${Date.now().toString().slice(-4)}`;
    await page.getByTestId('omnichannel-internal-input').fill(internalMsg);
    await page.getByTestId('omnichannel-internal-send-btn').click();

    await expect(page.getByText(internalMsg).first()).toBeVisible({ timeout: 10000 });

    await captureDualThemeScreenshots(page, 'mod-12-omnichannel-internal');
    await checkA11y(page, 'omnichannel-internal-view');

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });
});
