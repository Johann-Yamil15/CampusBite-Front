import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { TokenStorageService } from '@core/services/token-storage.service';
import { isJwtActive } from '@core/utils/jwt.util';
import { AuthRepository } from '@domain/repositories/auth.repository';
import { Credentials, RegisterData, Session, User } from '@domain/models/user.model';

/**
 * "Controlador" de autenticación: orquesta casos de uso y expone estado
 * reactivo (signals) a las vistas. Las vistas nunca hablan con HTTP directamente.
 *
 * Uso desde una página (HU-01A):
 * ```ts
 * private readonly auth = inject(AuthFacade);
 * this.auth.login({ email, password }).subscribe({
 *   next: () => this.router.navigateByUrl(returnUrl),
 *   error: (err: ApiError) => this.error.set(err.message),
 * });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly repo = inject(AuthRepository);
  private readonly tokens = inject(TokenStorageService);

  private readonly _user = signal<User | null>(null);

  /** `true` mientras haya un JWT guardado y no vencido. Reacciona a login/registro/logout. */
  readonly isAuthenticated = computed(() => isJwtActive(this.tokens.token()));

  /**
   * Usuario de la sesión actual. Se llena con `login()`, `registro()` o `loadCurrentUser()`;
   * vale `null` si no hay sesión (p. ej. tras recargar, hasta llamar a `loadCurrentUser()`).
   */
  readonly user = computed(() => (this.isAuthenticated() ? this._user() : null));

  /**
   * Inicia sesión (`POST api/Auth/login`). Si responde OK guarda el token y el usuario.
   * @param credentials Correo y contraseña.
   * @returns La sesión creada. Falla con `ApiError` (401 = correo o contraseña incorrectos,
   *   400 = datos con formato inválido, 0 = sin conexión con el servidor).
   */
  login(credentials: Credentials): Observable<Session> {
    return this.repo.login(credentials).pipe(tap((session) => this.startSession(session)));
  }

  /**
   * Registra un alumno (`POST api/Auth/registro`) y deja la sesión iniciada con el token devuelto.
   * Reglas del backend: nombre 2–80, contraseña mín. 8, teléfono 10–15 dígitos (opcional),
   * matrícula máx. 20 (opcional).
   * @param data Datos del alumno.
   * @returns La sesión creada. Falla con `ApiError` (409 = correo o matrícula ya registrados,
   *   400 = datos que no cumplen el formato; ver `errors` para el detalle por campo).
   */
  registro(data: RegisterData): Observable<Session> {
    return this.repo.registro(data).pipe(tap((session) => this.startSession(session)));
  }

  /**
   * Consulta el usuario del token actual (`GET api/Auth/me`) y actualiza `user`.
   * Útil al recargar la página, cuando el token sigue en localStorage pero `user` es `null`.
   * @returns El usuario. Con 401 el `errorInterceptor` cierra la sesión y manda al login.
   */
  loadCurrentUser(): Observable<User> {
    return this.repo.me().pipe(tap((user) => this._user.set(user)));
  }

  /**
   * Cierra la sesión localmente: borra el token de localStorage y el usuario.
   * No llama al backend (el JWT no se revoca en el servidor). La navegación la decide quien llama.
   */
  logout(): void {
    this.tokens.clear();
    this._user.set(null);
  }

  /**
   * Revalida la sesión contra el reloj actual (lo usan los guards en cada navegación).
   * Si el token ya venció, lo elimina para que todo el estado reactivo se actualice.
   */
  hasValidSession(): boolean {
    const token = this.tokens.token();
    if (token && !isJwtActive(token)) {
      this.logout();
    }
    return this.isAuthenticated();
  }

  private startSession(session: Session): void {
    this.tokens.set(session.accessToken);
    this._user.set(session.user);
  }
}
