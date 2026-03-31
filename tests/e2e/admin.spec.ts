import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();

const ADMIN_EMAIL = process.env.VITE_TEST_ADMIN_EMAIL || process.env.TEST_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.VITE_TEST_ADMIN_PASSWORD || process.env.TEST_ADMIN_PASSWORD || '';

test.describe('Tests Panel Administrador', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).isPlaywright = true;
    });

    test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Credenciales TEST_ADMIN_EMAIL y TEST_ADMIN_PASSWORD no provistas en el .env');

    // Login directo en /login (más fiable que pasar por /admin que redirige)
    await page.goto('/login');
    await page.getByLabel(/correo electrónico/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/contraseña/i).fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /iniciar|entrar/i }).click();

    // Login.tsx siempre redirige a /gestion tras login exitoso
    await page.waitForURL('**/gestion**', { timeout: 15000 });
  });

  test('Accede al Listado de Reservas y navega las páginas', async ({ page }) => {
    await page.goto('/gestion/reservas');
    await page.waitForURL('**/gestion/reservas**', { timeout: 15000 });

    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
    const tableHeader = page.locator('th').first();
    await expect(tableHeader).toBeVisible();
  });

  test('Formulario de Creación de Reserva Manual (Admin)', async ({ page }) => {
    await page.goto('/gestion/reservas');
    await page.waitForURL('**/gestion/reservas**', { timeout: 15000 });

    const newReservationBtn = page.getByRole('button', { name: /nueva|añadir|crear/i }).first();
    if (await newReservationBtn.isVisible({ timeout: 5000 })) {
      await newReservationBtn.click();
      await expect(page.getByLabel(/nombre|huésped/i).first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByLabel(/email|correo/i).first()).toBeVisible({ timeout: 5000 });
      await page.keyboard.press('Escape');
    }
  });

  test('Edición y Visibilidad de un Apartamento', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL('**/admin**', { timeout: 15000 });

    const editBtn = page.getByRole('button', { name: /editar/i }).first();
    if (await editBtn.isVisible({ timeout: 8000 })) {
      await editBtn.click();
      await expect(page.getByLabel(/nombre/i).first()).toBeVisible({ timeout: 5000 });
    }
  });

});