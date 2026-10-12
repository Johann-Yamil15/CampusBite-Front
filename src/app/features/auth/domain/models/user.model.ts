/** Entidad de dominio: independiente de cómo la devuelva el API. */
export type UserRole = 'Alumno' | 'AdminCafeteria' | 'AdminSistema';

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
