import { Injectable, inject, signal } from '@angular/core';
import { Observable, defer, finalize, tap } from 'rxjs';
import { ApiError } from '@core/http/api-error';
import { OrdenesRepository } from '@features/ordenes/domain/repositories/ordenes.repository';
import { EstadoAvanceCafeteria, Orden } from '@features/ordenes/domain/models/orden.model';

/**
 * CL-Sprint5 11/11/2026: las órdenes del día de una cafetería, para el tablero del encargado
 * (/mi-negocio/pedidos). Reemplaza el arreglo en memoria que tenía esa pantalla (JY-Sprint4).
 *
 * Los métodos devuelven un Observable frío: hay que suscribirse. `cargando()` y `error()` son de la carga;
 * los errores de avanzar, entregar o rechazar le llegan a quien se suscribe.
 */
@Injectable({ providedIn: 'root' })
export class PedidosCafeteriaFacade {
  private readonly repo = inject(OrdenesRepository);

  private readonly _ordenes = signal<Orden[]>([]);

  /** Por hora de recogida. */
  readonly ordenes = this._ordenes.asReadonly();
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  cargar(idCafeteria: string): Observable<Orden[]> {
    return defer(() => {
      this.cargando.set(true);
      this.error.set(null);
      return this.repo.ordenesCafeteria(idCafeteria).pipe(
        tap({
          next: (ordenes) => this._ordenes.set(ordenes),
          error: (e: ApiError) =>
            this.error.set(e?.message ?? 'No se pudieron cargar los pedidos.'),
        }),
        finalize(() => this.cargando.set(false)),
      );
    });
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

  private poner(orden: Orden): void {
    this._ordenes.update((lista) => lista.map((o) => (o.idOrden === orden.idOrden ? orden : o)));
  }
}
