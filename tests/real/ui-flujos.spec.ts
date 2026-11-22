import { test, expect, type Page } from '@playwright/test';
import { ALUMNO, CAFETERIA_ID, ENCARGADO, type DatosSesion } from '../support/jwt';
import { jwtFirmado } from '../support/jwt-firmado';

// El front REAL (ng serve, con proxy) hablando con el back REAL local: sin ninguna respuesta simulada.
// La sesión se abre con un JWT firmado con la llave del back local (así no hace falta verificar un correo).
async function conSesion(page: Page, sesion: DatosSesion) {
  const token = jwtFirmado(sesion);
  await page.addInitScript((t) => localStorage.setItem('cb.access_token', t), token);
  return token;
}

const sufijo = () => Math.random().toString(36).slice(2, 8);

test.describe('Panel del encargado con el back real', () => {
  test('muestra los platillos del negocio, incluido uno creado sin categoría', async ({ page, request }) => {
    const token = await conSesion(page, ENCARGADO);
    const nombre = `Torta ui ${sufijo()}`;
    const alta = await request.post(`/api/cafeterias/${CAFETERIA_ID}/productos`, {
      headers: { Authorization: `Bearer ${token}` },
      multipart: { nombre, descripcion: 'sin categoría', precio: '31', disponible: 'true' },
    });
    expect(alta.status()).toBe(201);
    const { idProducto } = await alta.json();

    await page.goto('/mi-negocio');

    await expect(page.getByRole('heading', { name: 'Chilaquiles verdes' })).toBeVisible();      // dato de 90_datos_dev
    await expect(page.getByRole('heading', { name: nombre })).toBeVisible();                      // categoría nula
    await expect(page.getByRole('alert')).toHaveCount(0);

    await request.delete(`/api/cafeterias/${CAFETERIA_ID}/productos/${idProducto}`, { headers: { Authorization: `Bearer ${token}` } });
  });

  test('un alumno que abre /mi-negocio no ve el panel (el back lo rechazaría igual)', async ({ page }) => {
    await conSesion(page, ALUMNO);

    await page.goto('/mi-negocio');

    await expect(page).not.toHaveURL(/mi-negocio/);
  });
});

test.describe('Catálogo del alumno con el back real', () => {
  test('busca un platillo del menú real y lo agrega al carrito', async ({ page }) => {
    await conSesion(page, ALUMNO);

    await page.goto('/buscar');
    await page.getByRole('searchbox', { name: 'Buscar platillo, ingrediente o cafetería' }).fill('Chilaquiles');

    await expect(page.getByText('Chilaquiles verdes').first()).toBeVisible();
    await page.getByRole('button', { name: /^Agregar Chilaquiles verdes al carrito/ }).first().click();
    await expect(page.getByRole('button', { name: /Abrir carrito, 1 producto/i })).toBeVisible();
  });

  test('un token vencido o inválido lleva al login', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('cb.access_token', 'no.es.un-token'));

    await page.goto('/buscar');

    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('con un token firmado con otra llave, el back responde 401 y el front cierra la sesión', async ({ page }) => {
    const falso = jwtFirmado(ALUMNO, { llave: 'otra-llave-que-no-es-la-del-back-0123456789' });
    await page.addInitScript((t) => localStorage.setItem('cb.access_token', t), falso);

    await page.goto('/buscar');

    await expect(page).toHaveURL(/\/auth\/login/);
    expect(await page.evaluate(() => localStorage.getItem('cb.access_token'))).toBeNull();
  });
});
