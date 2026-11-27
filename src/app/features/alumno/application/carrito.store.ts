// FB-Sprint4 29/10/2026: Signal store global para manejar el estado del carrito (límite 20 y validar cafetería única).
// CL-Sprint5 11/11/2026: se mueve de shared/carrito (CarritoService) a la capa application del alumno; las
// reglas viven ahora en domain/models/carrito.model.ts. La API pública es la misma.
import { Injectable, computed, effect, inject, linkedSignal, untracked } from '@angular/core';
import { BorradoresService } from '@core/services/borradores.service';
import {
  ItemCarrito,
  agregarItem,
  cambiarCantidadItem,
  esCarritoValido,
} from '@features/alumno/domain/models/carrito.model';

/** CL-Sprint5 26/11/2026: nombre del borrador del carrito (cb.borrador.<sub>.carrito). */
export const BORRADOR_CARRITO = 'carrito';

@Injectable({ providedIn: 'root' })
export class CarritoStore {
  private readonly borradores = inject(BorradoresService);

  /**
   * CL-Sprint5 26/11/2026: el carrito es del usuario con sesión y sobrevive a recargar (también sin internet).
   * Cuando cambia el usuario (inicia o termina sesión) se vuelve a leer su borrador; sin sesión queda vacío.
   */
  private readonly _items = linkedSignal<string | null, ItemCarrito[]>({
    source: this.borradores.usuario,
    computation: (usuario) => this.borradores.leer(BORRADOR_CARRITO, esCarritoValido, usuario) ?? [],
  });

  readonly items = this._items.asReadonly();
  readonly totalItems = computed(() => this._items().reduce((s, i) => s + i.cantidad, 0));
  readonly totalPrecio = computed(() => this._items().reduce((s, i) => s + i.precio * i.cantidad, 0));
  readonly cafeteria = computed(() => this._items()[0]?.cafeteria ?? null);
  readonly idCafeteria = computed(() => this._items()[0]?.idCafeteria ?? null);
  readonly isEmpty = computed(() => this._items().length === 0);

  constructor() {
    // Cada cambio se guarda en el borrador del usuario; vacío (p. ej. tras pedir con éxito) se borra.
    // Sin sesión no se guarda nada: así cerrar sesión o que venza no toca el borrador.
    effect(() => {
      const usuario = this.borradores.usuario();
      const items = this._items();
      untracked(() => {
        if (items.length) this.borradores.guardar(BORRADOR_CARRITO, items, usuario);
        else this.borradores.borrar(BORRADOR_CARRITO, usuario);
      });
    });
  }

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
