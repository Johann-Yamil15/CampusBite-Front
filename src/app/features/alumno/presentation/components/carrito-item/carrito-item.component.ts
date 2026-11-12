// FB-Sprint4 29/10/2026: Fila del carrito con controles +/- (máx 20) y eliminar producto.
// CL-Sprint5 11/11/2026 (etapa 5): sin Angular Material; usa el selector de cantidad del sistema de diseño
// (app-cantidad), que en 1 se convierte en "quitar".
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { CantidadComponent } from '@shared/ui/cantidad/cantidad.component';
import { CarritoStore } from '@features/alumno/application/carrito.store';
import { ItemCarrito, MAX_CANTIDAD_PRODUCTO } from '@features/alumno/domain/models/carrito.model';

@Component({
  selector: 'app-carrito-item',
  imports: [CurrencyPipe, CantidadComponent],
  template: `
    @let i = item();
    <div class="ci">
      <img class="ci-foto" [src]="i.imagenUrl ?? sinImagen" alt="" width="56" height="56" loading="lazy" />
      <div class="ci-info">
        <p class="ci-nombre">{{ i.producto }}</p>
        <p class="ci-unitario">{{ i.precio | currency: 'MXN' : 'symbol-narrow' }} c/u</p>
        <app-cantidad
          [valor]="i.cantidad"
          (valorChange)="cambiar($event)"
          [min]="1"
          [max]="max"
          [quitable]="true"
          [compacta]="true"
          [etiqueta]="i.producto"
          (quitar)="quitar()"
        />
      </div>
      <strong class="ci-subtotal">{{ subtotal() | currency: 'MXN' : 'symbol-narrow' }}</strong>
    </div>
  `,
  styles: `
    .ci {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 0.75rem;
      align-items: start;
      padding: 0.85rem 0;
      border-bottom: 1px solid var(--cb-line-soft);
    }
    .ci-foto {
      width: 56px;
      height: 56px;
      border-radius: var(--cb-radius);
      object-fit: cover;
      background: var(--cb-skeleton);
    }
    .ci-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.3rem;
      min-width: 0;
    }
    .ci-nombre {
      margin: 0;
      font-weight: 700;
      color: var(--cb-ink);
      line-height: var(--cb-leading-tight);
    }
    .ci-unitario {
      margin: 0;
      font-size: var(--cb-text-xs);
      color: var(--cb-text-muted);
    }
    .ci-subtotal {
      font-variant-numeric: tabular-nums;
      color: var(--cb-ink);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarritoItemComponent {
  readonly item = input.required<ItemCarrito>();

  private readonly carrito = inject(CarritoStore);

  protected readonly max = MAX_CANTIDAD_PRODUCTO;
  protected readonly sinImagen = 'assets/images/producto-sin-imagen.svg';
  protected readonly subtotal = computed(() => this.item().precio * this.item().cantidad);

  protected cambiar(cantidad: number): void {
    this.carrito.cambiarCantidad(this.item().idProducto, cantidad);
  }

  protected quitar(): void {
    this.carrito.quitar(this.item().idProducto);
  }
}
