import {
  test,
  expect,
  monitorPageHealth,
  checkA11y,
  captureDualThemeScreenshots,
} from './fixtures/test-fixtures';

test.describe('Módulo 19 — Dashboard Ejecutivo & Manejo de Errores (/, /404)', () => {
  test('19.1 - Dashboard Ejecutivo (/): KPIs, selector temporal, reordenación de widgets persistente en BD y WCAG AA', async ({
    adminPage: page,
  }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/');
    await page.waitForLoadState('networkidle');

    // 1. Verificar widgets principales
    await expect(page.getByTestId('dashboard-widget-kpis')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('dashboard-widget-cashflow_forecast')).toBeVisible();
    await expect(page.getByTestId('dashboard-widget-pipeline_chart')).toBeVisible();

    // 2. Cambiar período temporal
    await page.getByTestId('dashboard-timeframe-thisMonth').click();
    await page.getByTestId('dashboard-timeframe-thisQuarter').click();
    await page.getByTestId('dashboard-timeframe-thisYear').click();

    // 3. Reordenar widget en base de datos y luego restablecer diseño
    const moveDownKpis = page.getByTestId('dashboard-widget-down-kpis');
    if (await moveDownKpis.isEnabled()) {
      await moveDownKpis.click();
    }
    await page.getByTestId('dashboard-reset-widgets').click();

    await checkA11y(page, 'Executive Dashboard (/)');
    await captureDualThemeScreenshots(page, 'module-19-dashboard');

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('19.2 - Manejo de Errores & Ruta 404 (/ruta-inexistente-404): pantalla 404 corporativa, retorno a base y WCAG AA', async ({
    adminPage: page,
  }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/ruta-inexistente-404');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('notfound-page')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('notfound-code')).toHaveText('404');
    await expect(page.getByTestId('notfound-back-btn')).toBeVisible();

    await checkA11y(page, 'NotFound 404 Screen');
    await captureDualThemeScreenshots(page, 'module-19-notfound-404');

    // Volver al Dashboard
    await page.getByTestId('notfound-back-btn').click();
    await expect(page.getByTestId('dashboard-widget-kpis')).toBeVisible({ timeout: 15000 });

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });
});
