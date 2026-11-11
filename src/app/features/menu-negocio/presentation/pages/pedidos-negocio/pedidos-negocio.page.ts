// JY-Sprint4 05/11/2026: HU futura (cascarón visual). Tablero de pedidos del negocio: tres columnas
// (Nuevos · En preparación · Listos) y una pestaña de cerrados.
// CL-Sprint5 11/11/2026: las órdenes salen de PedidosCafeteriaFacade (feature ordenes, hoy con repositorio
// mock) con los estados reales de la BD: "Nuevos" = pendiente y confirmada. Avanzar llama a cambiarEstado
// (sp_cambiar_estado_orden), entregar a entregar (sp_entregar_orden) y rechazar a rechazar.
// shortcut: "Marcar entregado" manda el código de la propia orden; en la etapa 9 el encargado lo teclea
// (el que le muestra el alumno) y aquí solo se valida.
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { ApiError } from '@core/http/api-error';
import { ModalComponent } from '@shared/ui/modal/modal.component';
import { PaginadorComponent, pagina } from '@shared/ui/paginador/paginador.component';
import { ToastService } from '@shared/ui/toast/toast.service';
import {
  Etapa,
  Orden,
  PedidosCafeteriaFacade,
  enCurso,
  etapa,
  piezas,
} from '@features/ordenes';

/** Columnas del tablero, en el orden en que avanza un pedido (son etapas, no estados de la BD). */
const COLUMNAS = ['recibido', 'en_preparacion', 'listo'] as const;
type Columna = (typeof COLUMNAS)[number];

const ETIQUETA_COLUMNA: Record<Columna, string> = {
  recibido: 'Nuevos',
  en_preparacion: 'En preparación',
  listo: 'Listos para recoger',
};

const ETIQUETA_ESTADO: Record<Etapa, string> = {
  recibido: 'Nuevo',
  en_preparacion: 'En preparación',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
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
export class PedidosNegocioPage implements OnInit {
  private readonly toast = inject(ToastService);
  private readonly pedidos = inject(PedidosCafeteriaFacade);
  private readonly route = inject(ActivatedRoute);

  protected readonly columnas = COLUMNAS;
  protected readonly porPagina = POR_PAGINA;
  protected readonly etiquetaColumna = ETIQUETA_COLUMNA;
  protected readonly etiquetaEstado = ETIQUETA_ESTADO;
  protected readonly accion = ACCION;
  protected readonly piezas = piezas;
  protected readonly etapa = etapa;
  protected readonly enCurso = enCurso;

  private readonly ordenes = this.pedidos.ordenes;
  protected readonly cargando = this.pedidos.cargando;
  protected readonly error = this.pedidos.error;
  /** Hay una acción en curso: evita el doble clic que mandaría la misma transición dos veces. */
  protected readonly procesando = signal(false);

  protected readonly vista = signal<'tablero' | 'cerrados'>('tablero');
  protected readonly pagina = signal(1);

  protected readonly cerrados = computed(() => this.ordenes().filter((o) => !enCurso(o)));

  protected readonly porCobrar = computed(() =>
    this.ordenes()
      .filter(enCurso)
      .reduce((suma, o) => suma + o.total, 0),
  );

  protected readonly activos = computed(() => this.ordenes().filter(enCurso).length);

  protected readonly cerradosPagina = computed(() =>
    pagina(this.cerrados(), this.pagina(), POR_PAGINA),
  );

  /**
   * Id de la cafetería del encargado: lo resuelve /mi-negocio (cafeteriaDelEncargadoResolver) en la
   * ruta padre. Esta ruta no lo hereda sola porque tiene path propio.
   */
  private readonly idCafeteria: string =
    this.route.snapshot.pathFromRoot.map((r) => r.data['id'] as string | undefined).find(Boolean) ??
    '';

  constructor() {
    // Al cerrar o rechazar pedidos la página actual puede quedar fuera de rango
    effect(() => {
      const paginas = Math.max(Math.ceil(this.cerrados().length / POR_PAGINA), 1);
      if (this.pagina() > paginas) this.pagina.set(paginas);
    });
  }

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.pedidos.cargar(this.idCafeteria).subscribe({ error: () => undefined });
  }

  protected enColumna(columna: Columna): Orden[] {
    return this.ordenes().filter((o) => etapa(o.estado) === columna);
  }

  /** La columna de una orden en curso (para el texto del botón de avanzar). */
  protected columnaDe(orden: Orden): Columna {
    const e = etapa(orden.estado);
    return e === 'entregado' || e === 'cancelado' ? 'listo' : e;
  }

  // ---------- Detalle y rechazo ----------
  protected readonly abierta = signal<Orden | null>(null);
  protected readonly rechazando = signal<Orden | null>(null);
  protected readonly motivo = signal('');

  protected onMotivo(event: Event): void {
    this.motivo.set((event.target as HTMLTextAreaElement).value);
  }

  protected abrir(orden: Orden): void {
    this.abierta.set(orden);
  }

  protected cerrar(): void {
    this.abierta.set(null);
  }

  protected pedirMotivo(orden: Orden): void {
    this.motivo.set('');
    this.abierta.set(null);
    this.rechazando.set(orden);
  }

  protected avanzar(orden: Orden): void {
    if (!enCurso(orden) || this.procesando()) return;

    const columna = this.columnaDe(orden);
    const accion: Observable<Orden> =
      columna === 'recibido'
        ? this.pedidos.cambiarEstado(orden.idOrden, 'en_preparacion')
        : columna === 'en_preparacion'
          ? this.pedidos.cambiarEstado(orden.idOrden, 'lista')
          : this.pedidos.entregar(orden.idOrden, orden.codigoRecogida);

    this.ejecutar(accion, (o) => `${o.folio}: ahora está en "${ETIQUETA_ESTADO[etapa(o.estado)]}".`);
    this.cerrar();
  }

  protected rechazar(): void {
    const orden = this.rechazando();
    if (!orden || !this.motivo().trim()) return;

    this.rechazando.set(null);
    this.ejecutar(
      this.pedidos.rechazar(orden.idOrden, this.motivo().trim()),
      (o) => `${o.folio} se rechazó. Se le avisará al alumno.`,
    );
  }

  private ejecutar(accion: Observable<Orden>, mensaje: (orden: Orden) => string): void {
    this.procesando.set(true);
    accion.subscribe({
      next: (o) => {
        this.procesando.set(false);
        this.toast.ok(mensaje(o));
      },
      error: (e: ApiError) => {
        this.procesando.set(false);
        this.toast.error(e?.message ?? 'No se pudo actualizar el pedido.');
      },
    });
  }
}
