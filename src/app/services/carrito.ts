// FB-Sprint4 29/10/2026: Signal store global para manejar el estado del carrito (límite 20 y validar cafetería única).
import { Injectable, computed, signal } from '@angular/core';
import { ItemCarrito } from '../models/menu.model';

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly _items = signal<ItemCarrito[]>([]);

  readonly items       = this._items.asReadonly();
  readonly totalItems  = computed(() => this._items().reduce((s, i) => s + i.cantidad, 0));
  readonly totalPrecio = computed(() => this._items().reduce((s, i) => s + i.precio * i.cantidad, 0));
  readonly cafeteria   = computed(() => this._items()[0]?.cafeteria ?? null);
  readonly idCafeteria = computed(() => this._items()[0]?.idCafeteria ?? null);
  readonly isEmpty     = computed(() => this._items().length === 0);

  agregar(item: ItemCarrito): void {
    const actual = this.idCafeteria();
    if (actual && actual !== item.idCafeteria) {
      throw new Error(`El carrito ya tiene productos de "${this.cafeteria()}". ¿Deseas vaciarlo y agregar de otro negocio?`);
    }

    this._items.update(items => {
      const existente = items.find(i => i.idProducto === item.idProducto);
      if (existente) {
        return items.map(i =>
          i.idProducto === item.idProducto
            ? { ...i, cantidad: Math.min(i.cantidad + item.cantidad, 20) }
            : i
        );
      }
      // FB-Sprint4 01/11/2026: un producto nuevo también respeta el tope de 20
      return [...items, { ...item, cantidad: Math.min(item.cantidad, 20) }];
    });
  }

  cambiarCantidad(idProducto: string, cantidad: number): void {
    if (cantidad <= 0) {
      this.quitar(idProducto);
      return;
    }
    this._items.update(items =>
      items.map(i => i.idProducto === idProducto ? { ...i, cantidad: Math.min(cantidad, 20) } : i)
    );
  }

  quitar(idProducto: string): void {
    this._items.update(items => items.filter(i => i.idProducto !== idProducto));
  }

  vaciar(): void {
    this._items.set([]);
  }
}