import { decodeJwtPayload, isJwtActive } from './jwt.util';

function fakeJwt(payload: object): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.firma`;
}

describe('jwt.util', () => {
  const now = Date.UTC(2026, 9, 9, 12, 0, 0);
  const inSeconds = (offset: number) => Math.floor(now / 1000) + offset;

  it('decodifica el payload', () => {
    expect(decodeJwtPayload(fakeJwt({ sub: 'u-1', exp: 123 }))).toEqual({ sub: 'u-1', exp: 123 });
  });

  it('regresa null si el token no es un JWT', () => {
    expect(decodeJwtPayload('no-es-jwt')).toBeNull();
    expect(decodeJwtPayload('a.%%%.c')).toBeNull();
  });

  it('considera activo un token con exp en el futuro', () => {
    expect(isJwtActive(fakeJwt({ exp: inSeconds(60) }), now)).toBe(true);
  });

  it('considera inactivo un token vencido, vacío o corrupto', () => {
    expect(isJwtActive(fakeJwt({ exp: inSeconds(-1) }), now)).toBe(false);
    expect(isJwtActive(null, now)).toBe(false);
    expect(isJwtActive('basura', now)).toBe(false);
  });
});
