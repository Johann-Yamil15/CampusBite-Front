import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, defer, finalize, of, tap } from 'rxjs';
import { ApiError } from '@core/http/api-error';
import { OrdenesRepository } from '@features/ordenes/domain/repositories/ordenes.repository';
import {
  NuevaOrden,
  Orden,
  ReporteProblema,
  ReporteRecibido,
  enCurso,
} from '@features/ordenes/domain/models/orden.model';

/**
 * CL-Sprint5 11/11/2026: los pedidos del alumno con sesión. Reemplaza a PedidosAlumnoStore (JY-Sprint4) y a
 * OrdenService (FB-Sprint4). Lo usan el carrito (crear), "Mis pedidos", el detalle, el perfil y la insignia
 * del menú.
 *
 * Los métodos devuelven un Observable frío: hay que suscribirse. `cargando()` y `error()` son de la carga
 * de la lista; los errores de crear o cancelar le llegan a quien se suscribe (para mostrarlos en un toast).
 */
@Injectable({ providedIn: 'root' })
export class MisPedidosFacade {
  private readonly repo = inject(OrdenesRepository);

  private readonly _ordenes = signal<Orden[]>([]);
  private cargado = false;

  /** Más recientes primero. */
  readonly ordenes = this._ordenes.asReadonly();
  readonly enCurso = computed(() => this._ordenes().filter(enCurso));
  readonly historial = computed(() => this._ordenes().filter((o) => !enCurso(o)));
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  /** Carga los pedidos. Si ya se cargaron no vuelve a pedirlos, salvo con `forzar`. */
  cargar(forzar = false): Observable<Orden[]> {
    if (this.cargado && !forzar) return of(this._ordenes());

    return defer(() => {
      this.cargando.set(true);
      this.error.set(null);
      return this.repo.misOrdenes().pipe(
        tap({
          next: (ordenes) => {
            this._ordenes.set(ordenes);
            this.cargado = true;
          },
          error: (e: ApiError) =>
            this.error.set(e?.message ?? 'No se pudieron cargar tus pedidos.'),
        }),
        finalize(() => this.cargando.set(false)),
      );
    });
  }

  /**
   * CL-Sprint5 11/11/2026 (etapa 6): vuelve a pedir la lista sin tocar `cargando()` ni `error()`, para el
   * seguimiento en vivo: la pantalla no parpadea y un fallo de red momentáneo no tapa lo que ya se ve.
   */
  refrescar(): Observable<Orden[]> {
    return this.repo.misOrdenes().pipe(
      tap((ordenes) => {
        this._ordenes.set(ordenes);
        this.cargado = true;
      }),
    );
  }

  /** CL-Sprint5 11/11/2026 (etapa 6): como `refrescar`, para una sola orden (el detalle en vivo). */
  refrescarPedido(idOrden: string): Observable<Orden> {
    return this.repo.obtener(idOrden).pipe(tap((orden) => this.poner(orden)));
  }

  /** CL-Sprint5 11/11/2026 (etapa 6): "Reportar un problema". Los errores le llegan a quien se suscribe. */
  reportar(idOrden: string, reporte: ReporteProblema): Observable<ReporteRecibido> {
    return this.repo.reportar(idOrden, reporte);
  }

  /** Lee el signal: dentro de un computed se actualiza solo. */
  porId(idOrden: string): Orden | null {
    return this._ordenes().find((o) => o.idOrden === idOrden) ?? null;
  }

  /** Trae una orden con su detalle y la deja en la lista. */
  obtener(idOrden: string): Observable<Orden> {
    return defer(() => {
      this.cargando.set(true);
      this.error.set(null);
      return this.repo.obtener(idOrden).pipe(
        tap({
          next: (orden) => this.poner(orden),
          error: (e: ApiError) => this.error.set(e?.message ?? 'No se pudo cargar el pedido.'),
        }),
        finalize(() => this.cargando.set(false)),
      );
    });
  }

  /** Crea la orden con el carrito. La nueva queda primero en la lista. */
  crear(nueva: NuevaOrden): Observable<Orden> {
    return this.repo.crear(nueva).pipe(tap((orden) => this.poner(orden)));
  }

  /** Solo en pendiente o confirmada; si no, el back responde 400. */
  cancelar(idOrden: string): Observable<Orden> {
    return this.repo.cancelar(idOrden).pipe(tap((orden) => this.poner(orden)));
  }

  /** Reemplaza la orden si ya está en la lista; si no, la agrega al principio. */
  private poner(orden: Orden): void {
    this._ordenes.update((lista) =>
      lista.some((o) => o.idOrden === orden.idOrden)
        ? lista.map((o) => (o.idOrden === orden.idOrden ? orden : o))
        : [orden, ...lista],
    );
  }
}
