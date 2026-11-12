// JY-Sprint4 05/11/2026: HU-08 (cascarón visual). Detalle de un pedido: avance del estado, artículos, pago
// y punto de entrega.
// CL-Sprint5 11/11/2026: lee y cancela con MisPedidosFacade (feature ordenes, hoy con repositorio mock). La
// URL lleva el id de la orden (/pedidos/:id) en vez del folio, porque la BD no tiene folio; el folio que se
// muestra se deriva del id. Cancelar respeta la regla de sp_cancelar_orden (solo pendiente o confirmada).
// CL-Sprint5 11/11/2026 (etapa 6): rediseño con el sistema de diseño.
//   - Línea de tiempo de 4 pasos que avanza en vivo: cada 5 s se vuelve a pedir la orden sin parpadeo (los
//     datos simulados son los mismos que mueve el tablero del negocio). Al quedar lista avisa con un toast.
//   - "Listo para recoger": el código de 6 dígitos en grande, con copiar. Antes, en chico, para tenerlo a mano.
//   - Cancelar solo en los estados que permite la BD, con confirmación; si ya no se puede, dice por qué.
//   - Volver a pedir (app-volver-a-pedir) y Reportar un problema (app-reportar-problema).
//   - Carga con esqueleto, "no encontrado" (404/403) y error con "Reintentar".
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiError } from '@core/http/api-error';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { ModalComponent } from '@shared/ui/modal/modal.component';
import { ToastService } from '@shared/ui/toast/toast.service';
import {
  ETIQUETA_ETAPA,
  EstadoOrden,
  MisPedidosFacade,
  cancelablePorAlumno,
  enCurso,
  etapa,
  motivoNoCancelable,
  piezas,
} from '@features/ordenes';
import { CodigoRecogidaComponent } from '@features/alumno/presentation/components/codigo-recogida/codigo-recogida.component';
import { INFO_METODO } from '@features/alumno/presentation/components/checkout/checkout.component';
import { LineaTiempoComponent } from '@features/alumno/presentation/components/linea-tiempo/linea-tiempo.component';
import { ReportarProblemaComponent } from '@features/alumno/presentation/components/reportar-problema/reportar-problema.component';
import { VolverAPedirComponent } from '@features/alumno/presentation/components/volver-a-pedir/volver-a-pedir.component';
import { CUENTA_DEMO } from '@features/alumno/presentation/pages/pedido-confirmado/pedido-confirmado.page';
import { textoPago } from '@features/alumno/presentation/pedido-texto';

/** Cada cuánto se revisa el estado del pedido mientras sigue en curso. */
export const REFRESCO_DETALLE_MS = 5_000;

@Component({
  selector: 'app-pedido-detalle-page',
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    IconComponent,
    ModalComponent,
    CodigoRecogidaComponent,
    LineaTiempoComponent,
    ReportarProblemaComponent,
    VolverAPedirComponent,
  ],
  templateUrl: './pedido-detalle.page.html',
  styleUrl: './pedido-detalle.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidoDetallePage {
  /** Id de la orden en la URL (/pedidos/:id); lo entrega el router con withComponentInputBinding. */
  readonly id = input<string>('');

  private readonly pedidos = inject(MisPedidosFacade);
  private readonly toast = inject(ToastService);

  protected readonly etiqueta = ETIQUETA_ETAPA;
  protected readonly etapa = etapa;
  protected readonly infoMetodo = INFO_METODO;
  protected readonly cuenta = CUENTA_DEMO;
  protected readonly piezas = piezas;
  protected readonly textoPago = textoPago;
  protected readonly sinImagen = 'assets/images/producto-sin-imagen.svg';

  protected readonly pedido = computed(() => this.pedidos.porId(this.id()));
  /** Error al traer la orden (si no estaba ya en la lista). */
  protected readonly fallo = signal<ApiError | null>(null);
  protected readonly noExiste = computed(() => {
    const s = this.fallo()?.status;
    return s === 404 || s === 403;
  });

  protected readonly activo = computed(() => {
    const p = this.pedido();
    return !!p && enCurso(p);
  });
  protected readonly cancelable = computed(() => {
    const p = this.pedido();
    return !!p && cancelablePorAlumno(p);
  });
  protected readonly motivoNoCancelar = computed(() => {
    const p = this.pedido();
    return p ? motivoNoCancelable(p) : null;
  });

  protected readonly confirmandoCancelar = signal(false);
  protected readonly cancelando = signal(false);
  protected readonly errorCancelar = signal<string | null>(null);
  protected readonly reportando = signal(false);

  constructor() {
    // Trae el pedido (con sus artículos) cada vez que cambia el id de la URL
    effect(() => {
      const id = this.id();
      untracked(() => this.traer(id));
    });

    // En vivo mientras siga en curso y la pestaña del navegador esté a la vista
    const reloj = setInterval(() => {
      const p = untracked(this.pedido);
      if (p && enCurso(p) && document.visibilityState === 'visible') {
        this.pedidos.refrescarPedido(p.idOrden).subscribe({ error: () => undefined });
      }
    }, REFRESCO_DETALLE_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(reloj));

    // Aviso cuando la cafetería lo deja listo (solo si cambió mientras el alumno miraba)
    let anterior: { id: string; estado: EstadoOrden } | null = null;
    effect(() => {
      const p = this.pedido();
      if (!p) return;
      if (anterior?.id === p.idOrden && anterior.estado !== p.estado && p.estado === 'lista') {
        this.toast.ok('¡Tu pedido está listo! Muestra tu código en el mostrador.');
      }
      anterior = { id: p.idOrden, estado: p.estado };
    });
  }

  protected traer(id = this.id()): void {
    if (!id) return;
    this.fallo.set(null);
    this.pedidos.obtener(id).subscribe({ error: (e: ApiError) => this.fallo.set(e ?? { status: 0, message: '' }) });
  }

  protected abrirCancelar(): void {
    this.errorCancelar.set(null);
    this.confirmandoCancelar.set(true);
  }

  protected cerrarCancelar(): void {
    if (!this.cancelando()) this.confirmandoCancelar.set(false);
  }

  protected cancelar(): void {
    const p = this.pedido();
    if (!p || this.cancelando()) return;

    this.cancelando.set(true);
    this.errorCancelar.set(null);
    this.pedidos.cancelar(p.idOrden).subscribe({
      next: () => {
        this.cancelando.set(false);
        this.confirmandoCancelar.set(false);
        this.toast.ok(`Cancelamos tu pedido ${p.folio}. La cafetería ya no lo preparará.`);
      },
      error: (e: ApiError) => {
        // Lo más común: la cafetería lo pasó a preparación mientras el alumno decidía
        this.cancelando.set(false);
        this.errorCancelar.set(e?.message ?? 'No se pudo cancelar el pedido.');
        this.pedidos.refrescarPedido(p.idOrden).subscribe({ error: () => undefined });
      },
    });
  }
}
