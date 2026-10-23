import { Injectable, inject, signal } from '@angular/core';
import { Observable, defer, finalize, tap } from 'rxjs';
import { ApiError } from '@core/http/api-error';
import { CafeteriaRepository } from '@features/cafeterias/domain/repositories/cafeteria.repository';
import { Cafeteria, CafeteriaData } from '@features/cafeterias/domain/models/cafeteria.model';

/**
 * CL-Sprint3 20/10/2026: HU-06B. "Controlador" de cafeterías: orquesta las llamadas a `api/cafeterias`
 * y expone estado reactivo (signals) a las vistas. Las vistas nunca hablan con HTTP directamente.
 *
 * Todos los métodos devuelven un `Observable` frío: **hay que suscribirse** para que se haga la petición.
 * Al responder, los signals se actualizan solos; si falla, el mensaje (en español, del backend) queda en `error()`.
 *
 * Uso desde una página (HU-06A):
 * ```ts
 * protected readonly cafeterias = inject(CafeteriaFacade);
 * ngOnInit() { this.cafeterias.load({ includeInactive: true }).subscribe(); }
 * guardar() {
 *   this.cafeterias.create(this.form.getRawValue()).subscribe({
 *     next: () => this.router.navigate(['/admin/cafeterias']),
 *     error: () => {}, // el mensaje ya queda en cafeterias.error()
 *   });
 * }
 * ```
 * En el template: `cafeterias.list()`, `cafeterias.loading()` y `cafeterias.error()`.
 *
 * Permisos (los valida el backend; la UI solo debería ocultar lo que el rol no puede hacer):
 * - Cualquier usuario con sesión: `load()` (solo activas) y `loadById()`.
 * - `AdminSistema`: todo, incluido `load({ includeInactive: true })`, `create`, `deactivate`, `reactivate`.
 * - `AdminCafeteria`: `update()` solo de SU cafetería (otra → 403).
 * Un 401 lo maneja el `errorInterceptor` (cierra sesión y manda al login).
 */
@Injectable({ providedIn: 'root' })
export class CafeteriaFacade {
  private readonly repo = inject(CafeteriaRepository);

  private readonly _list = signal<Cafeteria[]>([]);
  private readonly _selected = signal<Cafeteria | null>(null);
  /** Si la última carga de la lista incluyó inactivas (decide qué hacer con la lista al dar de baja). */
  private includesInactive = false;

  /** Cafeterías de la última carga (`load`), ordenadas por nombre. */
  readonly list = this._list.asReadonly();
  /** Cafetería en detalle/edición. La llenan `loadById`, `create`, `update` y `select`. */
  readonly selected = this._selected.asReadonly();
  /** `true` mientras haya una petición en curso. */
  readonly loading = signal(false);
  /** Mensaje del último error, o `null`. Se limpia al empezar otra operación. */
  readonly error = signal<string | null>(null);

  /**
   * Lista las cafeterías (`GET api/cafeterias`), ordenadas por nombre, y actualiza `list`.
   * @param options.includeInactive `true` incluye las dadas de baja. Solo `AdminSistema`; otro rol → 403.
   * @returns La lista. Falla con `ApiError` (403 = el rol no puede ver inactivas).
   */
  load(options: { includeInactive?: boolean } = {}): Observable<Cafeteria[]> {
    const includeInactive = options.includeInactive ?? false;
    return this.track(() =>
      this.repo.list(includeInactive).pipe(
        tap((cafeterias) => {
          this.includesInactive = includeInactive;
          this._list.set(cafeterias);
        }),
      ),
    );
  }

  /**
   * Consulta una cafetería (`GET api/cafeterias/{id}`) y la deja en `selected`.
   * Una inactiva solo la ven `AdminSistema` y su encargado; para los demás es 404.
   * @returns La cafetería. Falla con `ApiError` (404 = no existe o no la puedes ver).
   */
  loadById(id: string): Observable<Cafeteria> {
    return this.track(() =>
      this.repo.getById(id).pipe(tap((cafeteria) => this._selected.set(cafeteria))),
    );
  }

  /**
   * Da de alta una cafetería (`POST api/cafeterias`, 201). Solo `AdminSistema`.
   * La agrega a `list` y la deja en `selected`.
   * @param data Datos de la cafetería (ver límites en `CAFETERIA_LIMITS`).
   * @returns La cafetería creada (nace activa). Falla con `ApiError`: 400 = datos inválidos (detalle por campo
   *   en `errors`: `Nombre`, `Ubicacion`, `PuntoEntrega`, `MetodosPago`...), 403 = rol sin permiso,
   *   409 = ya existe una cafetería con ese nombre.
   */
  create(data: CafeteriaData): Observable<Cafeteria> {
    return this.track(() =>
      this.repo.create(data).pipe(
        tap((created) => {
          this._list.update((list) => sortByName([...list, created]));
          this._selected.set(created);
        }),
      ),
    );
  }

  /**
   * Edita una cafetería (`PUT api/cafeterias/{id}`). Reemplaza TODOS los datos y los métodos de pago
   * (manda el objeto completo, no solo lo que cambió). `AdminSistema` o el encargado de esa cafetería.
   * Actualiza `list` y `selected`. No cambia `active` (para eso `deactivate`/`reactivate`).
   * @returns La cafetería actualizada. Falla con `ApiError`: 400 = datos inválidos, 403 = sin permiso
   *   (p. ej. encargado de otra cafetería), 404 = no existe, 409 = nombre repetido.
   */
  update(id: string, data: CafeteriaData): Observable<Cafeteria> {
    return this.track(() =>
      this.repo.update(id, data).pipe(
        tap((updated) => {
          this._list.update((list) => sortByName(list.map((c) => (c.id === id ? updated : c))));
          this._selected.set(updated);
        }),
      ),
    );
  }

  /**
   * Baja lógica (`DELETE api/cafeterias/{id}`, 204). Solo `AdminSistema`. No borra nada: la cafetería deja de
   * aparecer para los alumnos y de aceptar órdenes, y se conserva su historial. Repetirla no es error.
   * En `list` se marca inactiva si la lista incluye inactivas; si no, se quita.
   * @returns Completa sin valor. Falla con `ApiError`: 403 = rol sin permiso, 404 = no existe,
   *   409 = tiene órdenes en curso (hay que terminarlas o cancelarlas antes).
   */
  deactivate(id: string): Observable<void> {
    return this.track(() =>
      this.repo.deactivate(id).pipe(
        tap(() => {
          this._list.update((list) =>
            this.includesInactive
              ? list.map((c) => (c.id === id ? { ...c, active: false } : c))
              : list.filter((c) => c.id !== id),
          );
          this.patchSelected(id, false);
        }),
      ),
    );
  }

  /**
   * Reactiva una cafetería dada de baja (`POST api/cafeterias/{id}/reactivar`, 204). Solo `AdminSistema`.
   * Repetirla no es error.
   * @returns Completa sin valor. Falla con `ApiError`: 403 = rol sin permiso, 404 = no existe.
   */
  reactivate(id: string): Observable<void> {
    return this.track(() =>
      this.repo.reactivate(id).pipe(
        tap(() => {
          this._list.update((list) => list.map((c) => (c.id === id ? { ...c, active: true } : c)));
          this.patchSelected(id, true);
        }),
      ),
    );
  }

  /** Fija la cafetería en `selected` sin ir al backend (p. ej. al dar clic en una fila de la lista). */
  select(cafeteria: Cafeteria | null): void {
    this._selected.set(cafeteria);
  }

  /** Limpia el mensaje de error (p. ej. al abrir el formulario). */
  clearError(): void {
    this.error.set(null);
  }

  // Actualiza loading/error alrededor de cada petición, igual que AuthFacade
  // (recibe una fábrica: el repositorio no se llama hasta que alguien se suscribe)
  private track<T>(request: () => Observable<T>): Observable<T> {
    return defer(() => {
      this.loading.set(true);
      this.error.set(null);
      return request().pipe(
        tap({ error: (err: ApiError) => this.error.set(firstErrorMessage(err)) }),
        finalize(() => this.loading.set(false)),
      );
    });
  }

  private patchSelected(id: string, active: boolean): void {
    this._selected.update((c) => (c?.id === id ? { ...c, active } : c));
  }
}

function sortByName(list: Cafeteria[]): Cafeteria[] {
  return list.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
}

// En un 400 muestra el primer mensaje de validación del backend (en español), como en AuthFacade
function firstErrorMessage(err: ApiError): string {
  const firstFieldError = Object.values(err.errors ?? {}).flat()[0];
  return firstFieldError ?? err.message;
}
