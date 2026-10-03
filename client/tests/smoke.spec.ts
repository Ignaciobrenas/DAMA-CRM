import { test, expect } from '@playwright/test';

const ROUTES = [
  '/',
  '/calendar',
  '/appointments',
  '/my-time',
  '/logistics',
  '/pipeline',
  '/contacts',
  '/companies',
  '/lead-capture',
  '/invoicing',
  '/expenses',
  '/inventory',
  '/agile',
  '/portal-empleado',
  '/tickets',
  '/omnichannel',
  '/workflows',
  '/integrations',
  '/admin-bi',
  '/reports',
  '/settings',
];

test.describe('E2E Smoke Tests - Module Verification', () => {
  // We use beforeAll to login once and preserve state if needed,
  // but for simplicity we will login in a beforeEach so each test is isolated.
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    // We assume the user exists or the seed created it
    await page.fill('input[type="email"]', 'admin@dama-crm.local');
    await page.fill('input[type="password"]', 'dama123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:5173/');
  });

  for (const route of ROUTES) {
    test(`Module ${route} should load successfully without crashing`, async ({ page }) => {
      // Intercept console errors to fail the test if the React component crashes
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          // Ignore 404s for favicon or other non-fatal network errors
          if (!msg.text().includes('favicon') && !msg.text().includes('404')) {
            errors.push(msg.text());
          }
        }
      });

      page.on('pageerror', error => {
        errors.push(error.message);
      });

      // Go to the route via clicking the sidebar or directly navigating
      // Since it's an SPA, direct navigation might trigger a full reload.
      // We'll navigate directly to be faster, but if hash router is used, it would be /#route
      // But App.tsx uses pushState for standard routes if we're not on file://.
      
      const targetUrl = `http://localhost:5173${route}`;
      const response = await page.goto(targetUrl);
      
      // Check that we didn't get a 500 or 404 from the dev server
      if (response) {
        expect(response.status()).toBeLessThan(400);
      }

      // Wait for the route transition
      await page.waitForTimeout(1000); // Wait for potential data fetching animations

      // Verify there are no critical React crashes (like "Uncaught TypeError")
      expect(errors).toEqual([]);

      // Verify the page doesn't show the error boundary
      const isErrorBoundaryVisible = await page.locator('text=Ha ocurrido un error inesperado').isVisible();
      expect(isErrorBoundaryVisible).toBe(false);

      // Verify the page is not completely blank (it should have at least the sidebar)
      const sidebarVisible = await page.locator('nav').isVisible();
      expect(sidebarVisible).toBe(true);
    });
  }
});
