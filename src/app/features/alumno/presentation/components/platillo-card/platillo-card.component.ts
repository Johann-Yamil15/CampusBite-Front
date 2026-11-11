// CL-Sprint5 11/11/2026: tarjeta de platillo del inicio y la tienda (etapa 3). Foto dominante, oferta,
// calificación, tiempo y precio. El "+" agrega en el acto y se convierte en contador (− n +); tocar la foto
// o el nombre abre el detalle. Si el carrito ya tiene productos de otra cafetería, pregunta antes de
// vaciarlo (la regla del carrito: una sola cafetería por pedido). Reemplaza a producto-item (FB-Sprint4).
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { PlatilloCatalogo } from '@features/catalogo';
import { CalificacionComponent } from '@shared/ui/calificacion/calificacion.component';
import { CantidadComponent } from '@shared/ui/cantidad/cantidad.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { ModalComponent } from '@shared/ui/modal/modal.component';
import { ToastService } from '@shared/ui/toast/toast.service';
import { CarritoStore } from '@features/alumno/application/carrito.store';
import {
  CarritoDeOtraCafeteriaError,
  ItemCarrito,
  MAX_CANTIDAD_PRODUCTO,
} from '@features/alumno/domain/models/carrito.model';

export const SIN_IMAGEN = 'assets/images/producto-sin-imagen.svg';

@Component({
  selector: 'app-platillo-card',
  imports: [CurrencyPipe, CalificacionComponent, CantidadComponent, IconComponent, ModalComponent],
  templateUrl: './platillo-card.component.html',
  styleUrl: './platillo-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlatilloCardComponent {
  readonly platillo = input.required<PlatilloCatalogo>();
  /** En la tienda ya se sabe de qué cafetería es; en el inicio se muestra. */
  readonly mostrarCafeteria = input(true);
  /** La cafetería está cerrada: se ve el platillo pero no se puede pedir. */
  readonly cerrada = input(false);

  private readonly carrito = inject(CarritoStore);
  private readonly toast = inject(ToastService);

  protected readonly sinImagen = SIN_IMAGEN;
  protected readonly max = MAX_CANTIDAD_PRODUCTO;

  /** Cuántas hay de este platillo en el carrito (0 = no está). */
  protected readonly enCarrito = computed(
    () => this.carrito.items().find((i) => i.idProducto === this.platillo().idProducto)?.cantidad ?? 0,
  );

  protected readonly descuento = computed(() => {
    const p = this.platillo();
    return p.precioAnterior && p.precioAnterior > p.precio
      ? Math.round((1 - p.precio / p.precioAnterior) * 100)
      : null;
  });

  // ---------- Detalle ----------
  protected readonly detalle = signal(false);
  protected readonly cantidadDetalle = signal(1);

  protected abrirDetalle(): void {
    this.cantidadDetalle.set(Math.max(this.enCarrito(), 1));
    this.detalle.set(true);
  }

  // ---------- Conflicto de cafetería ----------
  /** Lo que se quería agregar cuando apareció el aviso de otra cafetería. */
  protected readonly pendiente = signal<{ cantidad: number; cafeteriaActual: string } | null>(null);

  /** "+" de la tarjeta: agrega uno. */
  protected agregarUno(): void {
    this.agregar(1);
  }

  /** Botón del detalle: deja exactamente la cantidad elegida. */
  protected agregarDesdeDetalle(): void {
    const cantidad = this.cantidadDetalle();
    if (this.enCarrito() > 0) {
      this.carrito.cambiarCantidad(this.platillo().idProducto, cantidad);
      this.detalle.set(false);
      this.toast.ok(`Actualizaste ${this.platillo().producto}: ahora llevas ${cantidad}.`);
      return;
    }
    if (this.agregar(cantidad)) {
      this.detalle.set(false);
      this.toast.ok(`${this.platillo().producto} se agregó a tu carrito.`);
    }
  }

  protected cambiar(cantidad: number): void {
    this.carrito.cambiarCantidad(this.platillo().idProducto, cantidad);
  }

  protected quitar(): void {
    this.carrito.quitar(this.platillo().idProducto);
    this.toast.info(`Quitaste ${this.platillo().producto} del carrito.`);
  }

  /** Vacía el carrito de la otra cafetería y agrega lo que estaba pendiente. */
  protected vaciarYAgregar(): void {
    const pendiente = this.pendiente();
    if (!pendiente) return;
    this.carrito.vaciar();
    this.pendiente.set(null);
    this.detalle.set(false);
    this.agregar(pendiente.cantidad);
    this.toast.ok(`Empezaste un carrito nuevo en ${this.platillo().cafeteria}.`);
  }

  /** @returns `false` si no se pudo (otra cafetería): en ese caso abre el aviso. */
  private agregar(cantidad: number): boolean {
    try {
      this.carrito.agregar(this.item(cantidad));
      return true;
    } catch (e) {
      if (e instanceof CarritoDeOtraCafeteriaError) {
        this.pendiente.set({ cantidad, cafeteriaActual: e.cafeteriaActual });
        return false;
      }
      throw e;
    }
  }

  private item(cantidad: number): ItemCarrito {
    const p = this.platillo();
    return {
      idProducto: p.idProducto,
      producto: p.producto,
      precio: p.precio,
      cantidad,
      imagenUrl: p.imagenUrl,
      idCafeteria: p.idCafeteria,
      cafeteria: p.cafeteria,
    };
  }
}
