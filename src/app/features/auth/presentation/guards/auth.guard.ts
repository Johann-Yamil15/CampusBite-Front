import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, ResolveFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
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

/**
 * CL-Sprint4 28/10/2026: HU-07B. Va en la ruta raíz: el encargado (AdminCafeteria) nunca ve el
 * inicio del alumno, va a su panel `/mi-negocio`. Los demás roles pasan sin hacer ninguna petición.
 */
export const negocioHomeGuard: CanActivateFn = () =>
  inject(AuthFacade).hasRole('AdminCafeteria')
    ? inject(Router).createUrlTree(['/mi-negocio'])
    : true;

/**
 * CL-Sprint4 28/10/2026: HU-07B. Resolver de `/mi-negocio`: da al panel el id de la cafetería del
 * encargado sin ponerlo en la URL. Usa `user.cafeteriaId` o, tras recargar, el de /me.
 * CL-Sprint5 13/11/2026: login y /me ya traen `idCafeteria`; se retiró la búsqueda TEMPORAL
 * (resolverCafeteriaDelEncargado). Si aun así no viene, o hay error, lleva a `/negocio`.
 */
export const cafeteriaDelEncargadoResolver: ResolveFn<string> = () => {
  const auth = inject(AuthFacade);
  const fallback = new RedirectCommand(inject(Router).parseUrl('/negocio'));

  const user = auth.user();
  if (user) return user.cafeteriaId ?? fallback;

  // Tras recargar la página `user` es null hasta consultar /me
  return auth.loadCurrentUser().pipe(
    map((u) => u.cafeteriaId ?? fallback),
    catchError(() => of(fallback)),
  );
};

/** Solo visitantes (p. ej. la pantalla de login). */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthFacade);
  const router = inject(Router);
  return auth.hasValidSession() ? router.createUrlTree(['/']) : true;
};
