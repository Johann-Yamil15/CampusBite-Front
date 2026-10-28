import { AuthResponseDto } from '@features/auth/data/dtos/auth.dto';
import { AuthMapper } from './auth.mapper';

const authResponse = (extra: Partial<AuthResponseDto> = {}): AuthResponseDto => ({
  usuarioId: 'u-1',
  correo: 'a@b.mx',
  rol: 'AdminCafeteria',
  token: 'jwt',
  expiraEn: '2026-10-09T12:00:00Z',
  ...extra,
});

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

  // CL-Sprint4 28/10/2026: HU-07B. idCafeteria es opcional: se usa si viene y no aparece si no
  it('sin idCafeteria el usuario no trae cafeteriaId', () => {
    const user = AuthMapper.toUser({
      id: 'u-1',
      correo: 'a@b.mx',
      rol: 'AdminCafeteria',
      idCafeteria: null,
    });
    expect('cafeteriaId' in user).toBe(false);
    expect('cafeteriaId' in AuthMapper.toSession(authResponse()).user).toBe(false);
  });

  it('con idCafeteria lo pasa a cafeteriaId en /me y en la sesión', () => {
    expect(
      AuthMapper.toUser({ id: 'u-1', correo: 'a@b.mx', rol: 'AdminCafeteria', idCafeteria: 'c-1' })
        .cafeteriaId,
    ).toBe('c-1');
    expect(AuthMapper.toSession(authResponse({ idCafeteria: 'c-1' })).user.cafeteriaId).toBe('c-1');
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

  // JJ-Sprint3 21/10/2026: TEC-12
  it('arma el body de restablecer-password', () => {
    expect(AuthMapper.toRestablecerPasswordRequest('a@b.mx', 'nuevaSecreta123')).toEqual({
      correo: 'a@b.mx',
      nuevaPassword: 'nuevaSecreta123',
    });
  });
});
