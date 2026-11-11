/**
 * CL-Sprint5 11/11/2026: entidades del catálogo que ve el alumno (menú de las cafeterías activas).
 * Salen de sp_menu_cafeteria. Antes vivían en shared/menu/menu.model.ts (FB-Sprint4).
 */

/** Métodos de pago del enum metodo_pago de la BD, en minúsculas como en la BD. */
export const METODOS_PAGO = ['efectivo', 'tarjeta', 'transferencia'] as const;
export type MetodoPago = (typeof METODOS_PAGO)[number];

export interface ProductoMenu {
  idProducto: string;
  /** Nombre del producto ("producto", así viene del SP). */
  producto: string;
  categoria: string | null;
  descripcion: string | null;
  precio: number;
  imagenUrl: string | null;
}

export interface MenuCafeteria {
  idCafeteria: string;
  /** Nombre de la cafetería. */
  cafeteria: string;
  esDelCampus: boolean;
  puntoEntrega: string;
  metodosPago: MetodoPago[];
  productos: ProductoMenu[];
}

/** Un producto con los datos de su cafetería: lo que lista el buscador. */
export interface PlatilloCatalogo extends ProductoMenu {
  idCafeteria: string;
  cafeteria: string;
}

/** Aplana el menú: todos los productos de todas las cafeterías, cada uno con su cafetería. */
export function platillos(menu: readonly MenuCafeteria[]): PlatilloCatalogo[] {
  return menu.flatMap((c) =>
    c.productos.map((p) => ({ ...p, idCafeteria: c.idCafeteria, cafeteria: c.cafeteria })),
  );
}

/** Categorías distintas del menú, en orden alfabético. Los productos sin categoría no aportan ninguna. */
export function categorias(menu: readonly MenuCafeteria[]): string[] {
  const nombres = new Set(
    menu.flatMap((c) => c.productos.map((p) => p.categoria).filter((n): n is string => !!n)),
  );
  return [...nombres].sort((a, b) => a.localeCompare(b, 'es'));
}
