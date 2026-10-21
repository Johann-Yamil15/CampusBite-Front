import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, defer, finalize, tap } from 'rxjs';
import { Router } from '@angular/router';
import { ApiError } from '@core/http/api-error';
import { TokenStorageService } from '@core/services/token-storage.service';
import { isJwtActive, readJwtClaim } from '@core/utils/jwt.util';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import {
  Credentials,
  RegisterData,
  Session,
  USER_ROLES,
  User,
  UserRole,
} from '@features/auth/domain/models/user.model';

/**
 * "Controlador" de autenticación: orquesta casos de uso y expone estado
 * reactivo (signals) a las vistas. Las vistas nunca hablan con HTTP directamente.
 *
 * Uso desde una página (HU-01A):
 * ```ts
 * protected readonly auth = inject(AuthFacade);
 * this.auth.login({ email, password }).subscribe({
 *   next: () => this.router.navigateByUrl(returnUrl),
 *   error: () => {}, // el mensaje ya queda en auth.error()
 * });
 * ```
 * En el template: `auth.isLoading()` para deshabilitar el botón y `auth.error()` para la alerta.
 */
@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly repo = inject(AuthRepository);
  private readonly tokens = inject(TokenStorageService);
  private readonly router = inject(Router);

  private readonly _user = signal<User | null>(null);

  /** `true` mientras haya un JWT guardado y no vencido. Reacciona a login/registro/logout. */
  readonly isAuthenticated = computed(() => isJwtActive(this.tokens.token()));

  /**
   * Usuario de la sesión actual. Se llena con `login()`, `registro()` o `loadCurrentUser()`;
   * vale `null` si no hay sesión (p. ej. tras recargar, hasta llamar a `loadCurrentUser()`).
   */
  readonly user = computed(() => (this.isAuthenticated() ? this._user() : null));

  /**
   * JJ-Sprint3 21/10/2026: rol de la sesión, leído del claim `role` del JWT (sobrevive a recargas).
   * Solo decide qué mostrar; los permisos reales los valida el backend (403).
   */
  readonly role = computed<UserRole | null>(() => {
    if (!this.isAuthenticated()) return null;
    const role = readJwtClaim(this.tokens.token(), 'role');
    return USER_ROLES.find((r) => r === role) ?? null;
  });

  /** `true` si hay sesión vigente y su rol es alguno de `roles`. */
  hasRole(...roles: UserRole[]): boolean {
    const role = this.role();
    return role !== null && roles.includes(role);
  }

  // FB-Sprint2 10/10/2026: Signals de estado para la vista (UI)
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  /**
   * Inicia sesión (`POST api/Auth/login`). Si responde OK guarda el token y el usuario.
   * @param credentials Correo y contraseña.
   * @returns La sesión creada. Falla con `ApiError` (401 = correo o contraseña incorrectos,
   *   400 = datos con formato inválido, 0 = sin conexión con el servidor).
   */
  login(credentials: Credentials): Observable<Session> {
    return this.trackSession(this.repo.login(credentials));
  }

  /**
   * Registra un alumno (`POST api/Auth/registro`) y deja la sesión iniciada con el token devuelto.
   * Reglas del backend: nombre 2–80, contraseña 8–72, teléfono 10–15 dígitos (opcional),
   * matrícula máx. 20 (opcional).
   * @param data Datos del alumno.
   * @returns La sesión creada. Falla con `ApiError` (409 = correo o matrícula ya registrados,
   *   400 = datos que no cumplen el formato; ver `errors` para el detalle por campo).
   */
  registro(data: RegisterData): Observable<Session> {
    return this.trackSession(this.repo.registro(data));
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
   * No llama al backend (el JWT no se revoca en el servidor).
   */
  logout(): void {
    this.tokens.clear();
    this._user.set(null);
    this.router.navigate(['/login']);
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

  /** Limpia el mensaje de error (p. ej. al entrar a la pantalla de login o registro). */
  clearError(): void {
    this.error.set(null);
  }

  // JJ-Sprint2 11/10/2026: une HU-01A y HU-01B; actualiza isLoading/error y guarda la sesión al responder
  private trackSession(request$: Observable<Session>): Observable<Session> {
    return defer(() => {
      this.isLoading.set(true);
      this.error.set(null);
      return request$.pipe(
        tap({
          next: (session) => this.startSession(session),
          error: (err: ApiError) => this.error.set(firstErrorMessage(err)),
        }),
        finalize(() => this.isLoading.set(false)),
      );
    });
  }

  private startSession(session: Session): void {
    this.tokens.set(session.accessToken);
    this._user.set(session.user);
  }
}

// JJ-Sprint2 11/10/2026: en un 400 muestra el primer mensaje de validación del backend (en español)
function firstErrorMessage(err: ApiError): string {
  const firstFieldError = Object.values(err.errors ?? {}).flat()[0];
  return firstFieldError ?? err.message;
}
