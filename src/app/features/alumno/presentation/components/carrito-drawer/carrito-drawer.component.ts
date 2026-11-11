// FB-Sprint4 01/11/2026: Panel lateral global del carrito con FAB, resumen, vaciar y confirmar pedido.
import { Component, DestroyRef, HostListener, computed, inject, model } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CarritoStore } from '@features/alumno/application/carrito.store';
import { CatalogoFacade } from '@features/catalogo';
import { CarritoItemComponent } from '@features/alumno/presentation/components/carrito-item/carrito-item.component';
import {
  ConfirmarOrdenComponent,
  ConfirmarOrdenData,
} from '@features/alumno/presentation/components/confirmar-orden/confirmar-orden.component';

@Component({
  selector: 'app-carrito-drawer',
  standalone: true,
  imports: [CurrencyPipe, MatBadgeModule, MatButtonModule, MatIconModule, CarritoItemComponent],
  templateUrl: './carrito-drawer.component.html',
  styleUrl: './carrito-drawer.component.scss',
})
export class CarritoDrawerComponent {
  readonly abierto = model(false);

  readonly carrito        = inject(CarritoStore);
  private readonly catalogo = inject(CatalogoFacade);
  private readonly dialog = inject(MatDialog);
  private readonly snack  = inject(MatSnackBar);

  // FB-Sprint4 01/11/2026: métodos que acepta la cafetería del carrito (del último menú cargado)
  readonly metodosPago = computed(() =>
    this.catalogo.cafeteria(this.carrito.idCafeteria())?.metodosPago ?? []
  );

  constructor() {
    // FB-Sprint4 01/11/2026: al cerrar sesión se vacía el carrito para que no pase al siguiente usuario
    // CL-Sprint5 11/11/2026: antes lo hacía app.ts; el drawer solo existe con sesión, así que su
    // destrucción es el cierre de sesión
    inject(DestroyRef).onDestroy(() => this.carrito.vaciar());
  }

  alternar(): void {
    this.abierto.update(v => !v);
  }

  // FB-Sprint4 01/11/2026: cierra el panel con la tecla Escape
  @HostListener('document:keydown.escape')
  alPresionarEscape(): void {
    // Con el modal abierto, Escape solo debe cerrar el modal
    if (this.dialog.openDialogs.length === 0) this.cerrar();
  }

  cerrar(): void {
    this.abierto.set(false);
  }

  // FB-Sprint4 01/11/2026: vacía el carrito permitiendo deshacer desde el snackbar
  vaciar(): void {
    const respaldo = this.carrito.items();
    this.carrito.vaciar();
    this.snack.open('Carrito vaciado', 'Deshacer', { duration: 4000 })
      .onAction().subscribe(() => respaldo.forEach(i => this.carrito.agregar(i)));
  }

  // FB-Sprint4 01/11/2026: abre el modal; si la orden se creó vacía el carrito y cierra el panel
  confirmar(): void {
    if (this.carrito.isEmpty()) return;
    this.dialog
      .open<ConfirmarOrdenComponent, ConfirmarOrdenData, boolean>(ConfirmarOrdenComponent, {
        data: { metodosPago: this.metodosPago() },
        width: '480px',
        maxWidth: '95vw',
        autoFocus: 'first-tabbable',
      })
      .afterClosed()
      .subscribe(exito => {
        if (!exito) return;
        this.carrito.vaciar();
        this.cerrar();
      });
  }
}
