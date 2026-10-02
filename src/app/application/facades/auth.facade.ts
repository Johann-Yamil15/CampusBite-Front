import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { TokenStorageService } from '@core/services/token-storage.service';
import { AuthRepository } from '@domain/repositories/auth.repository';
import { Credentials, Session, User } from '@domain/models/user.model';

/**
 * "Controlador" de autenticación: orquesta casos de uso y expone estado
 * reactivo (signals) a las vistas. Las vistas nunca hablan con HTTP directamente.
 */
@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly repo = inject(AuthRepository);
  private readonly tokens = inject(TokenStorageService);

  private readonly _user = signal<User | null>(null);
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null || this.tokens.get() !== null);

  login(credentials: Credentials): Observable<Session> {
    return this.repo.login(credentials).pipe(
      tap((session) => {
        this.tokens.set(session.accessToken);
        this._user.set(session.user);
      }),
    );
  }

  loadCurrentUser(): Observable<User> {
    return this.repo.me().pipe(tap((user) => this._user.set(user)));
  }

  logout(): void {
    this.tokens.clear();
    this._user.set(null);
  }
}
