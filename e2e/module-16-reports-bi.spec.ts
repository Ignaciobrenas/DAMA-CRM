import {
  test,
  expect,
  monitorPageHealth,
  checkA11y,
  captureDualThemeScreenshots,
} from './fixtures/test-fixtures';

test.describe('Módulo 16 — Informes & Business Intelligence (/reports, /admin-bi)', () => {
  test('16.1 - Informes & Analítica (/reports): BI Comercial, Telemetría Admin, Exportación PDF/CSV y WCAG AA', async ({
    adminPage: page,
  }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/reports');
    await page.waitForLoadState('networkidle');

    // 1. Verificar controles principales y KPIs comerciales
    await expect(page.getByTestId('reports-period-30d')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('reports-export-pdf-btn')).toBeVisible();
    await expect(page.getByTestId('reports-export-csv-btn')).toBeVisible();

    // 2. Cambiar período a Trimestre y Año
    await page.getByTestId('reports-period-90d').click();
    await page.getByTestId('reports-period-year').click();

    // 3. Abrir menú de exportación CSV
    await page.getByTestId('reports-export-csv-btn').click();
    await expect(page.getByText('Ventas y Oportunidades').first()).toBeVisible();
    await page.getByTestId('reports-export-csv-btn').click();

    // 4. Cambiar a Telemetría Admin si está disponible
    const telemetryTab = page.getByTestId('reports-tab-telemetry');
    if (await telemetryTab.isVisible()) {
      await telemetryTab.click();
      await expect(page.getByText('Memoria Heap Servidor')).toBeVisible();
      await expect(page.getByText('Entorno de Ejecución & Hardware')).toBeVisible();
      await expect(page.getByText('Volumen Global de Datos en Base de Datos')).toBeVisible();
      await page.getByTestId('reports-tab-commercial').click();
    }

    // 5. Verificar generación de Informe Ejecutivo PDF desde API
    const pdfRes = await page.evaluate(async () => {
      const token = localStorage.getItem('dama_token');
      const res = await fetch('/api/reports/executive-pdf', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { status: res.status, contentType: res.headers.get('content-type') };
    });
    expect(pdfRes.status).toBe(200);
    expect(pdfRes.contentType).toContain('application/pdf');

    await checkA11y(page, 'Reports & Analytics (/reports)');
    await captureDualThemeScreenshots(page, 'module-16-reports');

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('16.2 - Admin Business Intelligence (/admin-bi): KPIs Globales, Salud del Servidor, Auditoría y WCAG AA', async ({
    adminPage: page,
  }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/admin-bi');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('admin-bi-page')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Facturación Global')).toBeVisible();
    await expect(page.getByText('Usuarios Activos')).toBeVisible();
    await expect(page.getByText('Salud del Servidor')).toBeVisible();
    await expect(page.getByText('Últimas Acciones Registradas (Auditoría)')).toBeVisible();

    await checkA11y(page, 'Admin Business Intelligence (/admin-bi)');
    await captureDualThemeScreenshots(page, 'module-16-admin-bi');

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });
});
