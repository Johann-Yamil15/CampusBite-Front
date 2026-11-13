import { Injectable, inject, signal } from '@angular/core';
import { Observable, defer, finalize, tap } from 'rxjs';
import { ApiError } from '@core/http/api-error';
import { OrdenesRepository } from '@features/ordenes/domain/repositories/ordenes.repository';
import { EstadoAvanceCafeteria, Orden, enCurso } from '@features/ordenes/domain/models/orden.model';

/**
 * CL-Sprint5 11/11/2026: las órdenes del día de una cafetería, para el tablero del encargado
 * (/mi-negocio/pedidos). Reemplaza el arreglo en memoria que tenía esa pantalla (JY-Sprint4).
 *
 * Los métodos devuelven un Observable frío: hay que suscribirse. `cargando()` y `error()` son de la carga;
 * los errores de avanzar, entregar o rechazar le llegan a quien se suscribe.
 *
 * CL-Sprint5 11/11/2026 (etapa 9): `refrescar` (sin parpadeo, para el tablero en vivo), `confirmarPago` y
 * la detección de pedidos nuevos: lo que aparece después de la primera carga queda en `recientes` (para
 * resaltarlo) y en `llegaron` (para el aviso), hasta que el encargado lo ve.
 */
@Injectable({ providedIn: 'root' })
export class PedidosCafeteriaFacade {
  private readonly repo = inject(OrdenesRepository);

  private readonly _ordenes = signal<Orden[]>([]);
  /** Ids ya vistos en el tablero (null = todavía no hay primera carga). */
  private conocidos: Set<string> | null = null;
  private idActual: string | null = null;

  /** Por hora de recogida. */
  readonly ordenes = this._ordenes.asReadonly();
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  /** Pedidos que llegaron con el tablero abierto y el encargado aún no abre. */
  readonly recientes = signal<ReadonlySet<string>>(new Set());
  /** Los que llegaron en la última revisión (para el aviso). Cambia solo cuando llega algo. */
  readonly llegaron = signal<Orden[]>([]);

  cargar(idCafeteria: string): Observable<Orden[]> {
    return defer(() => {
      this.cargando.set(true);
      this.error.set(null);
      return this.repo.ordenesCafeteria(idCafeteria).pipe(
        tap({
          next: (ordenes) => this.recibir(idCafeteria, ordenes),
          error: (e: ApiError) =>
            this.error.set(e?.message ?? 'No se pudieron cargar los pedidos.'),
        }),
        finalize(() => this.cargando.set(false)),
      );
    });
  }

  /** Vuelve a pedir las órdenes sin tocar `cargando()` ni `error()`. */
  refrescar(idCafeteria: string): Observable<Orden[]> {
    return this.repo.ordenesCafeteria(idCafeteria).pipe(tap((ordenes) => this.recibir(idCafeteria, ordenes)));
  }

  /** El encargado ya lo vio: deja de resaltarse. */
  visto(idOrden: string): void {
    if (!this.recientes().has(idOrden)) return;
    const copia = new Set(this.recientes());
    copia.delete(idOrden);
    this.recientes.set(copia);
  }

  /** confirmada → en_preparacion, en_preparacion → lista. */
  cambiarEstado(idOrden: string, estado: EstadoAvanceCafeteria): Observable<Orden> {
    return this.repo.cambiarEstado(idOrden, estado).pipe(tap((orden) => this.poner(orden)));
  }

  /** Solo desde "lista" y con el código de 6 dígitos que muestra el alumno. */
  entregar(idOrden: string, codigoRecogida: string): Observable<Orden> {
    return this.repo
      .entregar(idOrden, codigoRecogida)
      .pipe(tap((orden) => this.poner(orden)));
  }

  rechazar(idOrden: string, motivo: string): Observable<Orden> {
    return this.repo.rechazar(idOrden, motivo).pipe(tap((orden) => this.poner(orden)));
  }

  /** pendiente → confirmada (transferencia recibida). */
  confirmarPago(idOrden: string): Observable<Orden> {
    return this.repo.confirmarPago(idOrden).pipe(tap((orden) => this.poner(orden)));
  }

  private recibir(idCafeteria: string, ordenes: Orden[]): void {
    if (this.idActual !== idCafeteria) {
      this.idActual = idCafeteria;
      this.conocidos = null;
      this.recientes.set(new Set());
    }
    if (this.conocidos) {
      const nuevos = ordenes.filter((o) => enCurso(o) && !this.conocidos!.has(o.idOrden));
      if (nuevos.length) {
        this.recientes.set(new Set([...this.recientes(), ...nuevos.map((o) => o.idOrden)]));
        this.llegaron.set(nuevos);
      }
    }
    this.conocidos = new Set(ordenes.map((o) => o.idOrden));
    this._ordenes.set(ordenes);
  }

  private poner(orden: Orden): void {
    this._ordenes.update((lista) => lista.map((o) => (o.idOrden === orden.idOrden ? orden : o)));
  }
}
