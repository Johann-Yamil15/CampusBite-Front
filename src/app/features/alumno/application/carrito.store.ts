// FB-Sprint4 29/10/2026: Signal store global para manejar el estado del carrito (límite 20 y validar cafetería única).
// CL-Sprint5 11/11/2026: se mueve de shared/carrito (CarritoService) a la capa application del alumno; las
// reglas viven ahora en domain/models/carrito.model.ts. La API pública es la misma.
import { Injectable, computed, signal } from '@angular/core';
import {
  ItemCarrito,
  agregarItem,
  cambiarCantidadItem,
} from '@features/alumno/domain/models/carrito.model';

@Injectable({ providedIn: 'root' })
export class CarritoStore {
  private readonly _items = signal<ItemCarrito[]>([]);

  readonly items = this._items.asReadonly();
  readonly totalItems = computed(() => this._items().reduce((s, i) => s + i.cantidad, 0));
  readonly totalPrecio = computed(() => this._items().reduce((s, i) => s + i.precio * i.cantidad, 0));
  readonly cafeteria = computed(() => this._items()[0]?.cafeteria ?? null);
  readonly idCafeteria = computed(() => this._items()[0]?.idCafeteria ?? null);
  readonly isEmpty = computed(() => this._items().length === 0);

  /** @throws CarritoDeOtraCafeteriaError si ya hay productos de otra cafetería (el carrito no cambia). */
  agregar(item: ItemCarrito): void {
    this._items.set(agregarItem(this._items(), item));
  }

  /** En 0 o menos quita el producto (pasa por `quitar`, como antes). */
  cambiarCantidad(idProducto: string, cantidad: number): void {
    if (cantidad <= 0) {
      this.quitar(idProducto);
      return;
    }
    this._items.update((items) => cambiarCantidadItem(items, idProducto, cantidad));
  }

  quitar(idProducto: string): void {
    this._items.update((items) => items.filter((i) => i.idProducto !== idProducto));
  }

  vaciar(): void {
    this._items.set([]);
  }
}
