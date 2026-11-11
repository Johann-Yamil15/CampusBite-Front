// CL-Sprint5 11/11/2026 (etapa 5): checkout del alumno. Reemplaza al diálogo de Angular Material
// confirmar-orden (FB-Sprint4), que tenía textos casi invisibles, se veía blanco en modo oscuro y usaba el
// selector de fecha y hora del navegador. Ahora es un app-modal (hoja que sube desde abajo en teléfono) con:
//   - hora de recogida en chips ("Lo antes posible", "En 30 min"…) solo dentro del horario de hoy,
//   - método de pago en tarjetas seleccionables, solo los que acepta la cafetería,
//   - notas (200 caracteres, como orden.notas) y el resumen del pedido.
// Al confirmar crea la orden con MisPedidosFacade y lleva a la confirmación con el código de recogida.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ApiError } from '@core/http/api-error';
import { CatalogoFacade, MetodoPago } from '@features/catalogo';
import { MAX_NOTAS_ORDEN, MisPedidosFacade, NuevaOrden } from '@features/ordenes';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { NombreIcono } from '@shared/ui/icon/icons';
import { ModalComponent } from '@shared/ui/modal/modal.component';
import { CarritoStore } from '@features/alumno/application/carrito.store';
import {
  MINUTOS_MINIMOS_RECOGIDA,
  OpcionRecogida,
  opcionesRecogida,
} from '@features/alumno/domain/models/recogida.model';
import { CarritoUiService } from '@features/alumno/presentation/carrito-ui.service';

interface InfoMetodo {
  etiqueta: string;
  detalle: string;
  icono: NombreIcono;
}

export const INFO_METODO: Record<MetodoPago, InfoMetodo> = {
  efectivo: { etiqueta: 'Efectivo', detalle: 'Pagas en el mostrador al recoger.', icono: 'efectivo' },
  tarjeta: { etiqueta: 'Tarjeta', detalle: 'Se cobra en línea al confirmar (simulado en esta versión).', icono: 'tarjeta' },
  transferencia: {
    etiqueta: 'Transferencia',
    detalle: 'Te damos los datos; la cafetería confirma tu pago y empieza a preparar.',
    icono: 'transferencia',
  },
};

/** Cada cuánto se recalculan los horarios con el modal abierto (para no ofrecer uno que ya pasó). */
const REFRESCO_MS = 30_000;

/** ISO-8601 con el offset local (2026-10-27T13:00:00-06:00), como lo documenta el back. */
export function aIsoConOffset(fecha: Date): string {
  const p = (n: number) => String(Math.trunc(Math.abs(n))).padStart(2, '0');
  const offset = -fecha.getTimezoneOffset();
  const signo = offset >= 0 ? '+' : '-';
  return (
    `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())}` +
    `T${p(fecha.getHours())}:${p(fecha.getMinutes())}:${p(fecha.getSeconds())}` +
    `${signo}${p(offset / 60)}:${p(offset % 60)}`
  );
}

@Component({
  selector: 'app-checkout',
  imports: [CurrencyPipe, DatePipe, IconComponent, ModalComponent],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutComponent {
  protected readonly carrito = inject(CarritoStore);
  private readonly catalogo = inject(CatalogoFacade);
  private readonly pedidos = inject(MisPedidosFacade);
  private readonly ui = inject(CarritoUiService);
  private readonly router = inject(Router);

  protected readonly infoMetodo = INFO_METODO;
  protected readonly maxNotas = MAX_NOTAS_ORDEN;

  /** Reloj del checkout: cambia cada REFRESCO_MS para que los horarios sigan siendo válidos. */
  protected readonly ahora = signal(new Date());

  protected readonly cafeteria = computed(() => this.catalogo.cafeteria(this.carrito.idCafeteria()));

  protected readonly opciones = computed<OpcionRecogida[]>(() => {
    const c = this.cafeteria();
    return c ? opcionesRecogida(this.ahora(), c) : [];
  });

  protected readonly metodos = computed<MetodoPago[]>(() => this.cafeteria()?.metodosPago ?? []);

  /** Índice del horario elegido (0 = lo antes posible). */
  protected readonly recogida = signal(0);
  protected readonly metodo = signal<MetodoPago | null>(null);
  protected readonly notas = signal('');
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly listo = computed(
    () => !!this.opciones()[this.recogida()] && !!this.metodo() && !this.carrito.isEmpty(),
  );

  constructor() {
    // Si se entra con un carrito de una cafetería que no está en el menú cargado, se trae
    const id = this.carrito.idCafeteria();
    if (id && !this.catalogo.cafeteria(id)) {
      this.catalogo.cargarCafeteria(id).subscribe({ error: () => undefined });
    }

    const reloj = setInterval(() => this.ahora.set(new Date()), REFRESCO_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(reloj));

    // El primer método que acepta la cafetería queda elegido (el alumno lo cambia con un toque)
    effect(() => {
      const metodos = this.metodos();
      untracked(() => {
        const actual = this.metodo();
        if (!actual || !metodos.includes(actual)) this.metodo.set(metodos[0] ?? null);
      });
    });

    // Si al refrescar el horario elegido ya no existe, se regresa a "lo antes posible"
    effect(() => {
      const n = this.opciones().length;
      if (untracked(this.recogida) >= n) this.recogida.set(0);
    });
  }

  protected onNotas(event: Event): void {
    this.notas.set((event.target as HTMLTextAreaElement).value.slice(0, MAX_NOTAS_ORDEN));
  }

  protected cerrar(): void {
    if (!this.enviando()) this.ui.cerrarCheckout();
  }

  protected volverAlCarrito(): void {
    this.ui.cerrarCheckout();
    this.ui.abrir();
  }

  protected confirmar(): void {
    const idCafeteria = this.carrito.idCafeteria();
    const metodo = this.metodo();
    if (!idCafeteria || !metodo || this.enviando()) return;

    // El horario pudo vencerse con el modal abierto: se recalcula justo antes de enviar
    this.ahora.set(new Date());
    const opcion = this.opciones()[this.recogida()];
    if (!opcion || opcion.fecha.getTime() < Date.now() + MINUTOS_MINIMOS_RECOGIDA * 60_000) {
      this.recogida.set(0);
      this.error.set('Ese horario ya no está disponible. Elegimos el más cercano; revísalo y confirma otra vez.');
      return;
    }

    const notas = this.notas().trim();
    const nueva: NuevaOrden = {
      idCafeteria,
      recogidaEn: aIsoConOffset(opcion.fecha),
      metodo,
      items: this.carrito.items().map((i) => ({ idProducto: i.idProducto, cantidad: i.cantidad })),
      ...(notas ? { notas } : {}),
    };

    this.enviando.set(true);
    this.error.set(null);
    this.pedidos.crear(nueva).subscribe({
      next: (orden) => {
        this.enviando.set(false);
        this.carrito.vaciar();
        this.ui.cerrarCheckout();
        // Sin aviso flotante: la pantalla de confirmación ya lo dice (y el aviso tapaba su encabezado)
        void this.router.navigate(['/pedidos', orden.idOrden, 'confirmado']);
      },
      error: (e: ApiError) => {
        this.enviando.set(false);
        this.error.set(e?.message ?? 'No se pudo enviar tu pedido. Intenta de nuevo.');
      },
    });
  }
}
