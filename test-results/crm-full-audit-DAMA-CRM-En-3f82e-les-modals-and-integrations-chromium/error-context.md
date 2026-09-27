# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: crm-full-audit.spec.ts >> DAMA-CRM End-to-End User Flow Audit >> Complete user journey across all modules, modals, and integrations
- Location: e2e\crm-full-audit.spec.ts:5:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('div[role="dialog"]').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('div[role="dialog"]').first() with timeout 10000ms
  - waiting for locator('div[role="dialog"]').first()

```

```yaml
- complementary:
  - img "DAMA Cloud Solutions"
  - text: DAMA Cloud Solutions Enterprise CRM
  - navigation:
    - button "Panel Principal":
      - img
      - text: Panel Principal
    - button "Ventas":
      - img
      - text: Ventas
    - button "Planificador Ágil":
      - img
      - text: Planificador Ágil
    - button "Contactos":
      - img
      - text: Contactos
    - button "Empresas":
      - img
      - text: Empresas
    - button "Facturación":
      - img
      - text: Facturación
    - button "Inventario":
      - img
      - text: Inventario
    - button "Automatizaciones":
      - img
      - text: Automatizaciones
    - button "Omnicanal":
      - img
      - text: Omnicanal
    - button "Informes & BI":
      - img
      - text: Informes & BI
    - button "Configuración":
      - img
      - text: Configuración
  - text: v1.2.0-staging Activa
  - button "Minimizar barra lateral":
    - img
- banner:
  - button "Buscar ⌘K":
    - img
    - text: Buscar ⌘K
  - button "Master (Global)":
    - img
    - text: Master (Global)
  - text: 19:36:17
  - button "Fichar Salida":
    - img
  - button "Silenciar sonido":
    - img
  - button "Seleccionar Idioma":
    - img
    - text: es
  - button "Alternar Tema":
    - img
  - button "Guía de Bienvenida":
    - img
  - button "Notificaciones":
    - img
  - button "I Ignacio Breñas ADMIN":
    - text: I Ignacio Breñas
    - img
    - text: ADMIN
- main:
  - heading "Empresas" [level=1]
  - paragraph: Directorio corporativo de cuentas de clientes, proveedores y análisis financiero
  - button "Exportar CSV":
    - img
    - text: Exportar CSV
  - button "Nueva Empresa":
    - img
    - text: Nueva Empresa
  - img
  - textbox "Buscar por razón social, ciudad, sector..."
  - img
  - combobox:
    - option "Todos los sectores" [selected]
    - option "Salud y Farmacia"
    - option "Tecnología & Software"
    - option "Transporte y Distribución"
  - img
  - text: "Ordenar:"
  - combobox:
    - option "Nombre (A - Z)" [selected]
    - option "Nombre (Z - A)"
    - option "Mayor Facturación"
    - option "Menor Facturación"
    - option "Más Contactos"
    - option "Más Oportunidades"
    - option "Más recientes"
  - checkbox "Seleccionar Biomedical Europa"
  - img
  - heading "Biomedical Europa" [level=3]
  - text: Salud y Farmacia
  - button "Editar Empresa":
    - img
  - button "Eliminar Empresa":
    - img
  - img
  - text: Valencia
  - img
  - link "https://biomedicaleurope.org":
    - /url: https://biomedicaleurope.org
  - img
  - text: +34 961 234 567
  - img
  - text: "info@biomedicaleurope.org Contactos:"
  - strong: "1"
  - text: "Deals:"
  - strong: "1"
  - text: 850.000 €
  - checkbox "Seleccionar Innovatech Solutions SL"
  - img
  - heading "Innovatech Solutions SL" [level=3]
  - text: Tecnología & Software
  - button "Editar Empresa":
    - img
  - button "Eliminar Empresa":
    - img
  - img
  - text: Madrid
  - img
  - link "https://innovatech.es":
    - /url: https://innovatech.es
  - img
  - text: +34 912 345 678
  - img
  - text: "contacto@innovatech.es Contactos:"
  - strong: "1"
  - text: "Deals:"
  - strong: "1"
  - text: 1.250.000 €
  - checkbox "Seleccionar Logística Ibérica SA"
  - img
  - heading "Logística Ibérica SA" [level=3]
  - text: Transporte y Distribución
  - button "Editar Empresa":
    - img
  - button "Eliminar Empresa":
    - img
  - img
  - text: Barcelona
  - img
  - link "https://logisticaiberica.com":
    - /url: https://logisticaiberica.com
  - img
  - text: +34 934 567 890
  - img
  - text: "ops@logisticaiberica.com Contactos:"
  - strong: "1"
  - text: "Deals:"
  - strong: "1"
  - text: 4.800.000 €
- contentinfo:
  - text: "© 2026 DAMA Cloud Solutions. Todos los derechos reservados. | Versión en ejecución: v1.6.0-enterprise"
  - button "Preguntas Frecuentes (FAQ)"
  - button "Integraciones de Terceros"
  - button "Políticas de Privacidad & RGPD"
- button "¿Hablamos?":
  - img
  - text: ¿Hablamos?
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('DAMA-CRM End-to-End User Flow Audit', () => {
  4   | 
  5   |   test('Complete user journey across all modules, modals, and integrations', async ({ page }) => {
  6   |     // 1. Visit Login Page
  7   |     await page.goto('/#/login');
  8   |     await page.waitForLoadState('networkidle');
  9   | 
  10  |     // Check login form elements
  11  |     const emailInput = page.locator('input[type="email"]');
  12  |     const passwordInput = page.locator('input[type="password"]');
  13  |     const submitBtn = page.locator('button[type="submit"]');
  14  | 
  15  |     await expect(emailInput).toBeVisible();
  16  |     await expect(passwordInput).toBeVisible();
  17  |     await expect(submitBtn).toBeVisible();
  18  | 
  19  |     // 2. Perform Login with Test Admin
  20  |     await emailInput.fill('ignaciobrenas@gmail.com');
  21  |     await passwordInput.fill('1');
  22  |     await submitBtn.click();
  23  | 
  24  |     // Wait for Dashboard navigation
  25  |     await page.waitForURL(/.*#\/(dashboard)?/);
  26  |     await page.waitForLoadState('networkidle');
  27  | 
  28  |     // 3. Verify Centered Topbar Popups
  29  |     // A) Language Modal
  30  |     const langBtn = page.locator('button[title*="Idioma"], button[title*="Language"], button:has-text("ES"), button:has-text("🇪🇸")').first();
  31  |     if (await langBtn.isVisible()) {
  32  |       await langBtn.click();
  33  |       const langModal = page.locator('div[role="dialog"]').first();
> 34  |       await expect(langModal).toBeVisible();
      |                               ^ Error: expect(locator).toBeVisible() failed
  35  |       
  36  |       // Close language modal with close button or click outside
  37  |       const closeBtn = page.locator('button:has-text("Cerrar"), button:has-text("Close"), button[aria-label="Cerrar"]').first();
  38  |       if (await closeBtn.isVisible()) {
  39  |         await closeBtn.click();
  40  |       } else {
  41  |         await page.keyboard.press('Escape');
  42  |       }
  43  |     }
  44  | 
  45  |     // B) Notification Center Modal
  46  |     const notifBtn = page.locator('button[title*="Notificaciones"], button[title*="Notifications"]').first();
  47  |     if (await notifBtn.isVisible()) {
  48  |       await notifBtn.click();
  49  |       await page.keyboard.press('Escape');
  50  |     }
  51  | 
  52  |     // C) Command Menu (Ctrl+K)
  53  |     await page.keyboard.press('Control+k');
  54  |     await page.keyboard.press('Escape');
  55  | 
  56  |     // 4. Test Contacts Module
  57  |     await page.goto('/#/contacts');
  58  |     await page.waitForLoadState('networkidle');
  59  |     await expect(page.locator('body')).toContainText(/Contactos|Contacts|Directorio/i);
  60  | 
  61  |     // 5. Test Sales Pipeline (Kanban)
  62  |     await page.goto('/#/pipeline');
  63  |     await page.waitForLoadState('networkidle');
  64  |     await expect(page.locator('body')).toContainText(/Pipeline|Embudo|Tratos|Ventas/i);
  65  | 
  66  |     // 6. Test Inventory Module (Dual View & Auto-Mapping)
  67  |     await page.goto('/#/inventory');
  68  |     await page.waitForLoadState('networkidle');
  69  |     await expect(page.locator('body')).toContainText(/Inventario|Catálogo|Stock|Products/i);
  70  | 
  71  |     // Test Dual View toggle buttons (Tabla vs Cajas)
  72  |     const viewButtons = page.locator('button:has-text("Tabla"), button:has-text("Cajas"), button:has-text("Grid"), button:has-text("List")');
  73  |     if (await viewButtons.count() >= 2) {
  74  |       // Toggle to Cajas / Grid view
  75  |       await viewButtons.nth(1).click();
  76  |       await page.waitForTimeout(400);
  77  |       // Toggle back to Tabla / List view
  78  |       await viewButtons.nth(0).click();
  79  |       await page.waitForTimeout(400);
  80  |     }
  81  | 
  82  |     // Check Auto-Mapping Multi-App button if present
  83  |     const autoMapBtn = page.locator('button:has-text("Mapear Atributos Multi-App"), button:has-text("Auto-Mapear"), button:has-text("Mapeo")').first();
  84  |     if (await autoMapBtn.isVisible()) {
  85  |       await autoMapBtn.click();
  86  |       await page.waitForTimeout(800);
  87  |     }
  88  | 
  89  |     // 7. Test Invoicing Module
  90  |     await page.goto('/#/invoicing');
  91  |     await page.waitForLoadState('networkidle');
  92  |     await expect(page.locator('body')).toContainText(/Facturación|Facturas|Invoices|Presupuestos/i);
  93  | 
  94  |     // 8. Test Automations & Workflows (n8n connector)
  95  |     await page.goto('/#/workflows');
  96  |     await page.waitForLoadState('networkidle');
  97  |     await expect(page.locator('body')).toContainText(/Automatizaciones|Workflows|Reglas/i);
  98  | 
  99  |     // 9. Test Integrations Hub & API Configurator
  100 |     await page.goto('/#/integrations');
  101 |     await page.waitForLoadState('networkidle');
  102 |     await expect(page.locator('body')).toContainText(/Integraciones|Conectores|UnoPIM|OpenCart|Sage|Odoo|Shopify|WooCommerce|n8n/i);
  103 | 
  104 |     // Open API Configurator Modal
  105 |     const configBtn = page.locator('button:has-text("Configurador de APIs")').first();
  106 |     if (await configBtn.isVisible()) {
  107 |       await configBtn.click();
  108 |       const modal = page.locator('div[role="dialog"]').first();
  109 |       await expect(modal).toBeVisible();
  110 |       await expect(modal).toContainText(/Snippets de Conexión|Probador de Webhooks|Plantillas de Correo/i);
  111 | 
  112 |       // Switch to Tester tab
  113 |       const testerTab = page.locator('button:has-text("Probador de Webhooks")').first();
  114 |       if (await testerTab.isVisible()) {
  115 |         await testerTab.click();
  116 |       }
  117 | 
  118 |       // Switch to Email Studio tab
  119 |       const emailTab = page.locator('button:has-text("Plantillas de Correo")').first();
  120 |       if (await emailTab.isVisible()) {
  121 |         await emailTab.click();
  122 |         await expect(modal).toContainText(/Mailpit|Bandeja de Pruebas/i);
  123 |       }
  124 | 
  125 |       await page.keyboard.press('Escape');
  126 |     }
  127 | 
  128 |     // 10. Test Calendar & Mi Tiempo
  129 |     await page.goto('/#/calendar');
  130 |     await page.waitForLoadState('networkidle');
  131 |     await expect(page.locator('body')).toContainText(/Calendario|Agenda|Mes|Semana/i);
  132 | 
  133 |     await page.goto('/#/my-time');
  134 |     await page.waitForLoadState('networkidle');
```