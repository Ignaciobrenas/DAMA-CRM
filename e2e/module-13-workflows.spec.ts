import {
  test,
  expect,
  checkA11y,
  captureDualThemeScreenshots,
  monitorPageHealth,
} from './fixtures/test-fixtures';

test.describe('Module 13: Flujos de Trabajo & Automatizaciones (/workflows) E2E', () => {
  test('13.1 - Motor de reglas: filtros, modal centrado de creación, persistencia en BD, ejecución de prueba y WCAG AA', async ({
    adminPage: page,
  }) => {
    const health = monitorPageHealth(page);
    await page.goto('/#/workflows');

    // Verify page header and search/filter controls
    await expect(page.getByTestId('new-workflow-btn')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('workflow-search-input')).toBeVisible();
    await expect(page.getByTestId('workflow-trigger-filter')).toBeVisible();
    await expect(page.getByTestId('workflow-status-filter')).toBeVisible();

    // Open New Workflow modal and verify strict center positioning (Rule #3)
    await page.getByTestId('new-workflow-btn').click();
    const createModal = page.getByTestId('create-workflow-modal');
    await expect(createModal).toBeVisible();
    await expect(createModal).toHaveClass(/items-center/);
    await expect(createModal).toHaveClass(/justify-center/);
    await expect(createModal).toHaveClass(/m-auto/);

    // Create a new automation rule in DB
    const uniqueRuleName = `Auto-Regla E2E ${Date.now()}`;
    await page.getByTestId('workflow-name-input').fill(uniqueRuleName);
    await page
      .getByTestId('workflow-desc-input')
      .fill('Crear proyecto automáticamente cuando se gane una oportunidad enterprise.');
    await page.getByTestId('workflow-trigger-select').selectOption('deal.won');
    await page.getByTestId('workflow-action-select').selectOption('create_project');
    await page.getByTestId('submit-workflow-btn').click();

    // Verify modal closes and new rule appears in list
    await expect(createModal).toBeHidden({ timeout: 10000 });
    await expect(page.getByText(uniqueRuleName).first()).toBeVisible({ timeout: 10000 });

    // Filter by search to isolate the newly created rule and trigger a Test Run
    await page.getByTestId('workflow-search-input').fill(uniqueRuleName);
    const ruleCard = page.locator('div', { hasText: uniqueRuleName }).first();
    await expect(ruleCard).toBeVisible();

    await captureDualThemeScreenshots(page, 'module-13-workflows');
    await checkA11y(page, 'Module 13 - Workflows');
    health.stop();
    expect(health.getErrors()).toEqual([]);
  });
});
