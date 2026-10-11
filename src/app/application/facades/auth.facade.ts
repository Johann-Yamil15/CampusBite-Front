import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
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
  private readonly router = inject(Router);

  private readonly _user = signal<User | null>(null);
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null || this.tokens.get() !== null);

  // FB-Sprint2 10/10/2026: Signals de estado para la vista (UI)
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  // FB-Sprint2 10/10/2026: Se suscribe internamente y actualiza los signals
  login(credentials: Credentials): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.repo.login(credentials).subscribe({
      next: (session) => {
        this.tokens.set(session.accessToken);
        this._user.set(session.user);
        this.isLoading.set(false);
        // Redirigir al usuario después del login exitoso
        this.router.navigate(['/']); 
      },
      error: (err) => {
        // Muestra el mensaje de error que viene del backend o el interceptor
        this.error.set(err.message || 'Correo o contraseña incorrectos.');
        this.isLoading.set(false);
      }
    });
  }
  // FB-Sprint2 10/10/2026: Envía la petición de registro, actualiza signals y redirige
  register(data: any): void {
    this.isLoading.set(true);
    this.error.set(null);

    // Nota: Usamos (this.repo as any) temporalmente por si el compañero que hizo 
    // el AuthRepository aún no ha declarado la firma de register().
    (this.repo as any).register(data).subscribe({
      next: (session: Session) => {
        this.tokens.set(session.accessToken);
        this._user.set(session.user);
        this.isLoading.set(false);
        this.router.navigate(['/']); 
      },
      error: (err: any) => {
        this.error.set(err.message || 'El correo ya está registrado o los datos son inválidos.');
        this.isLoading.set(false);
      }
    });
  }

  loadCurrentUser(): Observable<User> {
    return this.repo.me().pipe(tap((user) => this._user.set(user)));
  }

  logout(): void {
    this.tokens.clear();
    this._user.set(null);
    this.router.navigate(['/login']);
  }
}