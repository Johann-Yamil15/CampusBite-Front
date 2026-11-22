import { test, expect } from '../support/fixtures';
import { ALUMNO } from '../support/jwt';
import { menuCafeteria, simularAlumno } from '../support/datos';

// Catálogo del alumno (GET /api/menu) y carrito. La sesión se siembra con un JWT; el menú tiene la forma real de
// MenuCafeteriaDto (la versión anterior de esta prueba usaba una forma inventada y la pantalla fallaba con
// "Cannot read properties of undefined (reading 'map')").
test.describe('Catálogo de Cafeterías y Carrito', () => {
  test.beforeEach(async ({ api, iniciarSesionComo }) => {
    await iniciarSesionComo(ALUMNO);
    simularAlumno(api);
    api.get('menu', { body: [menuCafeteria()] });
  });

  test('muestra el catálogo, filtra un platillo y lo agrega al carrito', async ({ page }) => {
    await page.goto('/buscar');

    await page.getByRole('searchbox', { name: 'Buscar platillo, ingrediente o cafetería' }).fill('Chilaquiles');

    await expect(page.getByText('Chilaquiles Verdes con Pollo').first()).toBeVisible();
    await expect(page.getByText('Café Americano')).toBeHidden();

    // El regex anterior (/agregar|añadir|\+/) también coincidía con el filtro "4+" y lo activaba sin querer
    await page.getByRole('button', { name: 'Agregar Chilaquiles Verdes con Pollo al carrito' }).first().click();
    await expect(page.getByRole('button', { name: /Abrir carrito, 1 producto/i })).toBeVisible();
  });

  test('sin coincidencias avisa que no hay platillos', async ({ page }) => {
    await page.goto('/buscar');

    await page.getByRole('searchbox', { name: 'Buscar platillo, ingrediente o cafetería' }).fill('zzzz-no-existe');

    await expect(page.getByText('Chilaquiles Verdes con Pollo')).toBeHidden();
    await expect(page.getByRole('status').filter({ hasText: 'platillos para' })).toContainText('0');
  });
});
