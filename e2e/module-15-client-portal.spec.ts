import {
  test,
  expect,
  monitorPageHealth,
  checkA11y,
  captureDualThemeScreenshots,
} from './fixtures/test-fixtures';

test.describe('Módulo 15 — Portal de Clientes (Self-Service)', () => {
  test('Portal de Clientes: selector de empresa, facturas, creación de ticket en BD, RGPD y WCAG AA', async ({
    adminPage: page,
  }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/portal');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Área Privada de Clientes')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('portal-company-logo')).toBeVisible();
    await expect(page.getByTestId('portal-company-select')).toBeVisible();

    // 1. Verificar pestaña de Facturas
    const invoicesTab = page.getByTestId('portal-tab-invoices');
    await expect(invoicesTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Mis Facturas Disponibles')).toBeVisible({ timeout: 10000 });

    // 2. Cambiar a pestaña de Tickets de Soporte y crear un ticket real en BD
    const ticketsTab = page.getByTestId('portal-tab-tickets');
    await ticketsTab.click();
    await expect(ticketsTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Abrir Nueva Incidencia de Soporte Técnico')).toBeVisible();

    const uniqueSubject = `Incidencia E2E Portal ${Date.now()}`;
    await page.getByTestId('portal-ticket-subject').fill(uniqueSubject);
    await page.getByTestId('portal-ticket-priority').selectOption('HIGH');
    await page
      .getByTestId('portal-ticket-message')
      .fill('Consulta de prueba end-to-end verificando persistencia en base de datos desde Portal de Clientes.');

    await page.getByTestId('portal-ticket-submit').click();

    await expect(page.getByTestId('portal-ticket-success')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(uniqueSubject).first()).toBeVisible({ timeout: 10000 });

    // 3. Cambiar a pestaña de Privacidad & RGPD
    const privacyTab = page.getByTestId('portal-tab-privacy');
    await privacyTab.click();
    await expect(privacyTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Tus Derechos de Privacidad & RGPD')).toBeVisible();
    await expect(page.getByTestId('portal-gdpr-export-btn')).toBeVisible();

    // 4. Auditoría de accesibilidad WCAG AA y capturas dual-theme
    await checkA11y(page, 'Portal de Clientes (Self-Service)');
    await captureDualThemeScreenshots(page, 'module-15-client-portal');

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });
});
