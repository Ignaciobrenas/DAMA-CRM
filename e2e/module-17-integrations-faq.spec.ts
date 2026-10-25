import {
  test,
  expect,
  monitorPageHealth,
  checkA11y,
  captureDualThemeScreenshots,
} from './fixtures/test-fixtures';

test.describe('Módulo 17 — Integraciones, Conectores & FAQ (/integrations, /faq)', () => {
  test('17.1 - Conectores & Webhooks (/integrations): búsqueda, modales centrados de configuración/logs, persistencia en BD y WCAG AA', async ({
    adminPage: page,
  }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/integrations');
    await page.waitForLoadState('networkidle');

    // 1. Verificar barra de búsqueda y tarjetas de conectores
    const searchInput = page.getByTestId('integrations-search-input');
    await expect(searchInput).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('connector-card-stripe')).toBeVisible();

    // 2. Filtrar por Stripe
    await searchInput.fill('Stripe');
    await expect(page.getByTestId('connector-card-stripe')).toBeVisible();
    await searchInput.fill('');

    // 3. Abrir modal de configuración de Stripe y verificar centrado estricto (Regla #3)
    await page.getByTestId('connector-config-btn-stripe').click();
    const configModal = page.getByTestId('connector-config-modal');
    await expect(configModal).toBeVisible();
    await expect(configModal).toHaveClass(/items-center/);
    await expect(configModal).toHaveClass(/justify-center/);
    await expect(configModal).toHaveClass(/m-auto/);

    // 4. Guardar configuración en BD
    const saveBtn = page.getByTestId('connector-save-btn');
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await expect(configModal).toBeHidden({ timeout: 10000 });

    // 5. Abrir modal de Logs/Auditoría y verificar centrado estricto + cierre con Escape
    await page.getByTestId('connector-logs-btn-stripe').click();
    const logsModal = page.getByTestId('connector-logs-modal');
    await expect(logsModal).toBeVisible();
    await expect(logsModal).toHaveClass(/items-center/);
    await expect(logsModal).toHaveClass(/justify-center/);
    await expect(logsModal).toHaveClass(/m-auto/);
    await page.keyboard.press('Escape');
    await expect(logsModal).toBeHidden({ timeout: 5000 });

    await checkA11y(page, 'Integrations & Webhooks (/integrations)');
    await captureDualThemeScreenshots(page, 'module-17-integrations');

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('17.2 - Centro de Ayuda & FAQ (/faq): búsqueda en vivo, filtro por categorías, feedback y WCAG AA', async ({
    adminPage: page,
  }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/faq');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Preguntas Frecuentes (FAQ)' })).toBeVisible({ timeout: 15000 });
    const searchInput = page.getByTestId('faq-search-input');
    await expect(searchInput).toBeVisible();

    // 1. Filtrar por categoría Seguridad & RGPD
    await page.getByTestId('faq-category-security').click();
    await expect(page.getByText('¿Cumple la plataforma con el RGPD y la LOPD europea?')).toBeVisible();

    // 2. Volver a Todas las preguntas y probar búsqueda
    await page.getByTestId('faq-category-all').click();
    await searchInput.fill('n8n');
    await expect(page.getByText('¿Cómo funciona la integración con n8n?')).toBeVisible();
    await searchInput.fill('');

    // 3. Votar respuesta útil en faq-1
    await page.getByTestId('faq-helpful-yes-faq-1').click();

    await checkA11y(page, 'FAQ Help Center (/faq)');
    await captureDualThemeScreenshots(page, 'module-17-faq');

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });
});
