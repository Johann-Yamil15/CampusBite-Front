import { AuthMapper } from './auth.mapper';

describe('AuthMapper', () => {
  it('convierte la respuesta de login/registro en una sesión de dominio', () => {
    const session = AuthMapper.toSession({
      usuarioId: 'u-1',
      correo: 'alumno@uttt.edu.mx',
      rol: 'Alumno',
      token: 'jwt',
      expiraEn: '2026-10-09T12:00:00Z',
    });

    expect(session).toEqual({
      user: { id: 'u-1', email: 'alumno@uttt.edu.mx', role: 'Alumno' },
      accessToken: 'jwt',
      expiresAt: new Date('2026-10-09T12:00:00Z'),
    });
  });

  it('convierte la respuesta de /me en un usuario', () => {
    expect(AuthMapper.toUser({ id: 'u-1', correo: 'a@b.mx', rol: 'AdminCafeteria' })).toEqual({
      id: 'u-1',
      email: 'a@b.mx',
      role: 'AdminCafeteria',
    });
  });

  it('arma el body de login con los nombres del backend', () => {
    expect(AuthMapper.toLoginRequest({ email: 'a@b.mx', password: 'secreto123' })).toEqual({
      correo: 'a@b.mx',
      password: 'secreto123',
    });
  });

  it('arma el body de registro y manda null en los opcionales vacíos', () => {
    expect(
      AuthMapper.toRegistroRequest({ name: 'Ana', email: 'a@b.mx', password: 'secreto123' }),
    ).toEqual({
      nombre: 'Ana',
      correo: 'a@b.mx',
      password: 'secreto123',
      matricula: null,
      telefono: null,
    });
  });

  // JJ-Sprint3 21/10/2026: TEC-11
  it('arma el body de registro-cafeteria y manda null en el teléfono vacío', () => {
    expect(
      AuthMapper.toRegistroCafeteriaRequest({
        ownerName: 'Ana',
        email: 'a@b.mx',
        password: 'secreto123',
        cafeteriaName: 'Cafetería Central',
        location: 'Edificio D',
        onCampus: true,
        pickupPoint: 'Mostrador',
        paymentMethods: ['Efectivo'],
      }),
    ).toEqual({
      nombreEncargado: 'Ana',
      correo: 'a@b.mx',
      password: 'secreto123',
      telefono: null,
      nombreCafeteria: 'Cafetería Central',
      ubicacion: 'Edificio D',
      esDelCampus: true,
      puntoEntrega: 'Mostrador',
      metodosPago: ['Efectivo'],
    });
  });
});
