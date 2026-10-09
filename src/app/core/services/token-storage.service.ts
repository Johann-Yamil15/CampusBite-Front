import { Injectable, signal } from '@angular/core';

const TOKEN_KEY = 'cb.access_token';

/**
 * Persistencia del token de acceso en localStorage (sobrevive a recargas y pestañas nuevas).
 * `token` es un signal: quien dependa de él (guards, facade, vistas) se actualiza solo.
 * Recomendación para producción: que el backend emita el refresh token en una
 * cookie HttpOnly + Secure + SameSite y aquí solo viva el access token (corta duración).
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly _token = signal<string | null>(readToken());
  readonly token = this._token.asReadonly();

  get(): string | null {
    return this._token();
  }

  set(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Storage bloqueado (modo privado, cuota llena): la sesión vive solo en memoria.
    }
    this._token.set(token);
  }

  clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Storage bloqueado: basta con limpiar el signal.
    }
    this._token.set(null);
  }
}

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
