// JY-Sprint4 05/11/2026: cascarón visual. Estado de los pedidos del alumno en memoria, para que cancelar y
// volver a pedir se vean de verdad al navegar entre la lista y el detalle (si cada pantalla leyera el mock
// suelto, cancelar no se notaría al regresar).
// Al conectar la HU esto lo reemplaza una facade que lee sp_mis_ordenes y escribe con sp_cancelar_orden.
import { Injectable, computed, signal } from '@angular/core';
import { PEDIDOS, Pedido, enCurso } from './pedidos.mock';

@Injectable({ providedIn: 'root' })
export class PedidosAlumnoStore {
  private readonly _pedidos = signal<Pedido[]>(PEDIDOS);
  readonly pedidos = this._pedidos.asReadonly();

  readonly enCurso = computed(() => this._pedidos().filter(enCurso));
  readonly historial = computed(() => this._pedidos().filter((p) => !enCurso(p)));

  porFolio(folio: string): Pedido | null {
    return this._pedidos().find((p) => p.folio === folio) ?? null;
  }

  cancelar(folio: string): void {
    this._pedidos.update((lista) =>
      lista.map((p) => (p.folio === folio ? { ...p, estado: 'cancelado' } : p)),
    );
  }
}
