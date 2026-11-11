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
  // CL-Sprint5 11/11/2026 (etapa 3): datos para las tarjetas del inicio y la tienda. El back aún no los
  // manda (propuestos en BACKEND_SPECIFICATION.md): sin ellos la tarjeta simplemente no los muestra.
  calificacion: number | null;
  minutosPreparacion: number | null;
  /** Precio antes de una promoción; null si no está en promoción. */
  precioAnterior: number | null;
  /** Entre lo más pedido de su cafetería. */
  popular: boolean;
}

export interface MenuCafeteria {
  idCafeteria: string;
  /** Nombre de la cafetería. */
  cafeteria: string;
  esDelCampus: boolean;
  puntoEntrega: string;
  metodosPago: MetodoPago[];
  productos: ProductoMenu[];
  // CL-Sprint5 11/11/2026 (etapa 3): presentación de la cafetería (portada, logo, estado de hoy).
  logoUrl: string | null;
  portadaUrl: string | null;
  calificacion: number | null;
  resenas: number | null;
  /** Abierta en este momento (según su horario de hoy). */
  abierta: boolean;
  /** Hora de cierre de hoy (HH:mm), o null si hoy no abre. */
  cierraA: string | null;
  /** Tiempo típico de preparación, en minutos. */
  minutosEstimados: number | null;
}

/** CL-Sprint5 11/11/2026: promoción destacada del carrusel del inicio. */
export interface Promocion {
  idPromocion: string;
  /** Texto corto de la insignia ("Combo estudiante"). */
  etiqueta: string;
  titulo: string;
  subtitulo: string;
  imagenUrl: string | null;
  /** A dónde lleva: la tienda de una cafetería... */
  idCafeteria: string | null;
  /** ...o el buscador filtrado por categoría. */
  categoria: string | null;
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

/**
 * Lo más pedido: los productos marcados como populares de las cafeterías abiertas, mejor calificados
 * primero. Las cerradas no aparecen (no se puede pedir de ellas ahora).
 */
export function populares(menu: readonly MenuCafeteria[], limite = 8): PlatilloCatalogo[] {
  const abiertas = menu.filter((c) => c.abierta);
  return platillos(abiertas)
    .filter((p) => p.popular)
    .sort((a, b) => (b.calificacion ?? 0) - (a.calificacion ?? 0))
    .slice(0, limite);
}

/** Abiertas primero y, dentro de cada grupo, mejor calificadas primero. */
export function cafeteriasDestacadas(menu: readonly MenuCafeteria[]): MenuCafeteria[] {
  return [...menu].sort(
    (a, b) => Number(b.abierta) - Number(a.abierta) || (b.calificacion ?? 0) - (a.calificacion ?? 0),
  );
}

/** Categorías distintas del menú, en orden alfabético. Los productos sin categoría no aportan ninguna. */
export function categorias(menu: readonly MenuCafeteria[]): string[] {
  const nombres = new Set(
    menu.flatMap((c) => c.productos.map((p) => p.categoria).filter((n): n is string => !!n)),
  );
  return [...nombres].sort((a, b) => a.localeCompare(b, 'es'));
}
