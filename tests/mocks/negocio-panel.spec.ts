import { test, expect, problema } from '../support/fixtures';
import { CAFETERIA_ID, ENCARGADO } from '../support/jwt';
import { categorias, pagina, producto, productosSinCategoria } from '../support/datos';

// Panel del dueño de la cafetería (/mi-negocio). Es la pantalla que falló en producción: los platillos existían pero
// no se mostraban porque la cafetería no tenía categorías y los productos venían con idCategoria: null.
test.describe('Panel del negocio (encargado)', () => {
  test.beforeEach(async ({ api, iniciarSesionComo }) => {
    await iniciarSesionComo(ENCARGADO);
    // Lo que el panel pide al cargar, además de productos y categorías
    api.get(`cafeterias/${CAFETERIA_ID}`, { body: {
      idCafeteria: CAFETERIA_ID, nombre: 'Cafetería Central', ubicacion: 'Edificio A', esDelCampus: true,
      puntoEntrega: 'Barra principal', metodosPago: ['Efectivo'], activa: true,
    } });
  });

  test('muestra los platillos aunque no tengan categoría ni la cafetería tenga categorías', async ({ page, api }) => {
    api.get(`cafeterias/${CAFETERIA_ID}/categorias`, { body: [] });
    api.get(`cafeterias/${CAFETERIA_ID}/productos`, { body: pagina(productosSinCategoria) });

    await page.goto('/mi-negocio');

    await expect(page.getByRole('heading', { name: 'Chilorta' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'torta', exact: true })).toBeVisible();
  });

  test('pide los productos paginados (pagina y tamanoPagina) y con la sesión del encargado', async ({ page, api }) => {
    api.get(`cafeterias/${CAFETERIA_ID}/categorias`, { body: categorias });
    api.get(`cafeterias/${CAFETERIA_ID}/productos`, { body: pagina([producto()]) });

    await page.goto('/mi-negocio');
    await expect(page.getByRole('heading', { name: 'Chilaquiles verdes' })).toBeVisible();

    const [llamada] = api.llamadas('GET', `cafeterias/${CAFETERIA_ID}/productos`);
    expect(llamada.consulta.get('pagina')).toBe('1');
    expect(Number(llamada.consulta.get('tamanoPagina'))).toBeLessThanOrEqual(100);
    expect(llamada.autorizacion).toMatch(/^Bearer ey/);
  });

  test('un negocio nuevo, sin productos, se muestra sin errores', async ({ page, api }) => {
    api.get(`cafeterias/${CAFETERIA_ID}/categorias`, { body: [] });
    api.get(`cafeterias/${CAFETERIA_ID}/productos`, { body: pagina([]) });

    await page.goto('/mi-negocio');

    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Chilorta' })).toHaveCount(0);
  });

  test('junta todas las páginas cuando hay más de 100 productos', async ({ page, api }) => {
    const todos = Array.from({ length: 130 }, (_, i) =>
      producto({ idProducto: `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`, nombre: `Platillo ${i + 1}` }));
    api.get(`cafeterias/${CAFETERIA_ID}/categorias`, { body: categorias });
    api.get(`cafeterias/${CAFETERIA_ID}/productos`, (peticion) => {
      const p = Number(new URL(peticion.url()).searchParams.get('pagina') ?? '1');
      const items = todos.slice((p - 1) * 100, p * 100);
      return { body: { items, total: 130, pagina: p, tamanoPagina: 100, totalPaginas: 2, tieneAnterior: p > 1, tieneSiguiente: p < 2 } };
    });

    await page.goto('/mi-negocio');

    await expect(page.getByRole('heading', { name: 'Platillo 1', exact: true })).toBeVisible();
    await expect.poll(() => api.llamadas('GET', `cafeterias/${CAFETERIA_ID}/productos`).length).toBe(2);
    await expect(page.getByRole('heading', { name: 'Platillo 130', exact: true })).toBeVisible();
  });

  test('si el back responde 403 muestra su detalle y deja reintentar', async ({ page, api }) => {
    api.get(`cafeterias/${CAFETERIA_ID}/categorias`, { body: categorias });
    api.get(`cafeterias/${CAFETERIA_ID}/productos`, problema(403, 'No tienes permiso para esta acción.'));

    await page.goto('/mi-negocio');

    const alerta = page.getByRole('alert');
    await expect(alerta).toContainText('No tienes permiso para esta acción.');
    await expect(alerta.getByRole('button', { name: 'Reintentar' })).toBeVisible();
  });

  test('reintentar vuelve a pedir los productos y los muestra cuando el back ya responde', async ({ page, api }) => {
    api.get(`cafeterias/${CAFETERIA_ID}/categorias`, { body: categorias });
    api.get(`cafeterias/${CAFETERIA_ID}/productos`, problema(500, 'Ocurrió un error inesperado.'));
    await page.goto('/mi-negocio');
    await expect(page.getByRole('alert')).toBeVisible();

    api.get(`cafeterias/${CAFETERIA_ID}/productos`, { body: pagina([producto({ nombre: 'Molletes' })]) });
    await page.getByRole('button', { name: 'Reintentar' }).click();

    await expect(page.getByRole('heading', { name: 'Molletes' })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
});
