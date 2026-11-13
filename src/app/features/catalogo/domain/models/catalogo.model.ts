/**
 * CL-Sprint5 11/11/2026: entidades del catálogo que ve el alumno (menú de las cafeterías activas).
 * Salen de sp_menu_cafeteria. Antes vivían en shared/menu/menu.model.ts (FB-Sprint4).
 */

/** Métodos de pago del enum metodo_pago de la BD, en minúsculas como en la BD. */
export const METODOS_PAGO = ['efectivo', 'tarjeta', 'transferencia'] as const;
export type MetodoPago = (typeof METODOS_PAGO)[number];

/** CL-Sprint5 11/11/2026 (etapa 4): dietas para el filtro del buscador. */
export const DIETAS = ['vegetariano', 'sin_gluten'] as const;
export type Dieta = (typeof DIETAS)[number];
export const ETIQUETA_DIETA: Record<Dieta, string> = {
  vegetariano: 'Vegetariano',
  sin_gluten: 'Sin gluten',
};

export interface ProductoMenu {
  idProducto: string;
  /** Nombre del producto ("producto", así viene del SP). */
  producto: string;
  categoria: string | null;
  descripcion: string | null;
  precio: number;
  imagenUrl: string | null;
  // CL-Sprint5 11/11/2026 (etapa 3): datos para las tarjetas del inicio y la tienda. CL-Sprint5 13/11/2026:
  // calificacion y precioAnterior llegan en null por ahora: la tarjeta simplemente no los muestra.
  calificacion: number | null;
  minutosPreparacion: number | null;
  /** Precio antes de una promoción; null si no está en promoción. */
  precioAnterior: number | null;
  /** Entre lo más pedido de su cafetería. */
  popular: boolean;
  /** CL-Sprint5 11/11/2026 (etapa 4): vacío si el local no lo indicó. */
  dietas: Dieta[];
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
  /** Si su cafetería está abierta ahora (si no, se ve pero no se puede pedir). */
  cafeteriaAbierta: boolean;
}

/** Aplana el menú: todos los productos de todas las cafeterías, cada uno con su cafetería. */
export function platillos(menu: readonly MenuCafeteria[]): PlatilloCatalogo[] {
  return menu.flatMap((c) =>
    c.productos.map((p) => ({
      ...p,
      idCafeteria: c.idCafeteria,
      cafeteria: c.cafeteria,
      cafeteriaAbierta: c.abierta,
    })),
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

// ---------- Búsqueda (CL-Sprint5 11/11/2026, etapa 4) ----------

export const ORDENES_BUSQUEDA = ['relevancia', 'precio_asc', 'precio_desc', 'calificacion', 'tiempo'] as const;
export type OrdenBusqueda = (typeof ORDENES_BUSQUEDA)[number];

/** Criterios del buscador. Lo que viene `null` (o vacío) no filtra. */
export interface CriteriosBusqueda {
  /** Busca en el nombre, la descripción (ingredientes) y el nombre de la cafetería. */
  texto: string;
  categoria: string | null;
  idCafeteria: string | null;
  precioMax: number | null;
  minutosMax: number | null;
  calificacionMin: number | null;
  /** El platillo debe cumplir TODAS las dietas elegidas. */
  dietas: Dieta[];
  soloAbiertas: boolean;
  orden: OrdenBusqueda;
}

export const CRITERIOS_VACIOS: CriteriosBusqueda = {
  texto: '',
  categoria: null,
  idCafeteria: null,
  precioMax: null,
  minutosMax: null,
  calificacionMin: null,
  dietas: [],
  soloAbiertas: false,
  orden: 'relevancia',
};

/** Minúsculas y sin acentos: "Café" y "cafe" coinciden. */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

/**
 * Filtra y ordena los platillos. "Relevancia" pone primero los que tienen el texto en el nombre, luego
 * los mejor calificados; sin texto, solo por calificación. Las cafeterías cerradas van al final en
 * cualquier orden (se pueden ver, pero no pedir).
 */
export function buscarPlatillos(
  lista: readonly PlatilloCatalogo[],
  c: CriteriosBusqueda,
): PlatilloCatalogo[] {
  const palabras = normalizar(c.texto).split(/\s+/).filter(Boolean);
  const enNombre = (p: PlatilloCatalogo) => {
    const nombre = normalizar(p.producto);
    return palabras.every((w) => nombre.includes(w));
  };

  const filtrados = lista.filter((p) => {
    if (palabras.length) {
      const donde = normalizar(`${p.producto} ${p.descripcion ?? ''} ${p.cafeteria} ${p.categoria ?? ''}`);
      if (!palabras.every((w) => donde.includes(w))) return false;
    }
    if (c.categoria && p.categoria !== c.categoria) return false;
    if (c.idCafeteria && p.idCafeteria !== c.idCafeteria) return false;
    if (c.precioMax !== null && p.precio > c.precioMax) return false;
    if (c.minutosMax !== null && (p.minutosPreparacion ?? Infinity) > c.minutosMax) return false;
    if (c.calificacionMin !== null && (p.calificacion ?? 0) < c.calificacionMin) return false;
    if (c.dietas.some((d) => !p.dietas.includes(d))) return false;
    if (c.soloAbiertas && !p.cafeteriaAbierta) return false;
    return true;
  });

  const porCalificacion = (a: PlatilloCatalogo, b: PlatilloCatalogo) =>
    (b.calificacion ?? 0) - (a.calificacion ?? 0);
  const comparar: Record<OrdenBusqueda, (a: PlatilloCatalogo, b: PlatilloCatalogo) => number> = {
    relevancia: (a, b) =>
      (palabras.length ? Number(enNombre(b)) - Number(enNombre(a)) : 0) || porCalificacion(a, b),
    precio_asc: (a, b) => a.precio - b.precio,
    precio_desc: (a, b) => b.precio - a.precio,
    calificacion: porCalificacion,
    tiempo: (a, b) => (a.minutosPreparacion ?? Infinity) - (b.minutosPreparacion ?? Infinity),
  };

  return [...filtrados].sort(
    (a, b) => Number(b.cafeteriaAbierta) - Number(a.cafeteriaAbierta) || comparar[c.orden](a, b),
  );
}

/** Cuántos filtros (además del texto y el orden) están activos: para el botón "Filtros (n)". */
export function filtrosActivos(c: CriteriosBusqueda): number {
  return (
    Number(!!c.categoria) +
    Number(!!c.idCafeteria) +
    Number(c.precioMax !== null) +
    Number(c.minutosMax !== null) +
    Number(c.calificacionMin !== null) +
    c.dietas.length +
    Number(c.soloAbiertas)
  );
}
