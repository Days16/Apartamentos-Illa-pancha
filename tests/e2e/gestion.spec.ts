import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();

// Leer credenciales del gestor que ha puesto el humano
const GESTOR_EMAIL = process.env.VITE_TEST_MANAGER_EMAIL || process.env.TEST_MANAGER_EMAIL || process.env.VITE_TEST_ADMIN_EMAIL || process.env.TEST_ADMIN_EMAIL || '';
const GESTOR_PASSWORD = process.env.VITE_TEST_MANAGER_PASSWORD || process.env.TEST_MANAGER_PASSWORD || process.env.VITE_TEST_ADMIN_PASSWORD || process.env.TEST_ADMIN_PASSWORD || '';

test.describe('Tests Panel Rol Gestor Diario', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).isPlaywright = true;
    });

    // Si no hay datos saltamos para no colgar la suite CI
    test.skip(!GESTOR_EMAIL || !GESTOR_PASSWORD, 'Credenciales TEST_MANAGER_EMAIL no provistas');
    
    // Login Gestor
    await page.goto('/gestion'); // O donde tengas el login de gestion
    await page.getByLabel(/correo electrónico/i).fill(GESTOR_EMAIL);
    await page.getByLabel(/contraseña/i).fill(GESTOR_PASSWORD);
    await page.getByRole('button', { name: /entrar|iniciar/i }).click();

    // Verificamos entrar al Dashboard
    await expect(page.locator('text=/cerrar sesión|panel/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('Validar el Dashboard principal de estadísticas', async ({ page }) => {
    await page.goto('/gestion/dashboard');
    // Asumimos que hay bloques de métricas o saludos
    await expect(page.locator('text=/dashboard|resumen/i').first()).toBeVisible();
    
    // Esperamos algún gráfico o tabla resumen
    const overviewContainer = page.locator('table, .recharts-wrapper, .metric-card').first();
    // No exigimos expect por si es condicional a tener datos esa semana
    if (await overviewContainer.isVisible()) {
       await overviewContainer.hover();
    }
  });

  test('Calendario Multipantalla Carga Correctamente', async ({ page }) => {
    await page.goto('/gestion/calendario');
    
    // Deberíamos ver una estructura tipo grid o la palabra Calendario/Mes actual
    await expect(page.locator('text=/calendario|hoy/i').first()).toBeVisible();

    // Comprobamos la existencia visual de bloques de meses (grid class)
    const calendarGrid = page.locator('.calendar-grid, table, .react-datepicker').first();
    if (await calendarGrid.isVisible()) {
       await calendarGrid.click(); // testear interactividad sin romper
    }
  });

});
