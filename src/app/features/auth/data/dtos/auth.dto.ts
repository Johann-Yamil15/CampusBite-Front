/**
 * Forma EXACTA del contrato de `api/Auth` del backend .NET (System.Text.Json → camelCase).
 * Fuente: CampusBite-Back/Models/Dtos/Auth y Controllers/AuthController.cs. Ajustar si cambia el API.
 */

/** Roles del enum `RolUsuario` del backend (se serializa con `ToString()`). */
export type RolDto = 'Alumno' | 'AdminCafeteria' | 'AdminSistema';

/** Body de `POST api/Auth/login`. */
export interface LoginRequestDto {
  correo: string;
  password: string;
}

/** Body de `POST api/Auth/registro`. Validaciones del backend entre paréntesis. */
export interface RegistroRequestDto {
  /** Requerido (2–80 caracteres). */
  nombre: string;
  /** Requerido, formato email (máx. 120). */
  correo: string;
  /** Requerido (mín. 8 caracteres). */
  password: string;
  /** Opcional (máx. 20). */
  matricula?: string | null;
  /** Opcional, `^[0-9+]{10,15}$`. */
  telefono?: string | null;
}

/** Enum `MetodoPago` del backend; no acepta números. */
export type MetodoPagoDto = 'Tarjeta' | 'Transferencia' | 'Efectivo';

/** Body de `POST api/Auth/registro-cafeteria` (TEC-11). Crea el encargado y su cafetería en un solo paso. */
export interface RegistroCafeteriaRequestDto {
  /** Requerido (2–80). */
  nombreEncargado: string;
  /** Requerido, formato email (máx. 120). */
  correo: string;
  /** Requerido (8–72). */
  password: string;
  /** Opcional, `^[0-9+]{10,15}$`. */
  telefono?: string | null;
  /** Requerido (2–100), único sin distinguir mayúsculas. */
  nombreCafeteria: string;
  /** Requerido (máx. 150). */
  ubicacion: string;
  esDelCampus: boolean;
  /** Requerido (máx. 100). */
  puntoEntrega: string;
  /** Requerido, al menos uno. */
  metodosPago: MetodoPagoDto[];
}

/** Body de `POST api/Auth/restablecer-password` (TEC-12). Responde 200 exista o no el correo. */
export interface RestablecerPasswordRequestDto {
  correo: string;
  /** Requerido (8–72). */
  nuevaPassword: string;
}

/** Respuesta de `POST api/Auth/login` y `POST api/Auth/verificar-correo` (200). */
export interface AuthResponseDto {
  usuarioId: string;
  correo: string;
  rol: RolDto;
  /** CL-Sprint5 13/11/2026: nombre del usuario (sale del token). */
  nombre: string;
  /** CL-Sprint4 28/10/2026: HU-07B. Cafetería del encargado; null para Alumno y AdminSistema. */
  idCafeteria: string | null;
  token: string;
  /** Fecha ISO-8601 en UTC. */
  expiraEn: string;
}

/**
 * Respuesta de `GET api/Auth/me` (claims del JWT: el nombre no cambia hasta volver a iniciar sesión).
 * CL-Sprint5 13/11/2026: + nombre e idCafeteria.
 */
export interface MeResponseDto {
  id: string;
  correo: string;
  rol: RolDto;
  nombre: string;
  idCafeteria: string | null;
}

/**
 * CL-Sprint5 13/11/2026: respuesta (201) de `POST api/Auth/registro` y `registro-cafeteria`. Ya no inician
 * sesión: mandan un correo de verificación. Si `correoEnviado` es false, la cuenta sí se creó.
 */
export interface RegistroPendienteDto {
  correo: string;
  correoEnviado: boolean;
  mensaje: string;
}

/** Body de `POST api/Auth/verificar-correo` (el token del enlace del correo). */
export interface VerificarCorreoRequestDto {
  token: string;
}

/** Body de `POST api/Auth/reenviar-verificacion` (202 siempre, exista o no la cuenta). */
export interface ReenviarVerificacionRequestDto {
  correo: string;
}
