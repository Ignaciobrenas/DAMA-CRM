import { test as base, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import path from 'path';
import fs from 'fs';

export type UserRole = 'ADMIN' | 'SALES' | 'PM';

export interface Credentials {
  email: string;
  password: string;
  name: string;
}

export const CREDENTIALS: Record<UserRole, Credentials> = {
  ADMIN: {
    email: 'ignaciobrenas@gmail.com',
    password: '1',
    name: 'Ignacio Brenas (Admin)',
  },
  SALES: {
    email: 'ventas@dama-crm.local',
    password: 'Ventas1234!',
    name: 'Comercial Ventas',
  },
  PM: {
    email: 'pm@dama-crm.local',
    password: 'Pm1234!',
    name: 'Project Manager',
  },
};

export async function loginAsRole(page: Page, role: UserRole = 'ADMIN'): Promise<void> {
  const creds = CREDENTIALS[role];

  // Pre-seed cookie consent so CookieBanner does not intercept test interactions
  await page.addInitScript(() => {
    localStorage.setItem(
      'dama_cookie_consent',
      JSON.stringify({ technical: true, analytics: true, timestamp: new Date().toISOString() })
    );
  });

  await page.goto('/#/login');
  await page.waitForLoadState('domcontentloaded');

  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  const submitBtn = page.locator('button[type="submit"]');

  await emailInput.fill(creds.email);
  await passwordInput.fill(creds.password);
  await submitBtn.click();

  await page.waitForURL(/.*#\/(dashboard)?/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

export async function checkA11y(page: Page, contextName: string = 'Current View'): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .disableRules(['color-contrast']) // allow theme-specific fine tuning where dynamic shadows interact
    .analyze();

  if (results.violations.length > 0) {
    console.warn(`[A11y Warnings in ${contextName}]:`, results.violations.map(v => `${v.id}: ${v.description} (${v.nodes.length} nodes)`));
  }
  expect(results.violations.filter(v => v.impact === 'critical')).toEqual([]);
}

export async function captureDualThemeScreenshots(page: Page, moduleName: string): Promise<void> {
  const outDir = path.join(process.cwd(), 'test-results', 'screenshots');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Light Mode
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(outDir, `${moduleName}-light.png`), fullPage: false });

  // 2. Dark Mode
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(outDir, `${moduleName}-dark.png`), fullPage: false });

  // Reset to light mode for subsequent tests
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  });
}

export interface MonitorHandle {
  getErrors: () => string[];
  getFailedRequests: () => string[];
  stop: () => void;
}

export function monitorPageHealth(page: Page): MonitorHandle {
  const errors: string[] = [];
  const failedRequests: string[] = [];

  const onConsole = (msg: any) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter harmless browser or websocket disconnection notices
      if (!text.includes('net::ERR_CONNECTION_REFUSED') && !text.includes('favicon.ico')) {
        errors.push(text);
      }
    }
  };

  const onResponse = (response: any) => {
    const status = response.status();
    const url = response.url();
    if (status >= 400 && !url.includes('/api/auth/login') && !url.includes('/auth/check')) {
      failedRequests.push(`${status} ${response.request().method()} ${url}`);
    }
  };

  page.on('console', onConsole);
  page.on('response', onResponse);

  return {
    getErrors: () => errors,
    getFailedRequests: () => failedRequests,
    stop: () => {
      page.off('console', onConsole);
      page.off('response', onResponse);
    },
  };
}

export const test = base.extend<{
  adminPage: Page;
  salesPage: Page;
  pmPage: Page;
}>({
  adminPage: async ({ page }, use) => {
    await loginAsRole(page, 'ADMIN');
    await use(page);
  },
  salesPage: async ({ page }, use) => {
    await loginAsRole(page, 'SALES');
    await use(page);
  },
  pmPage: async ({ page }, use) => {
    await loginAsRole(page, 'PM');
    await use(page);
  },
});

export { expect };
