import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, defer, finalize, forkJoin, map, of, tap } from 'rxjs';
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

  /** Ids de las favoritas, para pintar el corazón de las tarjetas. */
  readonly ids = computed(() => new Set(this._cafeterias().map((c) => c.idCafeteria)));

  esFavorita(idCafeteria: string): boolean {
    return this.ids().has(idCafeteria);
  }

  /**
   * CL-Sprint5 11/11/2026 (etapa 3): corazón de las tarjetas del inicio y la tienda. Cambia en el acto
   * (respuesta inmediata al toque) y, si el back falla, lo regresa como estaba y propaga el error.
   * @returns `true` si quedó como favorita.
   */
  alternar(idCafeteria: string): Observable<boolean> {
    return defer(() => {
      const antes = this._cafeterias();
      const actual = antes.find((c) => c.idCafeteria === idCafeteria);
      const revertir = (e: unknown) => {
        this._cafeterias.set(antes);
        throw e;
      };

      if (actual) {
        this._cafeterias.set(antes.filter((c) => c.idCafeteria !== idCafeteria));
        return this.repo.quitarCafeteria(idCafeteria).pipe(
          map(() => false),
          catchError(revertir),
        );
      }
      return this.repo.agregarCafeteria(idCafeteria).pipe(
        tap((favorita) => this._cafeterias.update((l) => [...l, favorita])),
        map(() => true),
        catchError(revertir),
      );
    });
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
