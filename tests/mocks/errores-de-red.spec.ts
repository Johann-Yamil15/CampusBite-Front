import { test, expect, problema } from '../support/fixtures';
import { ALUMNO } from '../support/jwt';
import { menuCafeteria, simularAlumno } from '../support/datos';

// Cómo se comporta el front cuando la red o el back fallan (sin back real: la API está simulada).
test.describe('Errores de red y respuestas lentas', () => {
  test.beforeEach(async ({ api, iniciarSesionComo }) => {
    simularAlumno(api);
    await iniciarSesionComo(ALUMNO);
  });

  test('sin conexión con el servidor muestra un aviso y deja reintentar', async ({ page, api }) => {
    api.get('menu', { abortar: true });

    await page.goto('/buscar');

    const alerta = page.getByRole('alert');
    await expect(alerta).toBeVisible();
    await expect(alerta.getByRole('button', { name: 'Reintentar' })).toBeVisible();

    api.get('menu', { body: [menuCafeteria()] });
    await alerta.getByRole('button', { name: 'Reintentar' }).click();
    await page.getByRole('searchbox', { name: 'Buscar platillo, ingrediente o cafetería' }).fill('Café');
    await expect(page.getByText('Café Americano').first()).toBeVisible();
  });

  test('un 500 del back no deja la pantalla en blanco y no muestra texto técnico', async ({ page, api }) => {
    api.get('menu', problema(500, 'Ocurrió un error inesperado. Intenta de nuevo.'));

    await page.goto('/buscar');

    await expect(page.getByRole('alert')).toContainText('Ocurrió un error inesperado. Intenta de nuevo.');
    await expect(page.getByRole('alert')).not.toContainText(/exception|stack|undefined|\.map/i);
  });

  test('una respuesta lenta no rompe la pantalla: aparece el contenido cuando llega', async ({ page, api }) => {
    api.get('menu', { body: [menuCafeteria()], demoraMs: 1500 });

    await page.goto('/buscar');
    await page.getByRole('searchbox', { name: 'Buscar platillo, ingrediente o cafetería' }).fill('Chilaquiles');

    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByText('Chilaquiles Verdes con Pollo').first()).toBeVisible({ timeout: 10_000 });
  });

  test('un menú con forma inesperada (sin "productos") no tumba la app', async ({ page, api }) => {
    api.get('menu', { body: [{ idCafeteria: 'c-1', cafeteria: 'Sin forma' }] });

    await page.goto('/buscar');

    await expect(page.getByRole('searchbox', { name: 'Buscar platillo, ingrediente o cafetería' })).toBeVisible();
    await expect(page.getByRole('alert')).toBeVisible();          // avisa en vez de quedarse cargando o en blanco
  });

  test('el 429 de un endpoint muestra el mensaje del back', async ({ page, api }) => {
    api.get('menu', problema(429, 'Demasiados intentos. Espera un momento y vuelve a intentarlo.'));

    await page.goto('/buscar');

    await expect(page.getByRole('alert')).toContainText('Demasiados intentos');
  });
});
