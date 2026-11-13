import { Injectable, WritableSignal, computed, inject, signal } from '@angular/core';
import { Observable, catchError, defer, finalize, forkJoin, map, of, tap } from 'rxjs';
import { ApiError } from '@core/http/api-error';
import { FavoritosRepository } from '@features/alumno/domain/repositories/favoritos.repository';
import {
  CafeteriaFavorita,
  PlatilloFavorito,
  TipoFavorito,
} from '@features/alumno/domain/models/favorito.model';

/**
 * CL-Sprint5 11/11/2026: cafeterías favoritas del alumno. Se provee en alumno.routes.ts (solo la usa el
 * alumno). Los métodos devuelven un Observable frío: hay que suscribirse.
 *
 * CL-Sprint5 11/11/2026 (etapa 7): platillos y cafeterías en un solo estado, compartido por todas las
 * pantallas del alumno (una instancia en el layout), así el corazón se ve igual en el inicio, el buscador,
 * la tienda y Favoritos.
 *   - `alternar` cambia el corazón en el acto (los ids) y, si el back falla, lo regresa como estaba.
 *   - Al quitar se recuerda la posición: si se vuelve a agregar (el "Deshacer" del aviso), regresa a su
 *     lugar en la lista en vez de irse al principio.
 *   - `cargar` trae los dos tipos una vez; con `forzar` vuelve a pedirlos (Reintentar, entrar a Favoritos).
 */
@Injectable()
export class FavoritosFacade {
  private readonly repo = inject(FavoritosRepository);

  private readonly _cafeterias = signal<CafeteriaFavorita[]>([]);
  private readonly _platillos = signal<PlatilloFavorito[]>([]);
  /** Ids con el cambio optimista ya aplicado (lo que pinta el corazón). */
  private readonly _idsCafeterias = signal<ReadonlySet<string>>(new Set());
  private readonly _idsPlatillos = signal<ReadonlySet<string>>(new Set());
  /** Dónde estaba cada favorito que se quitó, para devolverlo a su lugar. */
  private readonly posiciones = new Map<string, number>();
  private cargado = false;

  readonly cafeterias = this._cafeterias.asReadonly();
  readonly platillos = this._platillos.asReadonly();
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  /** Ids de las cafeterías favoritas. */
  readonly ids = this._idsCafeterias.asReadonly();
  readonly idsPlatillos = this._idsPlatillos.asReadonly();
  readonly total = computed(() => this._idsCafeterias().size + this._idsPlatillos().size);

  /** Trae platillos y cafeterías. Si ya se cargaron no vuelve a pedirlos, salvo con `forzar`. */
  cargar(forzar = false): Observable<void> {
    if (this.cargado && !forzar) return of(undefined);
    return defer(() => {
      this.cargando.set(true);
      this.error.set(null);
      return forkJoin([this.repo.listarCafeterias(), this.repo.listarPlatillos()]).pipe(
        tap({
          next: ([cafeterias, platillos]) => {
            this._cafeterias.set(cafeterias);
            this._platillos.set(platillos);
            this._idsCafeterias.set(new Set(cafeterias.map((c) => c.idCafeteria)));
            this._idsPlatillos.set(new Set(platillos.map((p) => p.idProducto)));
            this.cargado = true;
          },
          error: (e: ApiError) => this.error.set(e?.message ?? 'No se pudieron cargar tus favoritos.'),
        }),
        map(() => undefined),
        finalize(() => this.cargando.set(false)),
      );
    });
  }

  esFavorito(tipo: TipoFavorito, id: string): boolean {
    return (tipo === 'cafeteria' ? this._idsCafeterias() : this._idsPlatillos()).has(id);
  }

  /**
   * Agrega o quita. El corazón cambia en el acto; si el back falla, todo regresa como estaba y el error
   * le llega a quien se suscribe.
   * @returns `true` si quedó como favorito.
   */
  alternar(tipo: TipoFavorito, id: string): Observable<boolean> {
    return tipo === 'cafeteria'
      ? this.alternarEn(id, this._cafeterias, this._idsCafeterias, (c) => c.idCafeteria, {
          agregar: (x) => this.repo.agregarCafeteria(x),
          quitar: (x) => this.repo.quitarCafeteria(x),
        })
      : this.alternarEn(id, this._platillos, this._idsPlatillos, (p) => p.idProducto, {
          agregar: (x) => this.repo.agregarPlatillo(x),
          quitar: (x) => this.repo.quitarPlatillo(x),
        });
  }

  private alternarEn<T>(
    id: string,
    lista: WritableSignal<T[]>,
    ids: WritableSignal<ReadonlySet<string>>,
    idDe: (x: T) => string,
    api: { agregar: (id: string) => Observable<T>; quitar: (id: string) => Observable<void> },
  ): Observable<boolean> {
    return defer(() => {
      const antesLista = lista();
      const antesIds = ids();
      const revertir = (e: unknown): never => {
        lista.set(antesLista);
        ids.set(antesIds);
        throw e;
      };

      if (antesIds.has(id)) {
        const posicion = antesLista.findIndex((x) => idDe(x) === id);
        if (posicion >= 0) this.posiciones.set(id, posicion);
        ids.set(sin(antesIds, id));
        lista.set(antesLista.filter((x) => idDe(x) !== id));
        return api.quitar(id).pipe(
          map(() => false),
          catchError(revertir),
        );
      }

      ids.set(con(antesIds, id));
      return api.agregar(id).pipe(
        tap((nuevo) =>
          lista.update((l) => {
            const resto = l.filter((x) => idDe(x) !== id);
            const posicion = Math.min(this.posiciones.get(id) ?? 0, resto.length);
            this.posiciones.delete(id);
            return [...resto.slice(0, posicion), nuevo, ...resto.slice(posicion)];
          }),
        ),
        map(() => true),
        catchError(revertir),
      );
    });
  }
}

function con(ids: ReadonlySet<string>, id: string): ReadonlySet<string> {
  return new Set([...ids, id]);
}

function sin(ids: ReadonlySet<string>, id: string): ReadonlySet<string> {
  const copia = new Set(ids);
  copia.delete(id);
  return copia;
}
