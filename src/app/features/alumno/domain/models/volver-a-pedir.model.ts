/**
 * CL-Sprint5 11/11/2026 (etapa 6): "Volver a pedir". Arma el carrito con los mismos productos de una orden
 * pasada, pero contra el menú de HOY de esa cafetería: se agrega el producto real (su id, no el folio), con
 * su precio vigente, y lo que ya no está en el menú se reporta para avisarle al alumno.
 * Dominio puro: recibe formas mínimas para no depender de las features ordenes ni catalogo.
 */
import { ItemCarrito, MAX_CANTIDAD_PRODUCTO } from './carrito.model';

export interface LineaARepetir {
  idProducto: string;
  producto: string;
  cantidad: number;
}

/** Un producto del menú vigente de la cafetería. */
export interface ProductoVigente {
  idProducto: string;
  producto: string;
  precio: number;
  imagenUrl: string | null;
}

export interface PlanRepetir {
  items: ItemCarrito[];
  /** Nombres de lo que ya no se puede pedir. */
  noDisponibles: string[];
}

export function planRepetir(
  lineas: readonly LineaARepetir[],
  vigentes: readonly ProductoVigente[],
  cafeteria: { idCafeteria: string; nombre: string },
): PlanRepetir {
  const items: ItemCarrito[] = [];
  const noDisponibles: string[] = [];
  for (const linea of lineas) {
    const p = vigentes.find((v) => v.idProducto === linea.idProducto);
    if (!p) {
      noDisponibles.push(linea.producto);
      continue;
    }
    const previo = items.find((i) => i.idProducto === p.idProducto);
    if (previo) {
      previo.cantidad = Math.min(previo.cantidad + linea.cantidad, MAX_CANTIDAD_PRODUCTO);
      continue;
    }
    items.push({
      idProducto: p.idProducto,
      producto: p.producto,
      precio: p.precio,
      cantidad: Math.min(linea.cantidad, MAX_CANTIDAD_PRODUCTO),
      imagenUrl: p.imagenUrl,
      idCafeteria: cafeteria.idCafeteria,
      cafeteria: cafeteria.nombre,
    });
  }
  return { items, noDisponibles };
}
