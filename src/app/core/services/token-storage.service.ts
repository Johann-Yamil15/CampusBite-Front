import { Injectable } from '@angular/core';

const TOKEN_KEY = 'cb.access_token';

/**
 * Persistencia del token de acceso.
 * Recomendación para producción: que el backend emita el refresh token en una
 * cookie HttpOnly + Secure + SameSite y aquí solo viva el access token (corta duración).
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  get(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  set(token: string): void {
    sessionStorage.setItem(TOKEN_KEY, token);
  }

  clear(): void {
    sessionStorage.removeItem(TOKEN_KEY);
  }
}
