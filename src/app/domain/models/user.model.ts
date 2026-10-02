/** Entidad de dominio: independiente de cómo la devuelva el API. */
export interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

export interface Credentials {
  email: string;
  password: string;
}

export interface Session {
  user: User;
  accessToken: string;
  expiresAt: Date;
}
