import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();

const GESTOR_EMAIL = process.env.VITE_TEST_MANAGER_EMAIL || process.env.TEST_MANAGER_EMAIL || process.env.VITE_TEST_ADMIN_EMAIL || process.env.TEST_ADMIN_EMAIL || '';
const GESTOR_PASSWORD = process.env.VITE_TEST_MANAGER_PASSWORD || process.env.TEST_MANAGER_PASSWORD || process.env.VITE_TEST_ADMIN_PASSWORD || process.env.TEST_ADMIN_PASSWORD || '';

test.describe('Tests Panel Rol Gestor Diario', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).isPlaywright = true;
    });

    test.skip(!GESTOR_EMAIL || !GESTOR_PASSWORD, 'Credenciales TEST_MANAGER_EMAIL no provistas');

    // Login directo en /login
    await page.goto('/login');
    await page.getByLabel(/correo electrónico/i).fill(GESTOR_EMAIL);
    await page.getByLabel(/contraseña/i).fill(GESTOR_PASSWORD);
    await page.getByRole('button', { name: /entrar|iniciar/i }).click();

    // Esperar redirección a /gestion tras login exitoso
    await page.waitForURL('**/gestion**', { timeout: 15000 });
  });

  test('Validar el Dashboard principal de estadísticas', async ({ page }) => {
    // Ya estamos en /gestion tras el beforeEach — no re-navegar (evita reload)
    // El Dashboard renderiza un div con texto "Dashboard"
    await expect(page.getByText('Dashboard').first()).toBeVisible({ timeout: 12000 });

    const overviewContainer = page.locator('table, .recharts-wrapper, [class*="metric"]').first();
    if (await overviewContainer.isVisible({ timeout: 5000 })) {
      await overviewContainer.hover();
    }
  });

  test('Calendario Multipantalla Carga Correctamente', async ({ page }) => {
    await page.goto('/gestion/calendario');
    await page.waitForURL('**/gestion/calendario**', { timeout: 15000 });

    // El calendario tiene un botón "Hoy" para navegar al día actual
    await expect(page.getByRole('button', { name: 'Hoy' })).toBeVisible({ timeout: 12000 });

    // El select de alojamientos confirma que la página cargó completamente
    const aptSelect = page.locator('select').first();
    if (await aptSelect.isVisible({ timeout: 5000 })) {
      await aptSelect.hover();
    }
  });

});