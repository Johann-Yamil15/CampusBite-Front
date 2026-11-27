// FB-Sprint4 29/10/2026: Signal store global para manejar el estado del carrito (límite 20 y validar cafetería única).
// CL-Sprint5 11/11/2026: se mueve de shared/carrito (CarritoService) a la capa application del alumno; las
// reglas viven ahora en domain/models/carrito.model.ts. La API pública es la misma.
// JJ-Sprint5 27/11/2026: el carrito se guarda en el dispositivo (localStorage): si se va la señal o se cierra la
// app, el alumno no pierde lo que eligió. Se borra al cerrar sesión (App llama a vaciar()).
import { Injectable, computed, effect, signal } from '@angular/core';
import {
  ItemCarrito,
  agregarItem,
  cambiarCantidadItem,
} from '@features/alumno/domain/models/carrito.model';

export const CLAVE_CARRITO = 'cb.carrito';

@Injectable({ providedIn: 'root' })
export class CarritoStore {
  private readonly _items = signal<ItemCarrito[]>(leerGuardado());

  readonly items = this._items.asReadonly();
  readonly totalItems = computed(() => this._items().reduce((s, i) => s + i.cantidad, 0));
  readonly totalPrecio = computed(() => this._items().reduce((s, i) => s + i.precio * i.cantidad, 0));
  readonly cafeteria = computed(() => this._items()[0]?.cafeteria ?? null);
  readonly idCafeteria = computed(() => this._items()[0]?.idCafeteria ?? null);
  readonly isEmpty = computed(() => this._items().length === 0);

  constructor() {
    effect(() => guardar(this._items()));
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

// localStorage puede no existir o fallar (modo privado, almacenamiento lleno): entonces el carrito solo vive en memoria
function leerGuardado(): ItemCarrito[] {
  try {
    const datos: unknown = JSON.parse(localStorage.getItem(CLAVE_CARRITO) ?? '[]');
    return Array.isArray(datos) ? datos.filter(esItem) : [];
  } catch {
    return [];
  }
}

function guardar(items: ItemCarrito[]): void {
  try {
    if (items.length) localStorage.setItem(CLAVE_CARRITO, JSON.stringify(items));
    else localStorage.removeItem(CLAVE_CARRITO);
  } catch {
    // Sin almacenamiento disponible: se sigue en memoria
  }
}

// Lo guardado puede venir dañado o de otra versión: solo se aceptan productos con la forma esperada
function esItem(x: unknown): x is ItemCarrito {
  const i = x as Partial<ItemCarrito> | null;
  return (
    !!i &&
    typeof i.idProducto === 'string' &&
    typeof i.producto === 'string' &&
    typeof i.idCafeteria === 'string' &&
    typeof i.cafeteria === 'string' &&
    typeof i.precio === 'number' &&
    Number.isInteger(i.cantidad) &&
    (i.cantidad ?? 0) > 0
  );
}
