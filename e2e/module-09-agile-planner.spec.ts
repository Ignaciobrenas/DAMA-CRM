import { test, expect, checkA11y, captureDualThemeScreenshots, monitorPageHealth } from './fixtures/test-fixtures';

test.describe('Module 09: Planificador Ágil, Tableros Kanban, Sprints Scrum, Notas, Releases & Plantillas (/agile) E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'dama_cookie_consent',
        JSON.stringify({ technical: true, analytics: true, timestamp: new Date().toISOString() })
      );
    });
  });

  test('09.1 - Agile Planner Dashboard, KPI Strip, Kanban Columns, Filters & a11y', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/agile');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('[data-testid="agile-kpi-strip"]')).toBeVisible();
    await expect(page.locator('[data-testid="kanban-col-TODO"]')).toBeVisible();
    await expect(page.locator('[data-testid="kanban-col-IN_PROGRESS"]')).toBeVisible();
    await expect(page.locator('[data-testid="kanban-col-REVIEW"]')).toBeVisible();
    await expect(page.locator('[data-testid="kanban-col-DONE"]')).toBeVisible();

    await captureDualThemeScreenshots(page, 'mod-09-agile-planner');
    await checkA11y(page, 'agile-planner-dashboard');

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('09.2 - Create Project & Create Task in Centered Modals with Database Persistence', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/agile');
    await page.waitForLoadState('domcontentloaded');

    // Open New Project Modal
    await page.click('[data-testid="btn-new-project"]');
    const projModal = page.locator('div[role="dialog"]').first();
    await expect(projModal).toBeVisible();
    expect(await projModal.getAttribute('class')).toContain('m-auto');

    const projName = `Proyecto Enterprise E2E ${Date.now().toString().slice(-4)}`;
    await page.fill('[data-testid="input-project-name"]', projName);
    await page.click('[data-testid="btn-submit-project"]');
    await expect(projModal).not.toBeVisible({ timeout: 10000 });

    // Open New Task Modal
    await page.click('[data-testid="btn-new-task"]');
    const taskModal = page.locator('div[role="dialog"]').first();
    await expect(taskModal).toBeVisible();
    expect(await taskModal.getAttribute('class')).toContain('m-auto');

    const taskName = `Tarea Automatizada E2E ${Date.now().toString().slice(-4)}`;
    await page.fill('[data-testid="input-task-title"]', taskName);
    await page.fill('[data-testid="input-task-desc"]', 'Especificación técnica persistida en PostgreSQL.');
    await page.click('[data-testid="btn-submit-task"]');
    await expect(taskModal).not.toBeVisible({ timeout: 10000 });

    await expect(page.locator('[data-testid="section-agile-board"]')).toContainText(taskName);

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('09.3 - Sprints Scrum, Pinnable Notes, Changelog Releases & Reusable Templates Tabs (Zero Hardcoding)', async ({ adminPage: page }) => {
    const health = monitorPageHealth(page);

    await page.goto('/#/agile');
    await page.waitForLoadState('domcontentloaded');

    // 1. Sprints Tab & Create Sprint Modal
    await page.click('[data-testid="tab-agile-sprints"]');
    await expect(page.locator('[data-testid="section-agile-sprints"]')).toBeVisible();
    await page.click('[data-testid="btn-new-sprint"]');
    const sprintModal = page.locator('div[role="dialog"]').first();
    await expect(sprintModal).toBeVisible();
    expect(await sprintModal.getAttribute('class')).toContain('m-auto');
    await page.fill('[data-testid="input-sprint-name"]', 'Sprint E2E Verificación');
    await page.click('[data-testid="btn-submit-sprint"]');
    await expect(sprintModal).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="section-agile-sprints"]')).toContainText('Sprint E2E Verificación');

    // 2. Reminders & Notes Tab
    await page.click('[data-testid="tab-agile-reminders"]');
    await expect(page.locator('[data-testid="section-agile-reminders"]')).toBeVisible();

    // 3. Releases Tab
    await page.click('[data-testid="tab-agile-releases"]');
    await expect(page.locator('[data-testid="section-agile-releases"]')).toBeVisible();

    // 4. Templates Tab & Use Template in New Task Modal
    await page.click('[data-testid="tab-agile-templates"]');
    await expect(page.locator('[data-testid="section-agile-templates"]')).toBeVisible();
    const useTplBtn = page.locator('button[data-testid^="btn-use-template-"]').first();
    await expect(useTplBtn).toBeVisible();
    await useTplBtn.click();

    const taskFromTplModal = page.locator('div[role="dialog"]').first();
    await expect(taskFromTplModal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(taskFromTplModal).not.toBeVisible();

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });
});
