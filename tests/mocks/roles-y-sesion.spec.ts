import { test, expect, problema } from '../support/fixtures';
import { ADMIN, ALUMNO, CAFETERIA_ID, ENCARGADO } from '../support/jwt';
import { categorias, menuCafeteria, pagina, simularAlumno } from '../support/datos';

// Quién puede entrar a qué (guards por rol) y qué pasa cuando la sesión caduca o el back la rechaza.
const panelEncargado = (api: import('../support/fixtures').ApiSimulada) => {
  api.get(`cafeterias/${CAFETERIA_ID}`, { body: { idCafeteria: CAFETERIA_ID, nombre: 'Cafetería Central', ubicacion: 'A', esDelCampus: true, puntoEntrega: 'B', metodosPago: ['Efectivo'], activa: true } });
  api.get(`cafeterias/${CAFETERIA_ID}/categorias`, { body: categorias });
  api.get(`cafeterias/${CAFETERIA_ID}/productos`, { body: pagina([]) });
};

test.describe('Guards por rol', () => {
  test('un alumno que abre /mi-negocio no ve el panel del dueño', async ({ page, api, iniciarSesionComo }) => {
    simularAlumno(api);
    api.get('menu', { body: [menuCafeteria()] });
    await iniciarSesionComo(ALUMNO);

    await page.goto('/mi-negocio');

    await expect(page).not.toHaveURL(/mi-negocio/);
    expect(api.llamadas('GET', /cafeterias\/[^/]+\/productos/)).toHaveLength(0);
  });

  test('un alumno que abre /admin no entra', async ({ page, api, iniciarSesionComo }) => {
    simularAlumno(api);
    api.get('menu', { body: [menuCafeteria()] });
    await iniciarSesionComo(ALUMNO);

    await page.goto('/admin');

    await expect(page).not.toHaveURL(/\/admin/);
  });

  test('un encargado que abre / es llevado a su panel', async ({ page, api, iniciarSesionComo }) => {
    panelEncargado(api);
    await iniciarSesionComo(ENCARGADO);

    await page.goto('/');

    await expect(page).toHaveURL(/\/mi-negocio/);
  });

  test('un encargado sin cafetería asignada ve el aviso de /negocio y no un ciclo de redirecciones', async ({ page, api, iniciarSesionComo }) => {
    await iniciarSesionComo({ ...ENCARGADO, idCafeteria: null });

    await page.goto('/mi-negocio');

    await expect(page).toHaveURL(/\/negocio$/);
  });

  test('un administrador del sistema no cae en el panel del dueño', async ({ page, api, iniciarSesionComo }) => {
    simularAlumno(api);
    api.get('menu', { body: [menuCafeteria()] });
    await iniciarSesionComo(ADMIN);

    await page.goto('/mi-negocio');

    await expect(page).not.toHaveURL(/mi-negocio/);
  });
});

test.describe('Sesión caducada o rechazada', () => {
  test('un token vencido se descarta y lleva al login', async ({ page, iniciarSesionComo }) => {
    await iniciarSesionComo(ALUMNO, { segundosDeVida: -60 });

    await page.goto('/');

    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('un 401 en medio de la sesión limpia el token y lleva al login', async ({ page, api, iniciarSesionComo }) => {
    simularAlumno(api);
    api.get('menu', { body: [menuCafeteria()] });
    await iniciarSesionComo(ALUMNO);
    await page.goto('/buscar');
    await expect(page.getByRole('searchbox', { name: 'Buscar platillo, ingrediente o cafetería' })).toBeVisible();

    api.get('menu', problema(401, 'La sesión no es válida. Inicia sesión de nuevo.'));
    await page.reload();

    await expect(page).toHaveURL(/\/auth\/login/);
    expect(await page.evaluate(() => localStorage.getItem('cb.access_token'))).toBeNull();
  });

  test('cerrar sesión borra el token y vuelve al login', async ({ page, api, iniciarSesionComo }) => {
    simularAlumno(api);
    api.get('menu', { body: [menuCafeteria()] });
    await iniciarSesionComo(ALUMNO);
    await page.goto('/');

    await page.getByRole('button', { name: 'Cerrar sesión' }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: 'Cerrar sesión' }).click();     // confirma el aviso

    await expect(page).toHaveURL(/login/);
    expect(await page.evaluate(() => localStorage.getItem('cb.access_token'))).toBeNull();
  });
});
