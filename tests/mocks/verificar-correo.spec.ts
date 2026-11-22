import { test, expect, problema } from '../support/fixtures';
import { ALUMNO, crearJwt } from '../support/jwt';
import { menuCafeteria, simularAlumno } from '../support/datos';

// Enlace del correo de verificación: <front>/verificar-correo?token=...
test.describe('Verificación de correo', () => {
  test('con un token válido abre la sesión y lleva al inicio', async ({ page, api }) => {
    simularAlumno(api);
    api.get('menu', { body: [menuCafeteria()] });
    api.get('auth/me', { body: { id: ALUMNO.id, correo: ALUMNO.correo, rol: ALUMNO.rol, nombre: ALUMNO.nombre, idCafeteria: null } });
    api.on('POST', 'auth/verificar-correo', {
      body: {
        usuarioId: ALUMNO.id, correo: ALUMNO.correo, rol: 'Alumno', nombre: ALUMNO.nombre, idCafeteria: null,
        token: crearJwt(ALUMNO), expiraEn: new Date(Date.now() + 3600_000).toISOString(),
      },
    });

    await page.goto('/verificar-correo?token=TokDeEjemplo_123');

    await expect(page).not.toHaveURL(/verificar-correo/);
    const [llamada] = api.llamadas('POST', 'auth/verificar-correo');
    expect(llamada.cuerpo).toEqual({ token: 'TokDeEjemplo_123' });
    expect(await page.evaluate(() => localStorage.getItem('cb.access_token'))).toMatch(/^ey/);
  });

  test('un enlace vencido muestra el detalle del back y permite pedir otro correo', async ({ page, api }) => {
    api.on('POST', 'auth/verificar-correo', problema(400, 'El enlace de verificación venció; pide que te enviemos otro.'));
    api.on('POST', 'auth/reenviar-verificacion', { body: { mensaje: 'Si el correo existe, te enviamos otro enlace.' } });

    await page.goto('/verificar-correo?token=vencido');

    await expect(page.getByText('El enlace de verificación venció; pide que te enviemos otro.')).toBeVisible();
    await page.getByLabel(/correo/i).fill('alumno@ejemplo.test');
    await page.getByRole('button', { name: /reenviar|enviar/i }).click();

    await expect.poll(() => api.llamadas('POST', 'auth/reenviar-verificacion').length).toBe(1);
    expect(api.llamadas('POST', 'auth/reenviar-verificacion')[0].cuerpo).toEqual({ correo: 'alumno@ejemplo.test' });
  });

  test('un enlace sin token avisa sin llamar al back', async ({ page, api }) => {
    await page.goto('/verificar-correo');

    await expect(page.getByText(/no trae el código de verificación/i)).toBeVisible();
    expect(api.llamadas('POST', 'auth/verificar-correo')).toHaveLength(0);
  });

  test('un token ya usado (400) no deja sesión iniciada', async ({ page, api }) => {
    api.on('POST', 'auth/verificar-correo', problema(400, 'El enlace de verificación no es válido o ya se usó.'));

    await page.goto('/verificar-correo?token=usado');

    await expect(page.getByText('El enlace de verificación no es válido o ya se usó.')).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('cb.access_token'))).toBeNull();
  });
});
