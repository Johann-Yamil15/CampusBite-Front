import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthFacade } from '@features/auth/application/auth.facade';
import { UserRole } from '@features/auth/domain/models/user.model';

/**
 * Solo usuarios con un JWT vigente. Si no hay sesión manda a /auth/login?returnUrl=<url pedida>.
 * Sirve tanto en `canActivate` como en `canActivateChild`.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthFacade);
  const router = inject(Router);

  return auth.hasValidSession()
    ? true
    : router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
};

/**
 * JJ-Sprint3 21/10/2026: solo usuarios con alguno de esos roles (p. ej. `roleGuard('AdminSistema')`).
 * Sin sesión → login con returnUrl; con sesión pero otro rol → inicio. El backend igual responde 403.
 */
export function roleGuard(...roles: UserRole[]): CanActivateFn {
  return (_route, state) => {
    const auth = inject(AuthFacade);
    const router = inject(Router);

    if (!auth.hasValidSession()) {
      return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
    }
    return auth.hasRole(...roles) ? true : router.createUrlTree(['/']);
  };
}

/** Solo visitantes (p. ej. la pantalla de login). */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthFacade);
  const router = inject(Router);
  return auth.hasValidSession() ? router.createUrlTree(['/']) : true;
};
