import {
  test,
  expect,
  monitorPageHealth,
  checkA11y,
  captureDualThemeScreenshots,
} from './fixtures/test-fixtures';

test.describe('Onboarding Interactivo por Módulo (Primera Visita & Persistencia en BD)', () => {
  test('Muestra automáticamente el onboarding centrado al entrar por primera vez a cada módulo, persiste en BD para no repetirse y permite reabrirlo bajo demanda', async ({
    adminPage: page,
  }) => {
    const health = monitorPageHealth(page);

    // Activar modo de prueba de onboarding automático por primera visita y limpiar historial previo
    await page.evaluate(async () => {
      localStorage.setItem('dama_enable_auto_module_tour_test', 'true');
      localStorage.removeItem('dama_skip_auto_module_tour');
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('dama_completed_module_tours')) {
          localStorage.removeItem(k);
        }
      });
      const token = localStorage.getItem('dama_token');
      if (token) {
        await fetch('/api/users/preferences', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ completedModuleTours: [] }),
        });
      }
    });

    // 1. Entrar por primera vez a Inventario (/inventory) -> Debe aparecer el Onboarding del Módulo 07
    await page.goto('/#/inventory');
    await page.waitForLoadState('networkidle');

    const modal = page.getByTestId('module-onboarding-modal');
    await expect(modal).toBeVisible({ timeout: 10000 });
    await expect(modal).toHaveClass(/items-center/);
    await expect(modal).toHaveClass(/justify-center/);
    await expect(modal).toHaveClass(/m-auto/);
    await expect(page.getByTestId('module-onboarding-title')).toContainText(
      'Inventario Multi-Almacén, Traspasos Sage & Kardex'
    );

    // Verificar accesibilidad WCAG AA del modal de onboarding
    await checkA11y(page, 'Module Onboarding Modal (/inventory)');

    // Avanzar al paso 2 y completar la guía
    await page.getByTestId('module-onboarding-next-btn').click();
    await expect(page.getByTestId('module-onboarding-step-title')).toContainText(
      'Trazabilidad por Lotes FEFO y Libro Mayor Kardex PMP'
    );
    await page.getByTestId('module-onboarding-complete-btn').click();
    await expect(modal).toBeHidden({ timeout: 5000 });

    // 2. Entrar por primera vez a Facturación (/invoicing) -> Debe aparecer automáticamente el Onboarding del Módulo 05
    await page.goto('/#/invoicing');
    await page.waitForLoadState('networkidle');

    await expect(modal).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('module-onboarding-title')).toContainText(
      'Facturación, Presupuestos & Veri*Factu AEAT'
    );
    // Cerrar con Escape
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden({ timeout: 5000 });

    // 3. Volver a Inventario (/inventory) -> Ya fue visitado, NO debe abrirse automáticamente
    await page.goto('/#/inventory');
    await page.waitForLoadState('networkidle');
    await expect(modal).toBeHidden();

    // 4. Reabrir manualmente desde el botón "Guía del Módulo"
    const reopenBtn = page.getByTestId('reopen-module-onboarding-btn');
    await expect(reopenBtn).toBeVisible();
    await reopenBtn.click();
    await expect(modal).toBeVisible();

    await captureDualThemeScreenshots(page, 'module-20-per-module-onboarding');

    await page.getByTestId('module-onboarding-skip-btn').click();
    await expect(modal).toBeHidden();

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });
});
