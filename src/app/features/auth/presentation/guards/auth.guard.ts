import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { AuthFacade } from '@features/auth/application/auth.facade';
import { resolverCafeteriaDelEncargado } from '@features/auth/application/resolver-cafeteria-del-encargado';
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
 * CL-Sprint4 28/10/2026: HU-07B. Va en la ruta raíz: si el encargado (AdminCafeteria) conoce su cafetería,
 * lo lleva a su panel `/negocio/{id}`. Los demás roles pasan sin hacer ninguna petición.
 * Si no la conoce (hoy el backend aún no manda `idCafeteria`), la busca con resolverCafeteriaDelEncargado
 * (TEMPORAL). Si tampoco así aparece, o hay error, lo lleva a `/negocio`: nunca al inicio del alumno.
 */
export const negocioHomeGuard: CanActivateFn = () => {
  const auth = inject(AuthFacade);
  const router = inject(Router);
  if (!auth.hasRole('AdminCafeteria')) return true;

  const toPanel = (cafeteriaId: string | null | undefined) =>
    router.createUrlTree(cafeteriaId ? ['/negocio', cafeteriaId] : ['/negocio']);

  const user = auth.user();
  if (user?.cafeteriaId) return toPanel(user.cafeteriaId);

  // TEMPORAL: borrar cuando el backend devuelva idCafeteria en login y /me (se crea aquí: necesita inject)
  const resolver$ = resolverCafeteriaDelEncargado();

  // Tras recargar la página `user` es null hasta consultar /me
  const known$ = user
    ? of(user.cafeteriaId)
    : auth.loadCurrentUser().pipe(
        map((u) => u.cafeteriaId),
        catchError(() => of(undefined)),
      );

  return known$.pipe(
    switchMap((cafeteriaId) => (cafeteriaId ? of(cafeteriaId) : resolver$)),
    map(toPanel),
    catchError(() => of(toPanel(null))),
  );
};

/** Solo visitantes (p. ej. la pantalla de login). */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthFacade);
  const router = inject(Router);
  return auth.hasValidSession() ? router.createUrlTree(['/']) : true;
};
