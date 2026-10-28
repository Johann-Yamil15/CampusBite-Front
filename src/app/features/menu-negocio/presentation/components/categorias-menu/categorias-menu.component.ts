// CL-Sprint4 28/10/2026: HU-07B. Fila de categorías en círculos (estilo "historias"): "Nuevo" abre el alta y cada
// categoría filtra la galería. La foto de cada círculo es la de algún platillo de esa categoría (o la imagen por defecto).
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Category, MenuProduct } from '@features/menu-negocio/domain/models/menu.model';
import { PRODUCT_PLACEHOLDER } from '@features/menu-negocio/presentation/components/producto-card/producto-card.component';
import { ALL, MenuFilter, filterKey } from '@features/menu-negocio/presentation/menu-filter';

interface CategoryBubble {
  key: string;
  label: string;
  count: number;
  image: string;
  filter: MenuFilter;
}

@Component({
  selector: 'app-categorias-menu',
  templateUrl: './categorias-menu.component.html',
  styleUrl: './categorias-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriasMenuComponent {
  readonly products = input.required<MenuProduct[]>();
  readonly categories = input.required<Category[]>();
  readonly active = input<MenuFilter>(ALL);

  readonly create = output<void>();
  readonly selectFilter = output<MenuFilter>();

  protected readonly bubbles = computed<CategoryBubble[]>(() => {
    const products = this.products();
    const bubble = (label: string, filter: MenuFilter, items: MenuProduct[]): CategoryBubble => ({
      key: filterKey(filter),
      label,
      count: items.length,
      image: items.find((p) => p.imageUrl)?.imageUrl ?? PRODUCT_PLACEHOLDER,
      filter,
    });

    const list = [
      bubble('Todos', ALL, products),
      ...this.categories().map((c) =>
        bubble(
          c.name,
          { kind: 'category', id: c.id },
          products.filter((p) => p.categoryId === c.id),
        ),
      ),
    ];
    const withoutCategory = products.filter((p) => !p.categoryId);
    if (withoutCategory.length)
      list.push(bubble('Sin categoría', { kind: 'none' }, withoutCategory));
    return list;
  });

  protected readonly activeKey = computed(() => filterKey(this.active()));
}
