// JY-Sprint4 05/11/2026: HU-08 (cascarón visual). Detalle de un pedido: avance del estado, artículos, pago
// y punto de entrega.
// CL-Sprint5 11/11/2026: lee y cancela con MisPedidosFacade (feature ordenes, hoy con repositorio mock). La
// URL lleva el id de la orden (/pedidos/:id) en vez del folio, porque la BD no tiene folio; el folio que se
// muestra se deriva del id. Cancelar respeta la regla de sp_cancelar_orden (solo pendiente o confirmada).
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiError } from '@core/http/api-error';
import { ModalComponent } from '@shared/ui/modal/modal.component';
import { ToastService } from '@shared/ui/toast/toast.service';
import {
  ETAPAS_ALUMNO,
  ETIQUETA_ETAPA,
  MisPedidosFacade,
  Orden,
  cancelablePorAlumno,
  enCurso,
  etapa,
  pasoAlumno,
} from '@features/ordenes';
import { CarritoStore } from '@features/alumno/application/carrito.store';

@Component({
  selector: 'app-pedido-detalle-page',
  imports: [CurrencyPipe, DatePipe, RouterLink, ModalComponent],
  templateUrl: './pedido-detalle.page.html',
  styleUrl: './pedido-detalle.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidoDetallePage {
  /** Id de la orden en la URL (/pedidos/:id); lo entrega el router con withComponentInputBinding. */
  readonly id = input<string>('');

  private readonly pedidos = inject(MisPedidosFacade);
  private readonly carrito = inject(CarritoStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly etiqueta = ETIQUETA_ETAPA;
  protected readonly etapa = etapa;
  protected readonly pasos = ETAPAS_ALUMNO;
  protected readonly sinImagen = 'assets/images/producto-sin-imagen.svg';
  protected readonly cargando = this.pedidos.cargando;

  protected readonly pedido = computed(() => this.pedidos.porId(this.id()));

  /** Posición en la línea de tiempo; -1 si está cancelado (la línea se reemplaza por un aviso). */
  protected readonly pasoActual = computed(() => {
    const pedido = this.pedido();
    return pedido ? pasoAlumno(pedido.estado) : -1;
  });

  // Ya en preparación, listo o entregado no se cancela desde la app: eso se arregla en el mostrador
  protected readonly cancelable = computed(() => {
    const pedido = this.pedido();
    return !!pedido && cancelablePorAlumno(pedido);
  });

  protected readonly terminado = computed(() => {
    const pedido = this.pedido();
    return !!pedido && !enCurso(pedido);
  });

  protected readonly confirmandoCancelar = signal(false);
  protected readonly reportando = signal(false);
  protected readonly reporte = signal('');

  constructor() {
    // Trae el pedido (con sus artículos) cada vez que cambia el id de la URL
    effect(() => {
      const id = this.id();
      if (id) untracked(() => this.pedidos.obtener(id).subscribe({ error: () => undefined }));
    });
  }

  protected onReporte(event: Event): void {
    this.reporte.set((event.target as HTMLTextAreaElement).value);
  }

  protected cancelar(): void {
    const pedido = this.pedido();
    if (!pedido) return;

    this.confirmandoCancelar.set(false);
    this.pedidos.cancelar(pedido.idOrden).subscribe({
      next: () => this.toast.ok(`${pedido.folio} se canceló. La cafetería ya no lo preparará.`),
      error: (e: ApiError) => this.toast.error(e?.message ?? 'No se pudo cancelar el pedido.'),
    });
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
      // El carrito no deja mezclar cafeterías: hay que vaciar primero
      this.toast.error(e instanceof Error ? e.message : 'No se pudo llenar el carrito.');
    }
  }

  private agregarAlCarrito(pedido: Orden): void {
    for (const linea of pedido.lineas) {
      this.carrito.agregar({
        idProducto: linea.idProducto,
        producto: linea.producto,
        precio: linea.precioUnitario,
        cantidad: linea.cantidad,
        imagenUrl: linea.imagenUrl,
        idCafeteria: pedido.idCafeteria,
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
