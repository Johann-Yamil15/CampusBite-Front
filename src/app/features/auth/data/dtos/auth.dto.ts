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

/** Respuesta de `POST api/Auth/login` (200) y `POST api/Auth/registro` (201). */
export interface AuthResponseDto {
  usuarioId: string;
  correo: string;
  rol: RolDto;
  token: string;
  /** Fecha ISO-8601 en UTC. */
  expiraEn: string;
}

/** Respuesta de `GET api/Auth/me` (claims del JWT). */
export interface MeResponseDto {
  id: string;
  correo: string;
  rol: RolDto;
}
