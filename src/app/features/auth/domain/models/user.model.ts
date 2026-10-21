/** Entidad de dominio: independiente de cómo la devuelva el API. */
// JJ-Sprint3 21/10/2026: lista de roles del backend (enum RolUsuario) para validar el claim del token
export const USER_ROLES = ['Alumno', 'AdminCafeteria', 'AdminSistema'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface User {
  id: string;
  email: string;
  role: UserRole;
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
