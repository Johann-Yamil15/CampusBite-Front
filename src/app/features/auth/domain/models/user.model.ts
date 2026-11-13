/** Entidad de dominio: independiente de cómo la devuelva el API. */
// JJ-Sprint3 21/10/2026: lista de roles del backend (enum RolUsuario) para validar el claim del token
export const USER_ROLES = ['Alumno', 'AdminCafeteria', 'AdminSistema'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface User {
  id: string;
  email: string;
  role: UserRole;
  /** CL-Sprint5 13/11/2026: nombre que manda el back en login y /me (claim del token). */
  name: string;
  /**
   * CL-Sprint4 28/10/2026: HU-07B. Cafetería del encargado (solo AdminCafeteria; el back manda null para los
   * demás roles y entonces el campo no existe).
   */
  cafeteriaId?: string;
}

/**
 * CL-Sprint5 13/11/2026: resultado del registro (alumno o negocio). La cuenta queda creada pero sin sesión
 * hasta que el usuario abra el enlace del correo (`/verificar-correo?token=...`).
 */
export interface RegistroPendiente {
  email: string;
  /** false: la cuenta se creó pero el correo no salió; puede pedir que se reenvíe. */
  emailSent: boolean;
  /** Texto del back para mostrar tal cual. */
  message: string;
}

export interface Credentials {
  email: string;
  password: string;
}

/** Datos para registrar un alumno nuevo. */
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  /** Matrícula escolar (opcional). */
  studentId?: string;
  /** Teléfono de 10 a 15 dígitos (opcional). */
  phone?: string;
}

export interface Session {
  user: User;
  accessToken: string;
  expiresAt: Date;
}

// JJ-Sprint3 21/10/2026: TEC-11. Métodos de pago que acepta el backend (enum MetodoPago). Se repite aquí en
// vez de importar @features/cafeterias: domain es TypeScript puro y no depende de otras features (ver README).
export const REGISTER_PAYMENT_METHODS = ['Tarjeta', 'Transferencia', 'Efectivo'] as const;
export type RegisterPaymentMethod = (typeof REGISTER_PAYMENT_METHODS)[number];

/** Datos para autorregistrar un negocio (crea su cafetería y el primer encargado; rol AdminCafeteria). */
export interface RegisterCafeteriaData {
  ownerName: string;
  email: string;
  password: string;
  /** Teléfono de 10 a 15 dígitos (opcional). */
  phone?: string;
  cafeteriaName: string;
  location: string;
  onCampus: boolean;
  pickupPoint: string;
  /** Al menos uno. */
  paymentMethods: RegisterPaymentMethod[];
}
