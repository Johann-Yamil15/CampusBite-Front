import { createHmac } from 'node:crypto';
import type { DatosSesion } from './jwt';

// JWT FIRMADO igual que el back (HS256) para las pruebas contra el back real local. La llave es la que se le dio al
// back al arrancarlo (variable JWT_KEY): nunca se versiona ni es la de producción.
const b64 = (x: Buffer | string) => Buffer.from(x).toString('base64url');

export function jwtFirmado(sesion: DatosSesion, opciones: { llave?: string; segundosDeVida?: number } = {}): string {
  const llave = opciones.llave ?? process.env['JWT_KEY'];
  if (!llave) throw new Error('Define JWT_KEY (la misma llave Jwt__Key con la que arrancó el back local).');
  const ahora = Math.floor(Date.now() / 1000);
  const payload: Record<string, unknown> = {
    sub: sesion.id,
    email: sesion.correo,
    jti: crypto.randomUUID(),
    role: sesion.rol,
    name: sesion.nombre,
    iss: process.env['JWT_ISSUER'] ?? 'CampusBite.API',
    aud: process.env['JWT_AUDIENCE'] ?? 'CampusBite.PWA',
    iat: ahora,
    nbf: ahora,
    exp: ahora + (opciones.segundosDeVida ?? 3600),
  };
  if (sesion.idCafeteria) payload['id_cafeteria'] = sesion.idCafeteria;
  const cuerpo = `${b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${b64(JSON.stringify(payload))}`;
  return `${cuerpo}.${createHmac('sha256', llave).update(cuerpo).digest('base64url')}`;
}
