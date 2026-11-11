import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, defer, finalize, forkJoin, map, of, tap } from 'rxjs';
import { ApiError } from '@core/http/api-error';
import { FavoritosRepository } from '@features/alumno/domain/repositories/favoritos.repository';
import { CafeteriaFavorita } from '@features/alumno/domain/models/favorito.model';

/**
 * CL-Sprint5 11/11/2026: cafeterías favoritas del alumno. Se provee en alumno.routes.ts (solo la usa el
 * alumno). Los métodos devuelven un Observable frío: hay que suscribirse.
 */
@Injectable()
export class FavoritosFacade {
  private readonly repo = inject(FavoritosRepository);

  private readonly _cafeterias = signal<CafeteriaFavorita[]>([]);
  /** Las que se quitaron en esta visita, para poder deshacer con `restaurar()`. */
  private readonly quitadas = signal<CafeteriaFavorita[]>([]);

  readonly cafeterias = this._cafeterias.asReadonly();
  /** Hay algo que deshacer con `restaurar()`. */
  readonly puedeRestaurar = computed(() => this.quitadas().length > 0);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  cargar(): Observable<CafeteriaFavorita[]> {
    return defer(() => {
      this.cargando.set(true);
      this.error.set(null);
      return this.repo.listarCafeterias().pipe(
        tap({
          next: (lista) => this._cafeterias.set(lista),
          error: (e: ApiError) =>
            this.error.set(e?.message ?? 'No se pudieron cargar tus favoritos.'),
        }),
        finalize(() => this.cargando.set(false)),
      );
    });
  }

  quitar(cafeteria: CafeteriaFavorita): Observable<void> {
    return this.repo.quitarCafeteria(cafeteria.idCafeteria).pipe(
      tap(() => {
        this._cafeterias.update((l) => l.filter((c) => c.idCafeteria !== cafeteria.idCafeteria));
        this.quitadas.update((l) => [...l, cafeteria]);
      }),
    );
  }

  /** Vuelve a guardar las que se quitaron en esta visita. */
  restaurar(): Observable<void> {
    const pendientes = this.quitadas();
    if (!pendientes.length) return of(undefined);
    return forkJoin(pendientes.map((c) => this.repo.agregarCafeteria(c.idCafeteria))).pipe(
      tap((agregadas) => {
        this._cafeterias.update((l) => [...l, ...agregadas]);
        this.quitadas.set([]);
      }),
      map(() => undefined),
    );
  }
}
