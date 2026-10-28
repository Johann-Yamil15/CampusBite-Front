// CL-Sprint4 28/10/2026: HU-07B. Cuadrícula de platillos del panel (disponibles e inactivos). Recibe la lista ya
// filtrada por el panel (categoría, búsqueda, accesos rápidos) y emite las acciones de cada tarjeta.
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MenuProduct } from '@features/menu-negocio/domain/models/menu.model';
import { ProductoCardComponent } from '@features/menu-negocio/presentation/components/producto-card/producto-card.component';

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
  /** `true` si la cafetería no tiene ningún platillo (y no solo el filtro actual). */
  readonly menuEmpty = input(false);
  /** Ids con una petición en curso (ver MenuNegocioFacade.pending). */
  readonly pending = input<ReadonlySet<string>>(new Set());

  readonly create = output<void>();
  readonly clearFilter = output<void>();
  readonly edit = output<MenuProduct>();
  readonly changeImage = output<MenuProduct>();
  readonly remove = output<MenuProduct>();
  readonly availabilityChange = output<AvailabilityChange>();
}
