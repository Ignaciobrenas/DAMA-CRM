import { test, expect } from '@playwright/test';

test.describe('Role Based Access Control (RBAC) System', () => {
  // Use existing admin credentials or assume session is seeded
  test('Admin can create, assign permissions, and delete a custom role', async ({ page }) => {
    // Navigate to local DAMA-CRM (assuming dev server runs on localhost:5173)
    await page.goto('http://localhost:5173/login');
    
    // Login as God/Admin
    await page.fill('input[type="email"]', 'admin@dama-crm.local');
    await page.fill('input[type="password"]', 'dama123');
    await page.click('button[type="submit"]');

    // Wait for Dashboard to load
    await page.waitForURL('http://localhost:5173/');

    // Navigate to Settings -> Security & RBAC
    await page.goto('http://localhost:5173/settings');
    await page.click('text="Seguridad & 2FA"');

    // Wait for SecuritySettings to mount
    await expect(page.locator('h3', { hasText: 'Matriz de Permisos (RBAC)' })).toBeVisible();

    // 1. Create a Custom Role
    await page.click('button:has-text("Nuevo Rol")');
    await expect(page.locator('h3', { hasText: 'Crear Nuevo Rol' })).toBeVisible();
    
    const roleName = `Test Role Playwright ${Date.now()}`;
    await page.fill('input[placeholder="Ej. Director Comercial"]', roleName);
    await page.fill('input[placeholder="Acceso total a ventas y reportes"]', 'E2E Testing Role');
    await page.click('button:has-text("Crear Rol")');

    // Verify Toast Success
    await expect(page.locator('.Toastify__toast--success')).toBeVisible();

    // 2. Assign Permissions to the new role
    // The newly created role is automatically selected. Let's toggle a permission switch.
    // We will toggle the first available permission toggle.
    const firstToggle = page.locator('tbody tr').first().locator('button[type="button"]').first();
    await firstToggle.click();

    // Save Matrix
    await page.click('button:has-text("Guardar Matriz")');
    await expect(page.locator('.Toastify__toast--success')).toBeVisible();

    // 3. Delete the role
    // Click "Eliminar" button (which is visible because it's not a System Role)
    // To handle window.confirm gracefully:
    page.on('dialog', dialog => dialog.accept());
    
    await page.click('button:has-text("Eliminar")');
    
    // Verify it was deleted
    await expect(page.locator('.Toastify__toast--success')).toBeVisible();
  });
});
