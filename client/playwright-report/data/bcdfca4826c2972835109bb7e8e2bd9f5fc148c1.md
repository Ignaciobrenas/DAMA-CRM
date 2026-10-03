# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> E2E Smoke Tests - Module Verification >> Module /tickets should load successfully without crashing
- Location: tests\smoke.spec.ts:40:5

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "http://localhost:5173/" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]: Prueba
      - generic [ref=e10]:
        - combobox "Seleccionar Idioma" [ref=e12] [cursor=pointer]:
          - option "Español" [selected]
          - option "Català"
          - option "English"
          - option "Français"
          - option "Deutsch"
          - option "Italiano"
          - option "Português"
          - option "العربية"
          - option "中文"
          - option "日本語"
          - option "Русский"
        - button "Alternar Tema" [ref=e13] [cursor=pointer]
    - generic [ref=e16]:
      - img "Prueba" [ref=e18]
      - heading "Iniciar Sesión" [level=1] [ref=e19]
      - paragraph [ref=e20]: Plataforma CRM & ERP Modular para PYMES
    - generic [ref=e21]: Demasiados intentos de autenticación. Por seguridad, su IP ha sido restringida por 15 minutos.
    - generic [ref=e25]:
      - button "Continuar con Google" [ref=e26] [cursor=pointer]
      - generic [ref=e33]: o continuar con correo
      - generic [ref=e37]:
        - generic [ref=e38]:
          - generic [ref=e39]: Correo Electrónico
          - textbox "admin@dama-crm.local" [ref=e44]
        - generic [ref=e45]:
          - generic [ref=e46]:
            - generic [ref=e47]: Contraseña
            - button "¿Olvidaste tu contraseña?" [ref=e48] [cursor=pointer]
          - generic [ref=e49]:
            - textbox "••••••••" [ref=e53]: dama123
            - button [ref=e54] [cursor=pointer]
        - button "Iniciar Sesión" [ref=e58] [cursor=pointer]
  - generic [ref=e62]:
    - button "Portal de Clientes B2B" [ref=e63] [cursor=pointer]
    - button "Política de Privacidad & RGPD" [ref=e69] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const ROUTES = [
  4  |   '/',
  5  |   '/calendar',
  6  |   '/appointments',
  7  |   '/my-time',
  8  |   '/logistics',
  9  |   '/pipeline',
  10 |   '/contacts',
  11 |   '/companies',
  12 |   '/lead-capture',
  13 |   '/invoicing',
  14 |   '/expenses',
  15 |   '/inventory',
  16 |   '/agile',
  17 |   '/portal-empleado',
  18 |   '/tickets',
  19 |   '/omnichannel',
  20 |   '/workflows',
  21 |   '/integrations',
  22 |   '/admin-bi',
  23 |   '/reports',
  24 |   '/settings',
  25 | ];
  26 | 
  27 | test.describe('E2E Smoke Tests - Module Verification', () => {
  28 |   // We use beforeAll to login once and preserve state if needed,
  29 |   // but for simplicity we will login in a beforeEach so each test is isolated.
  30 |   test.beforeEach(async ({ page }) => {
  31 |     await page.goto('http://localhost:5173/login');
  32 |     // We assume the user exists or the seed created it
  33 |     await page.fill('input[type="email"]', 'admin@dama-crm.local');
  34 |     await page.fill('input[type="password"]', 'dama123');
  35 |     await page.click('button[type="submit"]');
> 36 |     await page.waitForURL('http://localhost:5173/');
     |                ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  37 |   });
  38 | 
  39 |   for (const route of ROUTES) {
  40 |     test(`Module ${route} should load successfully without crashing`, async ({ page }) => {
  41 |       // Intercept console errors to fail the test if the React component crashes
  42 |       const errors: string[] = [];
  43 |       page.on('console', msg => {
  44 |         if (msg.type() === 'error') {
  45 |           // Ignore 404s for favicon or other non-fatal network errors
  46 |           if (!msg.text().includes('favicon') && !msg.text().includes('404')) {
  47 |             errors.push(msg.text());
  48 |           }
  49 |         }
  50 |       });
  51 | 
  52 |       page.on('pageerror', error => {
  53 |         errors.push(error.message);
  54 |       });
  55 | 
  56 |       // Go to the route via clicking the sidebar or directly navigating
  57 |       // Since it's an SPA, direct navigation might trigger a full reload.
  58 |       // We'll navigate directly to be faster, but if hash router is used, it would be /#route
  59 |       // But App.tsx uses pushState for standard routes if we're not on file://.
  60 |       
  61 |       const targetUrl = `http://localhost:5173${route}`;
  62 |       const response = await page.goto(targetUrl);
  63 |       
  64 |       // Check that we didn't get a 500 or 404 from the dev server
  65 |       if (response) {
  66 |         expect(response.status()).toBeLessThan(400);
  67 |       }
  68 | 
  69 |       // Wait for the route transition
  70 |       await page.waitForTimeout(1000); // Wait for potential data fetching animations
  71 | 
  72 |       // Verify there are no critical React crashes (like "Uncaught TypeError")
  73 |       expect(errors).toEqual([]);
  74 | 
  75 |       // Verify the page doesn't show the error boundary
  76 |       const isErrorBoundaryVisible = await page.locator('text=Ha ocurrido un error inesperado').isVisible();
  77 |       expect(isErrorBoundaryVisible).toBe(false);
  78 | 
  79 |       // Verify the page is not completely blank (it should have at least the sidebar)
  80 |       const sidebarVisible = await page.locator('nav').isVisible();
  81 |       expect(sidebarVisible).toBe(true);
  82 |     });
  83 |   }
  84 | });
  85 | 
```