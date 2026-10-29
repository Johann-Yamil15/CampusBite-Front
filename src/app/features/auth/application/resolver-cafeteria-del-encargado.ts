// CL-Sprint4 28/10/2026: HU-07B.
// TEMPORAL: borrar cuando el backend devuelva idCafeteria en login y /me.
// Al borrarlo, quitar también: su uso en negocioHomeGuard (auth.guard.ts), AuthRepository.puedeVerProductos
// (domain y su implementación en AuthHttpRepository) y sus pruebas.
import { inject } from '@angular/core';
import { Observable, concatMap, defaultIfEmpty, defer, filter, from, map, of, take, tap } from 'rxjs';
import { TokenStorageService } from '@core/services/token-storage.service';
import { readJwtClaim } from '@core/utils/jwt.util';
import { CafeteriaFacade } from '@features/cafeterias';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';

/** Prefijo de la clave en localStorage, por usuario (claim `sub` del JWT), para no repetir la búsqueda al recargar. */
export const CAFETERIA_ENCARGADO_KEY = 'cb.cafeteria_encargado.';

/**
 * Averigua la cafetería del encargado (AdminCafeteria) mientras el backend no la mande:
 * lista las cafeterías activas y pide `GET cafeterias/{id}/productos` una por una, en orden. La primera que
 * responde 200 es la suya (las de otros negocios responden 403) y ahí se detiene.
 * Debe llamarse en un contexto de inyección (p. ej. dentro de un guard); el Observable es frío.
 * @returns El id de su cafetería, o `null` si ninguna respondió 200. Falla con `ApiError` ante cualquier
 *   error distinto de 403 (p. ej. 500 o sin conexión).
 */
export function resolverCafeteriaDelEncargado(): Observable<string | null> {
  const repo = inject(AuthRepository);
  const cafeterias = inject(CafeteriaFacade);
  const tokens = inject(TokenStorageService);

  return defer(() => {
    const userId = readJwtClaim(tokens.get(), 'sub');
    const key = userId ? CAFETERIA_ENCARGADO_KEY + userId : null;
    const saved = key ? readStorage(key) : null;
    if (saved) return of(saved);

    return cafeterias.load().pipe(
      concatMap((list) => from(list)),
      concatMap((cafeteria) =>
        repo.puedeVerProductos(cafeteria.id).pipe(
          filter(Boolean),
          map(() => cafeteria.id),
        ),
      ),
      // take(1) cancela el resto: no se piden más cafeterías tras la primera con 200
      take(1),
      defaultIfEmpty(null),
      tap((id) => {
        if (id && key) writeStorage(key, id);
      }),
    );
  });
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage bloqueado: se repetirá la búsqueda en la próxima recarga.
  }
}
