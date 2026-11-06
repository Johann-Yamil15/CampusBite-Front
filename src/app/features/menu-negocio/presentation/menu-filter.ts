// CL-Sprint4 28/10/2026: HU-07B. Filtro de la galería del panel (estado de la vista, no del dominio).
import { MenuProduct } from '@features/menu-negocio/domain/models/menu.model';

/** Todos, una categoría (su id), sin categoría, o los atajos de "Accesos rápidos". */
export type MenuFilter =
  | { kind: 'all' }
  | { kind: 'category'; id: string }
  | { kind: 'none' }
  | { kind: 'unavailable' }
  | { kind: 'noImage' };

export const ALL: MenuFilter = { kind: 'all' };

/** Clave estable para comparar filtros (y para `track`). */
export function filterKey(filter: MenuFilter): string {
  return filter.kind === 'category' ? `category:${filter.id}` : filter.kind;
}

export function matchesFilter(product: MenuProduct, filter: MenuFilter): boolean {
  switch (filter.kind) {
    case 'all':
      return true;
    case 'category':
      return product.categoryId === filter.id;
    case 'none':
      return !product.categoryId;
    case 'unavailable':
      return !product.available;
    case 'noImage':
      return !product.imageUrl;
  }
}

/** Búsqueda del topbar: nombre o descripción, sin distinguir mayúsculas ni acentos. */
export function matchesSearch(product: MenuProduct, search: string): boolean {
  const term = normalize(search.trim());
  if (!term) return true;
  return normalize(`${product.name} ${product.description ?? ''}`).includes(term);
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
