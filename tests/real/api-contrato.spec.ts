import { test, expect } from '@playwright/test';
import { ADMIN, ALUMNO, CAFETERIA_ID, ENCARGADO, type DatosSesion } from '../support/jwt';
import { jwtFirmado } from '../support/jwt-firmado';

// Pruebas REST contra el back REAL local (PostgreSQL con el consolidado y los datos de 90_datos_dev).
// Comprueban el CONTRATO que el front espera: códigos, forma del JSON y permisos por rol.
const como = (s: DatosSesion) => ({ Authorization: `Bearer ${jwtFirmado(s)}` });
const sufijo = () => Math.random().toString(36).slice(2, 8);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cualquiera = any;

async function problema(r: { json(): Promise<Cualquiera>; headers(): Record<string, string> }) {
  const cuerpo = await r.json();
  expect(r.headers()['content-type']).toContain('application/problem+json');
  expect(typeof cuerpo.detail).toBe('string');
  expect(typeof cuerpo.status).toBe('number');
  return cuerpo;
}

test.describe('Autenticación y errores', () => {
  test('sin token, las rutas protegidas responden 401 como ProblemDetails', async ({ request }) => {
    const r = await request.get('/api/menu');
    expect(r.status()).toBe(401);
    await problema(r);
  });

  test('un token firmado con otra llave se rechaza (401)', async ({ request }) => {
    const falso = jwtFirmado(ALUMNO, { llave: 'otra-llave-que-no-es-la-del-back-0123456789' });
    const r = await request.get('/api/menu', { headers: { Authorization: `Bearer ${falso}` } });
    expect(r.status()).toBe(401);
  });

  test('un token vencido se rechaza (401)', async ({ request }) => {
    const vencido = jwtFirmado(ALUMNO, { segundosDeVida: -3600 });
    const r = await request.get('/api/menu', { headers: { Authorization: `Bearer ${vencido}` } });
    expect(r.status()).toBe(401);
  });

  test('login con credenciales inexistentes: 401 con el mismo mensaje y sin pista de si el correo existe', async ({ request }) => {
    const a = await request.post('/api/auth/login', { data: { correo: `nadie_${sufijo()}@ejemplo.test`, password: 'Password123' } });
    const b = await request.post('/api/auth/login', { data: { correo: 'alumno@ejemplo.test', password: 'Incorrecta123' } });
    expect([a.status(), b.status()]).toEqual([401, 401]);
    expect((await problema(a)).detail).toBe((await problema(b)).detail);
  });

  test('login con cuerpo inválido: 400 con los errores por campo', async ({ request }) => {
    const r = await request.post('/api/auth/login', { data: { correo: 'no-es-correo', password: '' } });
    expect(r.status()).toBe(400);
    const cuerpo = await r.json();
    expect(cuerpo.errors).toBeTruthy();
  });

  test('el registro responde con el aviso de verificación y un correo repetido es 409', async ({ request }) => {
    const correo = `e2e_${sufijo()}@ejemplo.test`;
    const datos = { nombre: 'Prueba E2E', correo, password: 'Password123', telefono: '7711234567' };

    const alta = await request.post('/api/auth/registro', { data: datos });
    expect(alta.status()).toBeLessThan(300);
    const cuerpo = await alta.json();
    expect(cuerpo).toMatchObject({ correo });
    expect(typeof cuerpo.correoEnviado).toBe('boolean');
    expect(typeof cuerpo.mensaje).toBe('string');

    const repetido = await request.post('/api/auth/registro', { data: datos });
    expect(repetido.status()).toBe(409);
    await problema(repetido);
  });

  test('un usuario recién registrado no puede entrar hasta verificar su correo (403)', async ({ request }) => {
    const correo = `e2e_${sufijo()}@ejemplo.test`;
    await request.post('/api/auth/registro', { data: { nombre: 'Sin Verificar', correo, password: 'Password123' } });

    const r = await request.post('/api/auth/login', { data: { correo, password: 'Password123' } });

    expect(r.status()).toBe(403);
    expect((await problema(r)).detail).toMatch(/Verifica tu correo/);
  });
});

test.describe('Menú del alumno', () => {
  test('GET /api/menu devuelve cafeterías con la forma que lee el front', async ({ request }) => {
    const r = await request.get('/api/menu', { headers: como(ALUMNO) });
    expect(r.status()).toBe(200);
    const menu = await r.json();
    expect(Array.isArray(menu)).toBe(true);
    const cafeteria = menu.find((c: Cualquiera) => c.idCafeteria === CAFETERIA_ID);
    expect(cafeteria).toBeTruthy();
    for (const clave of ['idCafeteria', 'cafeteria', 'esDelCampus', 'puntoEntrega', 'metodosPago', 'productos', 'abierta']) {
      expect(cafeteria, `falta ${clave}`).toHaveProperty(clave);
    }
    expect(Array.isArray(cafeteria.metodosPago)).toBe(true);
    expect(Array.isArray(cafeteria.productos)).toBe(true);
    for (const clave of ['idProducto', 'producto', 'precio', 'dietas']) {
      expect(cafeteria.productos[0], `falta ${clave}`).toHaveProperty(clave);
    }
  });

  test('un alumno ve sus órdenes paginadas (vacías al inicio)', async ({ request }) => {
    const r = await request.get('/api/ordenes/mias?pagina=1&tamanoPagina=50', { headers: como(ALUMNO) });
    expect(r.status()).toBe(200);
    expect(await r.json()).toMatchObject({ items: expect.any(Array), total: expect.any(Number), pagina: 1 });
  });
});

test.describe('Categorías y productos del encargado', () => {
  const base = `/api/cafeterias/${CAFETERIA_ID}`;

  test('las categorías y productos de la cafetería tienen el formato paginado y de DTO esperado', async ({ request }) => {
    const cats = await request.get(`${base}/categorias`, { headers: como(ENCARGADO) });
    expect(cats.status()).toBe(200);
    const lista = await cats.json();
    expect(lista.map((c: Cualquiera) => c.nombre)).toEqual(expect.arrayContaining(['Desayunos', 'Bebidas']));
    expect(lista[0]).toEqual({ idCategoria: expect.any(String), nombre: expect.any(String) });

    const prods = await request.get(`${base}/productos?pagina=1&tamanoPagina=100`, { headers: como(ENCARGADO) });
    expect(prods.status()).toBe(200);
    const pagina = await prods.json();
    expect(pagina).toMatchObject({ pagina: 1, tamanoPagina: 100, items: expect.any(Array), total: expect.any(Number) });
    expect(pagina.total).toBeGreaterThanOrEqual(3);
    for (const clave of ['idProducto', 'idCafeteria', 'idCategoria', 'categoria', 'nombre', 'precio', 'disponible', 'imagenUrl']) {
      expect(pagina.items[0], `falta ${clave}`).toHaveProperty(clave);
    }
  });

  test('un platillo SIN categoría se crea y aparece en el listado con idCategoria nulo (el caso de producción)', async ({ request }) => {
    const nombre = `Torta e2e ${sufijo()}`;

    const alta = await request.post(`${base}/productos`, {
      headers: como(ENCARGADO),
      multipart: { nombre, descripcion: 'sin categoría', precio: '42.50', disponible: 'true' },
    });
    expect(alta.status()).toBe(201);
    const creado = await alta.json();
    expect(creado).toMatchObject({ nombre, idCategoria: null, categoria: null, precio: 42.5, disponible: true });

    const lista = await (await request.get(`${base}/productos?pagina=1&tamanoPagina=100&buscar=${encodeURIComponent(nombre)}`, { headers: como(ENCARGADO) })).json();
    expect(lista.items.map((p: Cualquiera) => p.idProducto)).toContain(creado.idProducto);

    const baja = await request.delete(`${base}/productos/${creado.idProducto}`, { headers: como(ENCARGADO) });
    expect(baja.status()).toBe(204);
  });

  test('crear una categoría, usarla en un platillo y repetir el nombre da 409', async ({ request }) => {
    const nombre = `Cat e2e ${sufijo()}`;
    const cat = await request.post(`${base}/categorias`, { headers: como(ENCARGADO), data: { nombre } });
    expect(cat.status()).toBe(201);
    const { idCategoria } = await cat.json();

    const repetida = await request.post(`${base}/categorias`, { headers: como(ENCARGADO), data: { nombre } });
    expect(repetida.status()).toBe(409);
    await problema(repetida);

    const alta = await request.post(`${base}/productos`, {
      headers: como(ENCARGADO),
      multipart: { nombre: `Plato ${sufijo()}`, precio: '10', idCategoria, disponible: 'true' },
    });
    expect(alta.status()).toBe(201);
    expect((await alta.json()).categoria).toBe(nombre);
  });

  test('validaciones: precio cero o nombre vacío dan 400 con errores por campo', async ({ request }) => {
    const r = await request.post(`${base}/productos`, { headers: como(ENCARGADO), multipart: { nombre: ' ', precio: '0', disponible: 'true' } });
    expect(r.status()).toBe(400);
    expect((await r.json()).errors).toBeTruthy();
  });

  test('permisos: un alumno no crea categorías (403) y un encargado de otra cafetería tampoco', async ({ request }) => {
    const alumno = await request.post(`${base}/categorias`, { headers: como(ALUMNO), data: { nombre: `x ${sufijo()}` } });
    expect(alumno.status()).toBe(403);
    await problema(alumno);

    const ajeno: DatosSesion = { ...ENCARGADO, id: '00000000-0000-0000-0000-00000000ffff', idCafeteria: '00000000-0000-0000-0000-00000000ffee' };
    const r = await request.post(`${base}/categorias`, { headers: como(ajeno), data: { nombre: `y ${sufijo()}` } });
    expect([403, 404]).toContain(r.status());
  });

  test('el administrador del sistema también puede listar productos de una cafetería', async ({ request }) => {
    const r = await request.get(`${base}/productos?pagina=1&tamanoPagina=10`, { headers: como(ADMIN) });
    expect(r.status()).toBe(200);
  });

  test('tamanoPagina fuera de rango se rechaza (400) y no devuelve miles de filas', async ({ request }) => {
    const r = await request.get(`${base}/productos?pagina=1&tamanoPagina=100000`, { headers: como(ENCARGADO) });
    expect(r.status()).toBe(400);
  });
});
