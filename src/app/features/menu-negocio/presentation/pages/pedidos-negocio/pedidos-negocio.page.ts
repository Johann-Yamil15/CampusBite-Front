// JY-Sprint4 05/11/2026: HU futura (cascarón visual). Tablero de pedidos del negocio: tres columnas
// (Nuevos · En preparación · Listos) y una pestaña de cerrados. Avanzar, entregar y rechazar cambian el
// estado solo en memoria: cuando exista OrdenesController esto llamará a sp_cambiar_estado_orden,
// sp_entregar_orden y sp_cancelar_orden, que ya están en la BD.
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ModalComponent } from '@shared/ui/modal/modal.component';
import { PaginadorComponent, pagina } from '@shared/ui/paginador/paginador.component';
import { ToastService } from '@shared/ui/toast/toast.service';
import {
  COLUMNAS,
  Columna,
  ETIQUETA_COLUMNA,
  ETIQUETA_ESTADO,
  ORDENES,
  OrdenNegocio,
  piezas,
  totalOrden,
} from './pedidos.mock';

/** El siguiente estado de cada columna cuando el encargado toca "Avanzar". */
const SIGUIENTE: Record<Columna, OrdenNegocio['estado']> = {
  recibido: 'en_preparacion',
  en_preparacion: 'listo',
  listo: 'entregado',
};

const ACCION: Record<Columna, string> = {
  recibido: 'Aceptar y preparar',
  en_preparacion: 'Marcar listo',
  listo: 'Marcar entregado',
};

const POR_PAGINA = 6;

@Component({
  selector: 'app-pedidos-negocio-page',
  imports: [CurrencyPipe, DatePipe, ModalComponent, PaginadorComponent],
  templateUrl: './pedidos-negocio.page.html',
  styleUrl: './pedidos-negocio.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidosNegocioPage {
  private readonly toast = inject(ToastService);

  protected readonly columnas = COLUMNAS;
  protected readonly porPagina = POR_PAGINA;
  protected readonly etiquetaColumna = ETIQUETA_COLUMNA;
  protected readonly etiquetaEstado = ETIQUETA_ESTADO;
  protected readonly accion = ACCION;
  protected readonly total = totalOrden;
  protected readonly piezas = piezas;

  private readonly ordenes = signal<OrdenNegocio[]>(ORDENES);

  protected readonly vista = signal<'tablero' | 'cerrados'>('tablero');
  protected readonly pagina = signal(1);

  protected readonly cerrados = computed(() =>
    this.ordenes().filter((o) => o.estado === 'entregado' || o.estado === 'cancelado'),
  );

  protected readonly porCobrar = computed(() =>
    this.ordenes()
      .filter((o) => o.estado !== 'cancelado' && o.estado !== 'entregado')
      .reduce((suma, o) => suma + totalOrden(o), 0),
  );

  protected readonly activos = computed(
    () => this.ordenes().filter((o) => o.estado !== 'entregado' && o.estado !== 'cancelado').length,
  );

  protected readonly cerradosPagina = computed(() =>
    pagina(this.cerrados(), this.pagina(), POR_PAGINA),
  );

  constructor() {
    // Al cerrar o rechazar pedidos la página actual puede quedar fuera de rango
    effect(() => {
      const paginas = Math.max(Math.ceil(this.cerrados().length / POR_PAGINA), 1);
      if (this.pagina() > paginas) this.pagina.set(paginas);
    });
  }

  protected enColumna(columna: Columna): OrdenNegocio[] {
    return this.ordenes().filter((o) => o.estado === columna);
  }

  // ---------- Detalle y rechazo ----------
  protected readonly abierta = signal<OrdenNegocio | null>(null);
  protected readonly rechazando = signal<OrdenNegocio | null>(null);
  protected readonly motivo = signal('');

  protected onMotivo(event: Event): void {
    this.motivo.set((event.target as HTMLTextAreaElement).value);
  }

  protected abrir(orden: OrdenNegocio): void {
    this.abierta.set(orden);
  }

  protected cerrar(): void {
    this.abierta.set(null);
  }

  protected pedirMotivo(orden: OrdenNegocio): void {
    this.motivo.set('');
    this.abierta.set(null);
    this.rechazando.set(orden);
  }

  protected avanzar(orden: OrdenNegocio): void {
    // 'entregado' y 'cancelado' no avanzan: ya están cerrados
    if (orden.estado === 'entregado' || orden.estado === 'cancelado') return;

    const siguiente = SIGUIENTE[orden.estado];
    this.cambiarEstado(orden.folio, siguiente);
    this.toast.ok(`${orden.folio}: ahora está en "${ETIQUETA_ESTADO[siguiente]}".`);
    this.cerrar();
  }

  protected rechazar(): void {
    const orden = this.rechazando();
    if (!orden) return;

    this.cambiarEstado(orden.folio, 'cancelado');
    this.toast.ok(`${orden.folio} se rechazó. Se le avisará al alumno.`);
    this.rechazando.set(null);
  }

  private cambiarEstado(folio: string, estado: OrdenNegocio['estado']): void {
    this.ordenes.update((lista) =>
      lista.map((o) => (o.folio === folio ? { ...o, estado } : o)),
    );
  }
}
