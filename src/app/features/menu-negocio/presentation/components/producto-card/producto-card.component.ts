// CL-Sprint4 28/10/2026: HU-07B. Tarjeta de un producto del panel del encargado: imagen, categoría, nombre,
// precio, toggle de disponibilidad y menú "⋯" (Editar / Cambiar imagen / Eliminar). Solo presenta y emite:
// el panel decide qué hacer con cada acción.
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MenuProduct } from '@features/menu-negocio/domain/models/menu.model';

/** Imagen que se muestra si el producto no tiene o si su URL no carga. */
export const PRODUCT_PLACEHOLDER = 'assets/images/producto-sin-imagen.svg';

@Component({
  selector: 'app-producto-card',
  imports: [CurrencyPipe],
  templateUrl: './producto-card.component.html',
  styleUrl: './producto-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(keydown.escape)': 'closeMenu(true)',
  },
})
export class ProductoCardComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly product = input.required<MenuProduct>();
  /** `true` mientras el producto tiene una petición en curso: bloquea el toggle y el menú. */
  readonly pending = input(false);

  readonly edit = output<MenuProduct>();
  readonly changeImage = output<MenuProduct>();
  readonly remove = output<MenuProduct>();
  readonly availabilityChange = output<boolean>();

  protected readonly placeholder = PRODUCT_PLACEHOLDER;
  protected readonly menuOpen = signal(false);
  /** La URL de la imagen falló al cargar (p. ej. blob borrado): se muestra la imagen por defecto. */
  protected readonly imageFailed = signal<string | null>(null);

  protected imageOf(product: MenuProduct): string {
    return product.imageUrl && product.imageUrl !== this.imageFailed()
      ? product.imageUrl
      : this.placeholder;
  }

  protected onImageError(product: MenuProduct): void {
    this.imageFailed.set(product.imageUrl);
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected choose(action: 'edit' | 'changeImage' | 'remove'): void {
    this.closeMenu(false);
    this[action].emit(this.product());
  }

  protected onToggle(event: Event): void {
    this.availabilityChange.emit((event.target as HTMLInputElement).checked);
  }

  protected closeMenu(returnFocus: boolean): void {
    if (!this.menuOpen()) return;
    this.menuOpen.set(false);
    if (returnFocus) this.host.nativeElement.querySelector<HTMLElement>('.menu-trigger')?.focus();
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.closeMenu(false);
  }
}
