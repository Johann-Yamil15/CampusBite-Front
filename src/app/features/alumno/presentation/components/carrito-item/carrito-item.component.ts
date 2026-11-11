// FB-Sprint4 29/10/2026: Fila del carrito con controles +/- (máx 20) y eliminar producto.
import { Component, computed, inject, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ItemCarrito, MAX_CANTIDAD_PRODUCTO } from '@features/alumno/domain/models/carrito.model';
import { CarritoStore } from '@features/alumno/application/carrito.store';


@Component({
  selector: 'app-carrito-item',
  standalone: true,
  imports: [CurrencyPipe, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './carrito-item.component.html',
  styleUrl: './carrito-item.component.scss',
})
export class CarritoItemComponent {
  readonly item = input.required<ItemCarrito>();

  private readonly carrito = inject(CarritoStore);

  readonly max      = MAX_CANTIDAD_PRODUCTO;
  readonly subtotal = computed(() => this.item().precio * this.item().cantidad);
  readonly enLimite = computed(() => this.item().cantidad >= MAX_CANTIDAD_PRODUCTO);
  readonly esUltimo = computed(() => this.item().cantidad <= 1);

  // FB-Sprint4 29/10/2026: suma una unidad respetando el tope de 20
  incrementar(): void {
    if (this.enLimite()) return;
    this.carrito.cambiarCantidad(this.item().idProducto, this.item().cantidad + 1);
  }

  // FB-Sprint4 29/10/2026: resta una unidad; en 0 el store elimina el producto
  decrementar(): void {
    this.carrito.cambiarCantidad(this.item().idProducto, this.item().cantidad - 1);
  }

  // FB-Sprint4 29/10/2026: quita el producto completo del carrito
  eliminar(): void {
    this.carrito.quitar(this.item().idProducto);
  }
}
