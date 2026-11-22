// JWT de prueba para sembrar la sesión del front. El front solo DECODIFICA el payload (nunca valida la firma: eso lo
// hace el back), así que para las pruebas con mocks basta una firma cualquiera. Los claims son los que emite el back.

export type RolPrueba = 'Alumno' | 'AdminCafeteria' | 'AdminSistema';

export interface DatosSesion {
  id: string;
  rol: RolPrueba;
  nombre: string;
  correo: string;
  idCafeteria: string | null;
}

export const ALUMNO: DatosSesion = {
  id: '00000000-0000-0000-0000-0000000000a1',
  rol: 'Alumno',
  nombre: 'Alumno de Prueba',
  correo: 'alumno@ejemplo.test',
  idCafeteria: null,
};

export const CAFETERIA_ID = '00000000-0000-0000-0000-0000000000c1';

export const ENCARGADO: DatosSesion = {
  id: '00000000-0000-0000-0000-0000000000a2',
  rol: 'AdminCafeteria',
  nombre: 'Encargado Cafetería',
  correo: 'cafeteria@ejemplo.test',
  idCafeteria: CAFETERIA_ID,
};

export const ADMIN: DatosSesion = {
  id: '00000000-0000-0000-0000-0000000000a3',
  rol: 'AdminSistema',
  nombre: 'Admin Sistema',
  correo: 'admin@ejemplo.test',
  idCafeteria: null,
};

const base64url = (texto: string) => Buffer.from(texto, 'utf8').toString('base64url');

/** Token sin firma real: `exp` en segundos (por defecto, una hora adelante; pasa un valor negativo para uno vencido). */
export function crearJwt(sesion: DatosSesion, segundosDeVida = 3600): string {
  const ahora = Math.floor(Date.now() / 1000);
  const payload: Record<string, unknown> = {
    sub: sesion.id,
    email: sesion.correo,
    role: sesion.rol,
    name: sesion.nombre,
    iat: ahora,
    exp: ahora + segundosDeVida,
  };
  if (sesion.idCafeteria) payload['id_cafeteria'] = sesion.idCafeteria;
  return `${base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${base64url(JSON.stringify(payload))}.firma-de-prueba`;
}
