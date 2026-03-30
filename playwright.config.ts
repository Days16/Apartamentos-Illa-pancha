import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config(); // Cargar variables de entorno (como los usuarios de test)

export default defineConfig({
  testDir: './tests/e2e',
  // Ejecutar tests concurrentemente
  fullyParallel: true,
  // Fallar build en CI si hay test.only
  forbidOnly: !!process.env.CI,
  // Reintentos solo en CI
  retries: process.env.CI ? 1 : 0,
  // Optimizaciones de workers
  workers: process.env.CI ? 1 : undefined,
  /* Reporter usado (HTML) */
  reporter: 'html',
  
  /* Timeout global por test */
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  
  use: {
    /* Base URL central para todos los tests (usando 5174 que es el puerto activo confirmado) */
    baseURL: 'http://localhost:5174',
    /* Forzar idioma español para los tests */
    locale: 'es-ES',
    /* Acción por defecto si no carga */
    navigationTimeout: 15000,
    /* Coleccionar trazabilidad si un test falla el primer intento. */
    trace: 'on-first-retry',
  },

  /* Usamos solo Chromium por velocidad, pero se podrían añadir Safari/Firefox */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Esto levanta tu npm run dev automáticamente antes de correr los tests si no está levantado */
  webServer: {
    command: 'npm run dev -- --port 5174',
    url: 'http://localhost:5174',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
