// CL-Sprint4 28/10/2026: HU-07B. Cabecera tipo "perfil" del negocio: portada, logo, nombre, chips y cifras del menú.
// Todo sale de datos reales (cafetería y productos); el backend aún no tiene portada, horario ni calificación.
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Cafeteria } from '@features/cafeterias';
import { Category, MenuProduct } from '@features/menu-negocio/domain/models/menu.model';

@Component({
  selector: 'app-perfil-negocio',
  imports: [CurrencyPipe],
  templateUrl: './perfil-negocio.component.html',
  styleUrl: './perfil-negocio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilNegocioComponent {
  readonly cafeteria = input.required<Cafeteria>();
  readonly products = input.required<MenuProduct[]>();
  readonly categories = input.required<Category[]>();

  protected readonly withImage = computed(() => this.products().filter((p) => p.imageUrl).length);
  protected readonly averagePrice = computed(() => {
    const products = this.products();
    return products.length ? products.reduce((sum, p) => sum + p.price, 0) / products.length : 0;
  });
}
