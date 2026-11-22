import { test, expect, problema } from '../support/fixtures';
import { ALUMNO, ENCARGADO, crearJwt } from '../support/jwt';
import { CAFETERIA_ID } from '../support/jwt';
import { menuCafeteria, pagina, simularAlumno } from '../support/datos';

// Autenticación: login con la forma REAL de AuthResponseDto y errores como ProblemDetails (campo "detail").
const respuestaLogin = (s: typeof ALUMNO) => ({
  usuarioId: s.id, correo: s.correo, rol: s.rol, nombre: s.nombre, idCafeteria: s.idCafeteria,
  token: crearJwt(s), expiraEn: new Date(Date.now() + 3600_000).toISOString(),
});

async function llenarLogin(page: import('@playwright/test').Page, correo: string, password: string) {
  await page.goto('/login');
  await page.getByLabel(/correo/i).fill(correo);
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(password);
  await page.getByRole('button', { name: /iniciar sesión|entrar|ingresar/i }).click();
}

test.describe('Autenticación', () => {
  test('sin sesión, una ruta protegida lleva al login', async ({ page }) => {
    await page.goto('/admin');

    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByRole('button', { name: /iniciar sesión|entrar|ingresar/i })).toBeVisible();
  });

  test('credenciales incorrectas: muestra el detalle del back y se queda en el login', async ({ page, api }) => {
    api.on('POST', 'auth/login', problema(401, 'Correo o contraseña incorrectos.'));

    await llenarLogin(page, 'alumno@uttt.edu.mx', 'ClaveIncorrecta123');

    await expect(page.getByText('Correo o contraseña incorrectos.')).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/login/);
    expect(await page.evaluate(() => localStorage.getItem('cb.access_token'))).toBeNull();
  });

  test('correo sin verificar (403): avisa lo que dice el back y no abre sesión', async ({ page, api }) => {
    api.on('POST', 'auth/login', problema(403, 'Verifica tu correo antes de iniciar sesión. Revisa tu bandeja de entrada o pide que te reenviemos el enlace.'));

    await llenarLogin(page, 'alumno@uttt.edu.mx', 'PasswordSegura123');

    await expect(page.getByText(/Verifica tu correo antes de iniciar sesión/)).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('demasiados intentos (429): muestra el aviso del back', async ({ page, api }) => {
    api.on('POST', 'auth/login', problema(429, 'Demasiados intentos. Espera un momento y vuelve a intentarlo.'));

    await llenarLogin(page, 'alumno@uttt.edu.mx', 'PasswordSegura123');

    await expect(page.getByText('Demasiados intentos. Espera un momento y vuelve a intentarlo.')).toBeVisible();
  });

  test('alumno: inicia sesión, guarda el token y llega al inicio del alumno', async ({ page, api }) => {
    simularAlumno(api);
    api.get('menu', { body: [menuCafeteria()] });
    api.on('POST', 'auth/login', { body: respuestaLogin(ALUMNO) });
    api.get('auth/me', { body: { id: ALUMNO.id, correo: ALUMNO.correo, rol: ALUMNO.rol, nombre: ALUMNO.nombre, idCafeteria: null } });

    await llenarLogin(page, ALUMNO.correo, 'PasswordSegura123');

    await expect(page).toHaveURL(/localhost:4200\/?$/);
    expect(await page.evaluate(() => localStorage.getItem('cb.access_token'))).toMatch(/^ey/);
    const [login] = api.llamadas('POST', 'auth/login');
    expect(login.cuerpo).toMatchObject({ correo: ALUMNO.correo, password: 'PasswordSegura123' });
  });

  test('encargado: inicia sesión y llega directo a su panel /mi-negocio', async ({ page, api }) => {
    api.on('POST', 'auth/login', { body: respuestaLogin(ENCARGADO) });
    api.get('auth/me', { body: { id: ENCARGADO.id, correo: ENCARGADO.correo, rol: ENCARGADO.rol, nombre: ENCARGADO.nombre, idCafeteria: CAFETERIA_ID } });
    api.get(`cafeterias/${CAFETERIA_ID}`, { body: { idCafeteria: CAFETERIA_ID, nombre: 'Cafetería Central', ubicacion: 'A', esDelCampus: true, puntoEntrega: 'B', metodosPago: ['Efectivo'], activa: true } });
    api.get(`cafeterias/${CAFETERIA_ID}/categorias`, { body: [] });
    api.get(`cafeterias/${CAFETERIA_ID}/productos`, { body: pagina([]) });

    await llenarLogin(page, ENCARGADO.correo, 'PasswordSegura123');

    await expect(page).toHaveURL(/\/mi-negocio/);
  });

  test('con sesión activa, volver al login lleva al inicio (guard de visitantes)', async ({ page, api, iniciarSesionComo }) => {
    simularAlumno(api);
    api.get('menu', { body: [menuCafeteria()] });
    await iniciarSesionComo(ALUMNO);

    await page.goto('/login');

    await expect(page).not.toHaveURL(/login/);
  });
});
