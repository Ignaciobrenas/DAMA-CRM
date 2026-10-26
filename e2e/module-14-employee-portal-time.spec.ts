import {
  test,
  expect,
  checkA11y,
  captureDualThemeScreenshots,
  monitorPageHealth,
} from './fixtures/test-fixtures';

test.describe('Module 14: Portal del Empleado, RRHH, Nóminas PDF & Mi Tiempo (/employee-portal, /my-time) E2E', () => {
  test('14.1 - Portal del Empleado (/employee-portal): Fichajes, Directorio de Plantilla y Recibos de Nómina en BD + WCAG AA', async ({
    adminPage: page,
  }) => {
    const health = monitorPageHealth(page);
    await page.goto('/#/employee-portal');

    // Verify tabs
    const tabTime = page.getByTestId('employee-portal-tab-time-tracking');
    const tabPayrolls = page.getByTestId('employee-portal-tab-payrolls');
    const tabDirectory = page.getByTestId('employee-portal-tab-directory');

    await expect(tabTime).toBeVisible({ timeout: 15000 });
    await expect(tabPayrolls).toBeVisible();
    await expect(tabDirectory).toBeVisible();

    // 1. Go to Directory Tab and create a new employee in DB
    await tabDirectory.click();
    await expect(page.getByTestId('new-employee-btn')).toBeVisible();
    await page.getByTestId('new-employee-btn').click();

    const empModal = page.getByTestId('new-employee-modal');
    await expect(empModal).toBeVisible();
    await expect(empModal).toHaveClass(/items-center/);
    await expect(empModal).toHaveClass(/justify-center/);
    await expect(empModal).toHaveClass(/m-auto/);

    const uniqueSuffix = Date.now().toString().slice(-5);
    const empName = `Elena RRHH ${uniqueSuffix}`;
    const empEmail = `elena.rrhh.${uniqueSuffix}@dama-crm.local`;

    await page.getByTestId('employee-name-input').fill(empName);
    await page.getByTestId('employee-email-input').fill(empEmail);
    await page.getByTestId('employee-jobtitle-input').fill('Especialista Laboral');
    await page.getByTestId('submit-employee-btn').click();

    await expect(empModal).toBeHidden({ timeout: 10000 });
    await expect(page.getByText(empName).first()).toBeVisible({ timeout: 10000 });

    // 2. Go to Payrolls Tab and issue a new payroll in DB
    await tabPayrolls.click();
    await expect(page.getByTestId('issue-payroll-btn')).toBeVisible();
    await page.getByTestId('issue-payroll-btn').click();

    const payrollModal = page.getByTestId('new-payroll-modal');
    await expect(payrollModal).toBeVisible();
    await expect(payrollModal).toHaveClass(/items-center/);
    await expect(payrollModal).toHaveClass(/justify-center/);
    await expect(payrollModal).toHaveClass(/m-auto/);

    await page.getByTestId('submit-payroll-btn').click();
    await expect(payrollModal).toBeHidden({ timeout: 10000 });

    // Open the official payslip receipt modal and verify centered layout + official DAMA logo
    const firstViewReceiptBtn = page.locator('[data-testid^="view-payroll-"]').first();
    await expect(firstViewReceiptBtn).toBeVisible();
    await firstViewReceiptBtn.click();

    const receiptModal = page.getByTestId('payroll-receipt-modal');
    await expect(receiptModal).toBeVisible();
    await expect(receiptModal).toHaveClass(/items-center/);
    await expect(receiptModal).toHaveClass(/justify-center/);
    await expect(receiptModal).toHaveClass(/m-auto/);
    await expect(receiptModal.locator('img[alt="DAMA Corporate Logo"]').first()).toBeAttached();

    // Close receipt modal via Escape key
    await page.keyboard.press('Escape');
    await expect(receiptModal).toBeHidden();

    await captureDualThemeScreenshots(page, 'module-14-employee-portal');
    await checkA11y(page, 'Module 14 - Employee Portal');
    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('14.2 - Mi Tiempo y Fichajes (/my-time): Control de Jornada, modal centrado de Reportar Horas y WCAG AA', async ({
    adminPage: page,
  }) => {
    const health = monitorPageHealth(page);
    await page.goto('/#/my-time');

    const logHoursBtn = page.getByTestId('mytime-log-hours-btn');
    await expect(logHoursBtn).toBeVisible({ timeout: 15000 });

    await logHoursBtn.click();
    const logModal = page.getByTestId('mytime-log-hours-modal');
    await expect(logModal).toBeVisible();
    await expect(logModal).toHaveClass(/items-center/);
    await expect(logModal).toHaveClass(/justify-center/);
    await expect(logModal).toHaveClass(/m-auto/);

    await page.keyboard.press('Escape');
    await expect(logModal).toBeHidden();

    await captureDualThemeScreenshots(page, 'module-14-my-time');
    await checkA11y(page, 'Module 14 - My Time');
    health.stop();
    expect(health.getErrors()).toEqual([]);
  });

  test('14.3 - Timer Harvest persistente en Topbar: Fichaje, Pausa, Reanudación, Parada y Persistencia ante Recarga', async ({
    adminPage: page,
  }) => {
    const health = monitorPageHealth(page);
    await page.goto('/#/my-time');

    // If currently clocked in from a previous test run, stop it first to start clean
    const existingPill = page.getByTestId('topbar-timer-pill');
    if (await existingPill.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.getByTestId('topbar-timer-stop-btn').click();
      const outModal = page.getByTestId('clock-out-modal');
      await expect(outModal).toBeVisible();
      await page.getByTestId('confirm-clock-out-btn').click();
      await expect(outModal).toBeHidden({ timeout: 5000 });
    }

    // 1. Verify Topbar clock-in button is visible
    const clockInBtn = page.getByTestId('topbar-clock-in-btn');
    await expect(clockInBtn).toBeVisible({ timeout: 10000 });
    await clockInBtn.click();

    // 2. Verify centered Harvest modal
    const modal = page.getByTestId('clock-in-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveClass(/items-center/);
    await expect(modal).toHaveClass(/justify-center/);
    await expect(modal).toHaveClass(/m-auto/);

    // 3. Fill in Harvest details (notes, billable toggle)
    await page.getByTestId('harvest-notes-input').fill('Prueba E2E Harvest Timer Persistente');
    const startBtn = page.getByTestId('confirm-clock-in-btn');
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // 4. Modal closes and Topbar shows live pill
    await expect(modal).toBeHidden({ timeout: 5000 });
    const timerPill = page.getByTestId('topbar-timer-pill');
    await expect(timerPill).toBeVisible({ timeout: 5000 });

    const elapsedDisplay = page.getByTestId('topbar-timer-elapsed');
    await expect(elapsedDisplay).toBeVisible();
    const initialText = await elapsedDisplay.textContent();
    expect(initialText).toMatch(/\d{2}:\d{2}:\d{2}/);

    // 5. Verify timer persistence across page reload (browser close simulation)
    await page.reload();
    await expect(page.getByTestId('topbar-timer-pill')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('topbar-timer-elapsed')).toBeVisible();

    // 6. Test Pause & Resume from topbar
    const pauseResumeBtn = page.getByTestId('topbar-timer-pause-resume-btn');
    await pauseResumeBtn.click();
    await page.waitForTimeout(600);
    await pauseResumeBtn.click();
    await page.waitForTimeout(600);

    // 7. Test Stop / Clock Out
    const stopBtn = page.getByTestId('topbar-timer-stop-btn');
    await stopBtn.click();

    const clockOutModal = page.getByTestId('clock-out-modal');
    await expect(clockOutModal).toBeVisible();
    await expect(clockOutModal).toHaveClass(/items-center/);
    await expect(clockOutModal).toHaveClass(/justify-center/);
    await expect(clockOutModal).toHaveClass(/m-auto/);

    await page.getByTestId('confirm-clock-out-btn').click();
    await expect(clockOutModal).toBeHidden({ timeout: 5000 });

    // Verify returning to not-clocked-in state
    await expect(page.getByTestId('topbar-clock-in-btn')).toBeVisible({ timeout: 5000 });

    health.stop();
    expect(health.getErrors()).toEqual([]);
  });
});
