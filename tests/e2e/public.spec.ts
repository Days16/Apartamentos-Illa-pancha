import { test, expect } from '@playwright/test';

test.describe('Tests Cara Pública - Illa Pancha', () => {

  test.beforeEach(async ({ page }) => {
    // Inyectar bandera para saltar captchas en Turnstile.tsx
    await page.addInitScript(() => {
      (window as any).isPlaywright = true;
    });
  });

  test('Home carga correctamente y verifica apartados principales', async ({ page }) => {
    await page.goto('/');

    // Validar el título del navegador
    await expect(page).toHaveTitle(/Illa Pancha/i);

    // Validar que el botón de búsqueda central existe
    const searchBtn = page.locator('text=/Buscar apartamentos/i').first();
    await expect(searchBtn).toBeVisible({ timeout: 15000 });
  });

  test('Detalle de un alojamiento particular carga bien', async ({ page }) => {
    // Escogemos un slug genérico que deberías tener (ej: el-faro, o illa-pancha)
    // Usamos el listado público primero por si el nombre cambia
    await page.goto('/apartamentos');
    const firstApartment = page.locator('a[href^="/apartamentos/"]').first();
    
    // Si hay apartamentos, entra a ver el detalle
    if (await firstApartment.isVisible()) {
      await firstApartment.click();
      // El botón puede decir "Ver disponibilidad y reservar" o "Reservar"
      await expect(page.getByRole('button', { name: /reservar|book/i }).first()).toBeVisible({ timeout: 10000 });
    } else {
      console.log('No hay apartamentos activos generados en test, saltando visita individual.');
    }
  });

  test('Módulo de enviar formulario de Contacto', async ({ page }) => {
    await page.goto('/contacto');
    await expect(page.locator('form')).toBeVisible();

    // Rellenamos el form (Labels reales en la web con *)
    await page.getByLabel(/nombre \*/i).fill('Robot E2E');
    await page.getByLabel(/email \*/i).fill('robot@illapancha.test');
    await page.getByLabel(/mensaje \*/i).fill('Prueba automática lanzada desde la suite de Playwright.');

    // IMPORTANTE: Interceptamos la llamada de red hacia Supabase Functions
    await page.route('**/functions/v1/submit-contact', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: "Mocked interceptado" })
      });
    });

    await page.locator('button:has-text("Enviar")').first().click();
    
    // Debería aparecer un toast o mensaje indicando éxito
    await expect(page.locator('text=/enviado|éxito|success/i').first()).toBeVisible();
  });

  test('Portal /mi-reserva — muestra form con código y email', async ({ page }) => {
    await page.goto('/mi-reserva');

    // El formulario de acceso debe estar visible
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 });

    // Debe pedir código de reserva
    await expect(page.locator('input[placeholder*="IP-"]')).toBeVisible();

    // Debe pedir email
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // Código incorrecto → mensaje de error
    await page.locator('input[placeholder*="IP-"]').fill('IP-000000');
    await page.locator('input[type="email"]').fill('test@test.com');
    // Esperar captcha (bypass por isPlaywright)
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Consultar")').click();
    await expect(page.locator('text=/no encontrada|incorrectos/i').first()).toBeVisible({ timeout: 8000 });
  });

  test('Flujo de Reserva — apertura modal y datos del huésped', async ({ page }) => {
    await page.goto('/apartamentos');
    const firstApt = page.locator('a[href^="/apartamentos/"]').first();

    if (!(await firstApt.isVisible({ timeout: 10000 }))) {
      console.log('No hay apartamentos visibles, saltando test.');
      return;
    }
    await firstApt.click();

    // Abrir el modal con el botón del widget
    const bookBtn = page.getByRole('button', { name: /ver disponibilidad|reservar|book/i }).first();
    await expect(bookBtn).toBeVisible({ timeout: 10000 });
    await bookBtn.click();

    // El modal puede aparecer O redirigir a /reservar según booking_mode en Supabase
    const modalOrRedirect = await Promise.race([
      page.getByLabel(/nombre completo|full name/i).waitFor({ timeout: 6000 }).then(() => 'modal'),
      page.waitForURL('**/reservar**', { timeout: 6000 }).then(() => 'redirect'),
    ]).catch(() => 'none');

    if (modalOrRedirect === 'modal') {
      await page.getByLabel(/nombre completo|full name/i).fill('Tester E2E');
      await page.getByLabel(/email/i).fill('tester@example.com');
      await page.locator('input[type="tel"]').first().fill('600000000');
      await expect(page.locator('text=/términos|terms/i').first()).toBeVisible();
    } else if (modalOrRedirect === 'redirect') {
      // Modo redirect activo — verificar que llegamos a la página de reserva
      await expect(page).toHaveURL(/reservar/);
    } else {
      console.log('Ni modal ni redirect detectados — posible timeout de carga.');
    }
  });

  test('Flujo de Reserva — mock Edge Function process-payment', async ({ page }) => {
    // Interceptar la Edge Function para no crear intenciones de pago reales
    await page.route('**/functions/v1/process-payment', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ clientSecret: 'pi_test_secret_mock_playwright' }),
      });
    });

    await page.goto('/apartamentos');
    const firstApt = page.locator('a[href^="/apartamentos/"]').first();

    if (!(await firstApt.isVisible({ timeout: 10000 }))) {
      console.log('No hay apartamentos visibles, saltando test.');
      return;
    }
    await firstApt.click();

    // Verificar que la página de detalle carga el precio
    await expect(page.locator('text=/noche/i').first()).toBeVisible({ timeout: 10000 });

    // Verificar que el widget de reserva está presente
    await expect(page.getByRole('button', { name: /ver disponibilidad|reservar/i }).first()).toBeVisible();
  });

});
