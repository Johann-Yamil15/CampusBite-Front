import { defineConfig, devices } from '@playwright/test';

// Dos modos:
//  - Por defecto (npx playwright test): proyectos "mocks-*". La API está SIMULADA (tests/mocks); no necesita back.
//  - E2E_REAL=1: además corre "api-real" (REST contra el back local) y "ui-real" (el front sirviendo contra ese
//    back). Requiere el back en API_URL (por defecto http://localhost:5167) y JWT_KEY igual a su Jwt__Key.
//    Ver tests/real/README.md.
const REAL = process.env['E2E_REAL'] === '1';
const API_URL = process.env['API_URL'] ?? 'http://localhost:5167';
const CI = !!process.env['CI'];

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 2 : undefined,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: { trace: 'on-first-retry', screenshot: 'only-on-failure' },
  projects: [
    {
      name: 'mocks-chromium',
      testDir: './tests/mocks',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:4200' },
    },
    {
      // La app es una PWA pensada para el celular
      name: 'mocks-movil',
      testDir: './tests/mocks',
      testMatch: ['catalogo-carrito.spec.ts', 'auth.spec.ts', 'errores-de-red.spec.ts'],
      use: { ...devices['Pixel 7'], baseURL: 'http://localhost:4200' },
    },
    ...(REAL
      ? [
          { name: 'api-real', testDir: './tests/real', testMatch: 'api-*.spec.ts', use: { baseURL: API_URL } },
          {
            name: 'ui-real',
            testDir: './tests/real',
            testMatch: 'ui-*.spec.ts',
            use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:4201' },
          },
        ]
      : []),
  ],
  webServer: [
    { command: 'npm start', url: 'http://localhost:4200', reuseExistingServer: true, timeout: 180_000 },
    ...(REAL
      ? [
          {
            command: 'npx ng serve --port 4201 --proxy-config tests/real/proxy.real.json',
            url: 'http://localhost:4201',
            reuseExistingServer: true,
            timeout: 180_000,
          },
        ]
      : []),
  ],
});
