// JY-Sprint4 05/11/2026: HU-08 (cascarón visual). Detalle de un pedido: avance del estado, artículos, pago
// y punto de entrega. Las acciones sí hacen su efecto en memoria (cancelar cambia el estado, volver a pedir
// llena el carrito); lo que falta es la llamada al back, que todavía no tiene OrdenesController.
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ModalComponent } from '@shared/ui/modal/modal.component';
import { ToastService } from '@shared/ui/toast/toast.service';
import { CarritoService } from '@shared/carrito/carrito';
import {
  ESTADOS_PEDIDO,
  ETIQUETA_ESTADO,
  Pedido,
  total,
} from '@features/alumno/presentation/pedidos.mock';
import { PedidosAlumnoStore } from '@features/alumno/presentation/pedidos.store';

@Component({
  selector: 'app-pedido-detalle-page',
  imports: [CurrencyPipe, DatePipe, RouterLink, ModalComponent],
  templateUrl: './pedido-detalle.page.html',
  styleUrl: './pedido-detalle.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidoDetallePage {
  /** Folio de la URL (/pedidos/:folio); lo entrega el router con withComponentInputBinding. */
  readonly folio = input<string>('');

  private readonly store = inject(PedidosAlumnoStore);
  private readonly carrito = inject(CarritoService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly etiqueta = ETIQUETA_ESTADO;
  protected readonly pasos = ESTADOS_PEDIDO;

  protected readonly pedido = computed(() =>
    this.store.pedidos().find((p) => p.folio === this.folio()) ?? null,
  );

  protected readonly total = computed(() => {
    const pedido = this.pedido();
    return pedido ? total(pedido) : 0;
  });

  /** Índice del estado actual; -1 si está cancelado (la línea de tiempo se reemplaza por un aviso). */
  protected readonly pasoActual = computed(() => {
    const estado = this.pedido()?.estado;
    return estado && estado !== 'cancelado' ? ESTADOS_PEDIDO.indexOf(estado) : -1;
  });

  protected readonly cancelable = computed(() => {
    const estado = this.pedido()?.estado;
    // Ya listo o entregado no se cancela desde la app: eso se arregla en el mostrador
    return estado === 'recibido' || estado === 'en_preparacion';
  });

  protected readonly confirmandoCancelar = signal(false);
  protected readonly reportando = signal(false);
  protected readonly reporte = signal('');

  protected onReporte(event: Event): void {
    this.reporte.set((event.target as HTMLTextAreaElement).value);
  }

  protected cancelar(): void {
    const pedido = this.pedido();
    if (!pedido) return;

    this.store.cancelar(pedido.folio);
    this.confirmandoCancelar.set(false);
    this.toast.ok(`${pedido.folio} se canceló. La cafetería ya no lo preparará.`);
  }

  /** Vuelve a pedir lo mismo: llena el carrito y lleva al menú para confirmar. */
  protected volverAPedir(): void {
    const pedido = this.pedido();
    if (!pedido) return;

    try {
      this.agregarAlCarrito(pedido);
      this.toast.ok('Tu carrito ya tiene este pedido. Revísalo y confírmalo.');
      void this.router.navigate(['/inicio']);
    } catch (e) {
      // CarritoService no deja mezclar cafeterías: hay que vaciar primero
      this.toast.error(e instanceof Error ? e.message : 'No se pudo llenar el carrito.');
    }
  }

  private agregarAlCarrito(pedido: Pedido): void {
    for (const item of pedido.items) {
      this.carrito.agregar({
        // El mock no guarda ids de producto: se usa el nombre, que aquí es único por pedido
        idProducto: `${pedido.folio}-${item.producto}`,
        producto: item.producto,
        precio: item.precio,
        cantidad: item.cantidad,
        imagenUrl: item.foto,
        idCafeteria: pedido.folio,
        cafeteria: pedido.cafeteria,
      });
    }
  }

  protected enviarReporte(): void {
    const pedido = this.pedido();
    if (!pedido || !this.reporte().trim()) return;

    this.reportando.set(false);
    this.reporte.set('');
    this.toast.ok('Recibimos tu reporte. El equipo lo revisará con la cafetería.');
  }
}
