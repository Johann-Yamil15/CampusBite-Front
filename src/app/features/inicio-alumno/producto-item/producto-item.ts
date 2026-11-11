// FB-Sprint4 29/10/2026: Componente individual de producto con botón para agregar al carrito
import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProductoMenu } from '@shared/menu/menu.model';
import { CarritoService } from '@shared/carrito/carrito'; // Ajusta la ruta si es necesario

@Component({
  selector: 'app-producto-item',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './producto-item.html',
  styleUrl: './producto-item.scss' // o styleUrls: ['./producto-item.scss'] según tu versión
})
export class ProductoItemComponent {
  @Input({ required: true }) producto!:    ProductoMenu;
  @Input({ required: true }) idCafeteria!: string;
  @Input({ required: true }) cafeteria!:   string;

  private readonly carrito = inject(CarritoService);
  private readonly snack   = inject(MatSnackBar);

  // FB-Sprint4 29/10/2026: Lógica para agregar el producto al Signal global del carrito
  // FB-Sprint4 29/10/2026: Lógica para agregar el producto al Signal global del carrito
agregar() {
  // FB-Sprint4 01/11/2026: evita el mensaje "Agregado" cuando el producto ya está en el tope de 20
  const enCarrito = this.carrito.items().find(i => i.idProducto === this.producto.idProducto);
  if (enCarrito && enCarrito.cantidad >= 20) {
    this.snack.open(`Máximo 20 unidades de ${this.producto.producto}`, 'Cerrar', { duration: 2500 });
    return;
  }
  try {
    this.carrito.agregar({
      idProducto:  this.producto.idProducto,
      producto:    this.producto.producto,
      precio:      this.producto.precio,
      cantidad:    1,
      imagenUrl:   this.producto.imagenUrl,
      idCafeteria: this.idCafeteria,
      cafeteria:   this.cafeteria,
    });
    this.snack.open(`Agregado: ${this.producto.producto}`, 'Cerrar', { duration: 1500 });
  } catch (error) {
    // Conversión segura para el modo estricto de TypeScript
    const e = error as Error;
    this.snack.open(e.message, 'Vaciar carrito', { duration: 5000 })
      .onAction().subscribe(() => {
        this.carrito.vaciar();
        this.agregar(); 
      });
  }
}

}