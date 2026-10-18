import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('DAMA-CRM Responsive & Design System Visual Audit (Desktop, Tablet, Mobile)', () => {

  const viewports = [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 390, height: 844 },
  ];

  const screens = [
    { name: 'dashboard', route: '/' },
    { name: 'pipeline', route: '/pipeline' },
    { name: 'contacts', route: '/contacts' },
    { name: 'companies', route: '/companies' },
    { name: 'invoicing', route: '/invoicing' },
    { name: 'inventory', route: '/inventory' },
    { name: 'agile', route: '/agile' },
    { name: 'planner', route: '/planner' },
    { name: 'tickets', route: '/tickets' },
    { name: 'my-time', route: '/my-time' },
    { name: 'calendar', route: '/calendar' },
    { name: 'appointments', route: '/appointments' },
    { name: 'logistics', route: '/logistics' },
    { name: 'integrations', route: '/integrations' },
    { name: 'reports', route: '/reports' },
    { name: 'admin-bi', route: '/admin-bi' },
    { name: 'settings', route: '/settings' },
  ];

  for (const vp of viewports) {
    test(`Visual audit on ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // 1. Login
      await page.goto('/#/login');
      await page.waitForLoadState('networkidle');

      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const submitBtn = page.locator('button[type="submit"]');

      await emailInput.fill('ignaciobrenas@gmail.com');
      await passwordInput.fill('1');
      await submitBtn.click();

      await page.waitForURL(/.*#\/(dashboard)?/);
      await page.waitForLoadState('networkidle');

      const screenshotsDir = path.join(process.cwd(), 'docs', 'assets', 'screenshots', vp.name);
      if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
      }

      for (const screen of screens) {
        await page.goto(`/#${screen.route}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(300);

        // Verify no broken horizontal scroll overflow
        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth + 2;
        });
        expect(overflow, `Screen ${screen.name} on ${vp.name} has horizontal scroll overflow!`).toBeFalsy();

        // Capture screenshot
        const screenshotPath = path.join(screenshotsDir, `${screen.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
      }

      console.log(`✅ All ${screens.length} screens verified and captured on ${vp.name} without horizontal overflow!`);
    });
  }

});
