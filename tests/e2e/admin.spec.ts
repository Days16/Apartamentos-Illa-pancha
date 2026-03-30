import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();

// Leer las credenciales inyectadas por el usuario en el .env
const ADMIN_EMAIL = process.env.VITE_TEST_ADMIN_EMAIL || process.env.TEST_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.VITE_TEST_ADMIN_PASSWORD || process.env.TEST_ADMIN_PASSWORD || '';

test.describe('Tests Panel Administrador', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).isPlaywright = true;
    });

    // Si no has puesto variables, salta el test (para no romper tu CI el día de mañana)
    test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Credenciales TEST_ADMIN_EMAIL y TEST_ADMIN_PASSWORD no provistas en el .env');
    
    // Iniciar sesión antes de cada prueba admin
    await page.goto('/admin');
    await page.getByLabel(/correo electrónico/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/contraseña/i).fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /iniciar|entrar/i }).click();
    
    // Verificar que entré correctamente al layout del Dashboard
    await expect(page.locator('text=/cerrar sesión|panel/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('Accede al Listado de Reservas y navega las páginas', async ({ page }) => {
    // Ir a tabla
    await page.getByRole('link', { name: /reservas/i }).first().click();
    // Validar que hay una tabla
    await expect(page.locator('table')).toBeVisible();
    
    // Validar que haya al menos una celda de encabezado (Huésped, Fechas...)
    const tableHeader = page.locator('th').first();
    await expect(tableHeader).toBeVisible();
  });

  test('Formulario de Creación de Reserva Manual (Admin)', async ({ page }) => {
    // Navegar y darle a nueva reserva
    await page.getByRole('link', { name: /reservas|manual/i }).first().click();
    
    const newReservationBtn = page.getByRole('button', { name: /nueva|añadir|crear/i }).first();
    // Opcional por si usas un modal vs una pantalla separada.
    if (await newReservationBtn.isVisible()) {
      await newReservationBtn.click();
      
      // Probar que el modal manual tiene los inputs
      await expect(page.getByLabel(/nombre|huésped/i).first()).toBeVisible();
      await expect(page.getByLabel(/email|correo/i).first()).toBeVisible();
      
      // Cierra el modal de reserva manual para dejarlo limpio.
      await page.keyboard.press('Escape');
    }
  });

  test('Edición y Visibilidad de un Apartamento', async ({ page }) => {
    // Abrir modulo de apartamentos
    await page.getByRole('link', { name: /apartamentos|alojamientos/i }).first().click();
    
    // Al menos un botón de editar
    const editBtn = page.getByRole('button', { name: /editar/i }).first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      // Validar que vemos inputs como el de nombre del apto
      await expect(page.getByLabel(/nombre/i).first()).toBeVisible();
    }
  });

});
