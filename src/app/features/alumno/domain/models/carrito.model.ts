/**
 * FB-Sprint4 29/10/2026: modelo del carrito (local, no viene del backend).
 * CL-Sprint5 11/11/2026: se mueve de shared/menu/menu.model.ts al dominio del alumno, con sus reglas como
 * funciones puras: tope de 20 por producto y una sola cafetería por carrito (las mismas que valida
 * sp_crear_orden). El resto de aquel archivo pasó a las features catalogo y ordenes.
 */

/** Tope por producto (detalle_orden.cantidad BETWEEN 1 AND 20). */
export const MAX_CANTIDAD_PRODUCTO = 20;

export interface ItemCarrito {
  idProducto: string;
  producto: string;
  precio: number;
  cantidad: number;
  imagenUrl: string | null;
  /** Para validar que no se mezclen cafeterías. */
  idCafeteria: string;
  cafeteria: string;
}

/** El carrito ya tiene productos de otra cafetería: hay que vaciarlo antes. */
export class CarritoDeOtraCafeteriaError extends Error {
  constructor(readonly cafeteriaActual: string) {
    super(
      `El carrito ya tiene productos de "${cafeteriaActual}". ¿Deseas vaciarlo y agregar de otro negocio?`,
    );
  }
}

const tope = (cantidad: number) => Math.min(cantidad, MAX_CANTIDAD_PRODUCTO);

/**
 * Agrega un producto: si ya está suma la cantidad, siempre respetando el tope.
 * @throws CarritoDeOtraCafeteriaError si el carrito tiene productos de otra cafetería.
 */
export function agregarItem(items: readonly ItemCarrito[], item: ItemCarrito): ItemCarrito[] {
  const actual = items[0];
  if (actual && actual.idCafeteria !== item.idCafeteria) {
    throw new CarritoDeOtraCafeteriaError(actual.cafeteria);
  }
  if (items.some((i) => i.idProducto === item.idProducto)) {
    return items.map((i) =>
      i.idProducto === item.idProducto ? { ...i, cantidad: tope(i.cantidad + item.cantidad) } : i,
    );
  }
  return [...items, { ...item, cantidad: tope(item.cantidad) }];
}

/** Cambia la cantidad de un producto; en 0 o menos lo quita. */
export function cambiarCantidadItem(
  items: readonly ItemCarrito[],
  idProducto: string,
  cantidad: number,
): ItemCarrito[] {
  if (cantidad <= 0) return items.filter((i) => i.idProducto !== idProducto);
  return items.map((i) => (i.idProducto === idProducto ? { ...i, cantidad: tope(cantidad) } : i));
}
