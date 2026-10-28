// CL-Sprint4 28/10/2026: HU-07B. Columna central del panel: filtro por categoría (chips) y cuadrícula con
// TODOS los productos (disponibles e inactivos). El filtro es estado de la vista; las acciones se emiten al panel.
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Category, MenuProduct } from '@features/menu-negocio/domain/models/menu.model';
import { ProductoCardComponent } from '@features/menu-negocio/presentation/components/producto-card/producto-card.component';

/** Filtro activo: todos, una categoría (su id) o los productos sin categoría. */
type Filter = { kind: 'all' } | { kind: 'category'; id: string } | { kind: 'none' };

interface FilterChip {
  key: string;
  label: string;
  count: number;
  filter: Filter;
}

export interface AvailabilityChange {
  product: MenuProduct;
  available: boolean;
}

@Component({
  selector: 'app-galeria-productos',
  imports: [ProductoCardComponent],
  templateUrl: './galeria-productos.component.html',
  styleUrl: './galeria-productos.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GaleriaProductosComponent {
  readonly products = input.required<MenuProduct[]>();
  readonly categories = input.required<Category[]>();
  /** Ids con una petición en curso (ver MenuNegocioFacade.pending). */
  readonly pending = input<ReadonlySet<string>>(new Set());

  readonly create = output<void>();
  readonly edit = output<MenuProduct>();
  readonly changeImage = output<MenuProduct>();
  readonly remove = output<MenuProduct>();
  readonly availabilityChange = output<AvailabilityChange>();

  protected readonly filter = signal<Filter>({ kind: 'all' });

  protected readonly chips = computed<FilterChip[]>(() => {
    const products = this.products();
    const chips: FilterChip[] = [
      { key: 'all', label: 'Todos', count: products.length, filter: { kind: 'all' } },
      ...this.categories().map((c) => ({
        key: c.id,
        label: c.name,
        count: products.filter((p) => p.categoryId === c.id).length,
        filter: { kind: 'category', id: c.id } as Filter,
      })),
    ];
    const withoutCategory = products.filter((p) => !p.categoryId).length;
    if (withoutCategory) {
      chips.push({
        key: 'none',
        label: 'Sin categoría',
        count: withoutCategory,
        filter: { kind: 'none' },
      });
    }
    return chips;
  });

  protected readonly visible = computed(() => {
    const filter = this.filter();
    const products = this.products();
    switch (filter.kind) {
      case 'all':
        return products;
      case 'none':
        return products.filter((p) => !p.categoryId);
      case 'category':
        return products.filter((p) => p.categoryId === filter.id);
    }
  });

  protected isActive(chip: FilterChip): boolean {
    return this.keyOf(this.filter()) === chip.key;
  }

  protected select(chip: FilterChip): void {
    this.filter.set(chip.filter);
  }

  private keyOf(filter: Filter): string {
    return filter.kind === 'category' ? filter.id : filter.kind;
  }
}
