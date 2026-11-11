import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, defer, finalize, of, tap } from 'rxjs';
import { ApiError } from '@core/http/api-error';
import { CatalogoRepository } from '@features/catalogo/domain/repositories/catalogo.repository';
import {
  MenuCafeteria,
  categorias,
  platillos,
} from '@features/catalogo/domain/models/catalogo.model';

/**
 * CL-Sprint5 11/11/2026: estado del catálogo del alumno (menú de las cafeterías activas). Lo usan el
 * inicio, el buscador y el carrito (métodos de pago de la cafetería). Reemplaza a MenuService de shared/menu.
 *
 * Como el resto de facades, los métodos devuelven un Observable frío: hay que suscribirse.
 * Si falla, el mensaje queda en `error()`.
 */
@Injectable({ providedIn: 'root' })
export class CatalogoFacade {
  private readonly repo = inject(CatalogoRepository);

  private readonly _menu = signal<MenuCafeteria[]>([]);
  private cargado = false;

  /** Menú de la última carga. */
  readonly menu = this._menu.asReadonly();
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  /** Todos los productos, cada uno con su cafetería. */
  readonly platillos = computed(() => platillos(this._menu()));
  readonly categorias = computed(() => categorias(this._menu()));

  /**
   * Carga el menú (`GET api/menu`). Si ya se cargó, responde con lo que hay sin volver a pedirlo, salvo
   * que se pase `forzar` (p. ej. "Reintentar").
   */
  cargar(forzar = false): Observable<MenuCafeteria[]> {
    if (this.cargado && !forzar) return of(this._menu());

    return defer(() => {
      this.cargando.set(true);
      this.error.set(null);
      return this.repo.listarMenu().pipe(
        tap({
          next: (menu) => {
            this._menu.set(menu);
            this.cargado = true;
          },
          error: (e: ApiError) => this.error.set(e?.message ?? 'No se pudo cargar el menú.'),
        }),
        finalize(() => this.cargando.set(false)),
      );
    });
  }

  /** La cafetería del menú cargado, o `null`. */
  cafeteria(idCafeteria: string | null): MenuCafeteria | null {
    return this._menu().find((c) => c.idCafeteria === idCafeteria) ?? null;
  }
}
