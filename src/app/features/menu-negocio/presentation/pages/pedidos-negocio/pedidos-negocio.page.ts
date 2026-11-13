// JY-Sprint4 05/11/2026: HU futura (cascarón visual). Tablero de pedidos del negocio: tres columnas
// (Nuevos · En preparación · Listos) y una pestaña de cerrados.
// CL-Sprint5 11/11/2026: las órdenes salen de PedidosCafeteriaFacade (feature ordenes, hoy con repositorio
// mock) con los estados reales de la BD: "Nuevos" = pendiente y confirmada.
// CL-Sprint5 11/11/2026 (etapa 9): rediseño con el sistema de diseño.
//   - Pestañas Nuevos / En preparación / Listos / Cerrados (en la URL: ?ver=); en escritorio las tres
//     activas se ven como columnas a la vez.
//   - Cada pedido ofrece solo la siguiente transición que permite la BD: confirmar pago (transferencia),
//     iniciar preparación, marcar listo y entregar.
//   - Entregar pide TECLEAR el código de 6 dígitos que muestra el alumno (ya no se manda el de la propia
//     orden); si no coincide, no se entrega y se dice por qué.
//   - Rechazar o cancelar con motivo (lo ve el alumno) y confirmación.
//   - Los pedidos que llegan con el tablero abierto se resaltan (el aviso flotante lo da el layout).
//   - Los datos son los mismos que ve el alumno: lo que se hace aquí se ve en su detalle en vivo y viceversa.
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
import { CurrencyPipe, DatePipe, NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ApiError } from '@core/http/api-error';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { ModalComponent } from '@shared/ui/modal/modal.component';
import { PaginadorComponent, pagina } from '@shared/ui/paginador/paginador.component';
import { ToastService } from '@shared/ui/toast/toast.service';
import {
  AccionTablero,
  ETIQUETA_ETAPA,
  Etapa,
  LONGITUD_CODIGO_RECOGIDA,
  MAX_MOTIVO_RECHAZO,
  MIN_MOTIVO_RECHAZO,
  MOTIVOS_RECHAZO,
  Orden,
  PedidosCafeteriaFacade,
  accionTablero,
  codigoValido,
  enCurso,
  etapa,
  piezas,
} from '@features/ordenes';

/** Pestañas del tablero, en el orden en que avanza un pedido. */
export const PESTANAS = ['nuevos', 'preparacion', 'listos', 'cerrados'] as const;
export type Pestana = (typeof PESTANAS)[number];
type Columna = Exclude<Pestana, 'cerrados'>;

const COLUMNAS: Columna[] = ['nuevos', 'preparacion', 'listos'];

const ETIQUETA: Record<Pestana, string> = {
  nuevos: 'Nuevos',
  preparacion: 'En preparación',
  listos: 'Listos',
  cerrados: 'Cerrados',
};

const ETAPA_DE: Record<Columna, Etapa> = {
  nuevos: 'recibido',
  preparacion: 'en_preparacion',
  listos: 'listo',
};

const VACIO: Record<Pestana, string> = {
  nuevos: 'No hay pedidos nuevos. Te avisamos en cuanto llegue uno.',
  preparacion: 'Nada en preparación.',
  listos: 'Ningún pedido esperando a que lo recojan.',
  cerrados: 'Todavía no hay pedidos entregados ni cancelados hoy.',
};

const BOTON: Record<Exclude<AccionTablero, null>, string> = {
  confirmar_pago: 'Confirmar pago',
  preparar: 'Iniciar preparación',
  marcar_lista: 'Marcar listo',
  entregar: 'Entregar',
};

/** Cada cuánto se recalcula "en 15 min" / "hace 5 min". */
const RELOJ_MS = 30_000;
const POR_PAGINA = 8;
const OTRO = 'Otro';

@Component({
  selector: 'app-pedidos-negocio-page',
  imports: [CurrencyPipe, DatePipe, NgTemplateOutlet, IconComponent, ModalComponent, PaginadorComponent],
  templateUrl: './pedidos-negocio.page.html',
  styleUrl: './pedidos-negocio.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidosNegocioPage {
  /** ?ver= (con withComponentInputBinding; si no viene llega `undefined`). */
  readonly ver = input<string | undefined>();

  private readonly toast = inject(ToastService);
  private readonly pedidos = inject(PedidosCafeteriaFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly pestanas = PESTANAS;
  protected readonly columnas = COLUMNAS;
  protected readonly etiqueta = ETIQUETA;
  protected readonly etiquetaEtapa = ETIQUETA_ETAPA;
  protected readonly vacio = VACIO;
  protected readonly boton = BOTON;
  protected readonly motivos = [...MOTIVOS_RECHAZO, OTRO];
  protected readonly otro = OTRO;
  protected readonly largoCodigo = LONGITUD_CODIGO_RECOGIDA;
  protected readonly maxMotivo = MAX_MOTIVO_RECHAZO;
  protected readonly porPagina = POR_PAGINA;
  protected readonly accionDe = accionTablero;
  protected readonly etapa = etapa;
  protected readonly piezas = piezas;

  private readonly ordenes = this.pedidos.ordenes;
  protected readonly cargando = this.pedidos.cargando;
  protected readonly error = this.pedidos.error;
  protected readonly recientes = this.pedidos.recientes;
  /** Hay una acción en curso: evita el doble clic que mandaría la misma transición dos veces. */
  protected readonly procesando = signal<string | null>(null);
  private readonly cargado = signal(false);

  protected readonly pestana = computed<Pestana>(() => {
    const v = this.ver();
    return (PESTANAS as readonly string[]).includes(v ?? '') ? (v as Pestana) : 'nuevos';
  });

  protected readonly porColumna = computed<Record<Columna, Orden[]>>(() => {
    const lista = this.ordenes();
    return {
      nuevos: lista.filter((o) => etapa(o.estado) === ETAPA_DE.nuevos),
      preparacion: lista.filter((o) => etapa(o.estado) === ETAPA_DE.preparacion),
      listos: lista.filter((o) => etapa(o.estado) === ETAPA_DE.listos),
    };
  });
  protected readonly cerrados = computed(() =>
    this.ordenes()
      .filter((o) => !enCurso(o))
      .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn)),
  );
  protected readonly cuenta = computed<Record<Pestana, number>>(() => ({
    nuevos: this.porColumna().nuevos.length,
    preparacion: this.porColumna().preparacion.length,
    listos: this.porColumna().listos.length,
    cerrados: this.cerrados().length,
  }));
  protected readonly activos = computed(() => this.ordenes().filter(enCurso).length);
  protected readonly porCobrar = computed(() =>
    this.ordenes()
      .filter((o) => enCurso(o) && o.estadoPago === 'pendiente')
      .reduce((suma, o) => suma + o.total, 0),
  );
  protected readonly sinPedidos = computed(() => this.cargado() && !this.ordenes().length);

  protected readonly paginaCerrados = signal(1);
  protected readonly cerradosPagina = computed(() =>
    pagina(this.cerrados(), this.paginaCerrados(), POR_PAGINA),
  );

  /** Reloj para "en 15 min" / "hace 5 min". */
  protected readonly ahora = signal(Date.now());

  /**
   * Id de la cafetería del encargado: lo resuelve /mi-negocio (cafeteriaDelEncargadoResolver) en la
   * ruta padre. Esta ruta no lo hereda sola porque tiene path propio.
   */
  private readonly idCafeteria: string =
    this.route.snapshot.pathFromRoot.map((r) => r.data['id'] as string | undefined).find(Boolean) ??
    '';

  constructor() {
    this.cargar();
    const reloj = setInterval(() => this.ahora.set(Date.now()), RELOJ_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(reloj));

    effect(() => {
      const paginas = Math.max(Math.ceil(this.cerrados().length / POR_PAGINA), 1);
      if (untracked(this.paginaCerrados) > paginas) this.paginaCerrados.set(paginas);
    });
  }

  protected cargar(): void {
    this.pedidos.cargar(this.idCafeteria).subscribe({
      next: () => this.cargado.set(true),
      error: () => undefined,
    });
  }

  protected verPestana(p: Pestana): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ver: p === 'nuevos' ? null : p },
      replaceUrl: true,
    });
  }

  /** Flechas izquierda/derecha entre pestañas (patrón tablist de WAI-ARIA). */
  protected teclaPestana(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const i = PESTANAS.indexOf(this.pestana());
    const paso = event.key === 'ArrowRight' ? 1 : -1;
    const otra = PESTANAS[(i + paso + PESTANAS.length) % PESTANAS.length];
    this.verPestana(otra);
    const lista = (event.currentTarget as HTMLElement).closest('[role="tablist"]');
    lista?.querySelector<HTMLElement>(`#tab-${otra}`)?.focus();
  }

  protected visto(orden: Orden): void {
    this.pedidos.visto(orden.idOrden);
  }

  /** Minutos que faltan para la recogida (negativo = ya pasó la hora). */
  protected minutosPara(orden: Orden): number {
    return Math.round((new Date(orden.recogidaEn).getTime() - this.ahora()) / 60_000);
  }

  // ---------- Acciones ----------

  protected accionar(orden: Orden): void {
    this.visto(orden);
    const accion = accionTablero(orden);
    if (!accion || this.procesando()) return;
    if (accion === 'entregar') {
      this.abrirEntrega(orden);
      return;
    }
    const llamada: Observable<Orden> =
      accion === 'confirmar_pago'
        ? this.pedidos.confirmarPago(orden.idOrden)
        : this.pedidos.cambiarEstado(orden.idOrden, accion === 'preparar' ? 'en_preparacion' : 'lista');
    this.ejecutar(orden, llamada, (o) =>
      accion === 'confirmar_pago'
        ? `${o.folio}: pago confirmado. Ya puedes prepararlo.`
        : `${o.folio}: ahora está "${ETIQUETA_ETAPA[etapa(o.estado)]}".`,
    );
  }

  // ---------- Entregar con código ----------

  protected readonly entregando = signal<Orden | null>(null);
  protected readonly codigo = signal('');
  protected readonly errorCodigo = signal<string | null>(null);
  protected readonly codigoCompleto = computed(() => codigoValido(this.codigo()));

  private abrirEntrega(orden: Orden): void {
    this.codigo.set('');
    this.errorCodigo.set(null);
    this.entregando.set(orden);
  }

  protected escribirCodigo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const limpio = input.value.replace(/\D/g, '').slice(0, LONGITUD_CODIGO_RECOGIDA);
    input.value = limpio;
    this.codigo.set(limpio);
    this.errorCodigo.set(null);
  }

  protected entregar(event?: Event): void {
    event?.preventDefault();
    const orden = this.entregando();
    if (!orden || this.procesando()) return;
    if (!this.codigoCompleto()) {
      this.errorCodigo.set(`Escribe los ${LONGITUD_CODIGO_RECOGIDA} dígitos que te muestra el alumno.`);
      return;
    }
    this.procesando.set(orden.idOrden);
    this.pedidos.entregar(orden.idOrden, this.codigo()).subscribe({
      next: (o) => {
        this.procesando.set(null);
        this.entregando.set(null);
        this.toast.ok(`Entregaste ${o.folio}${o.alumno ? ' a ' + o.alumno.nombre : ''}.`);
      },
      error: (e: ApiError) => {
        this.procesando.set(null);
        this.codigo.set('');
        this.errorCodigo.set(
          e?.message === 'Código de recogida incorrecto'
            ? 'El código no coincide. Pídeselo de nuevo al alumno; el pedido no se entregó.'
            : (e?.message ?? 'No se pudo entregar el pedido.'),
        );
      },
    });
  }

  protected cerrarEntrega(): void {
    if (!this.procesando()) this.entregando.set(null);
  }

  // ---------- Rechazar / cancelar ----------

  protected readonly rechazando = signal<Orden | null>(null);
  protected readonly motivo = signal<string | null>(null);
  protected readonly motivoOtro = signal('');
  protected readonly motivoFinal = computed(() =>
    this.motivo() === OTRO ? this.motivoOtro().trim() : (this.motivo() ?? ''),
  );
  protected readonly motivoValido = computed(() => this.motivoFinal().length >= MIN_MOTIVO_RECHAZO);

  protected pedirRechazo(orden: Orden): void {
    this.visto(orden);
    this.motivo.set(null);
    this.motivoOtro.set('');
    this.rechazando.set(orden);
  }

  protected escribirMotivo(event: Event): void {
    this.motivoOtro.set((event.target as HTMLTextAreaElement).value.slice(0, MAX_MOTIVO_RECHAZO));
  }

  protected rechazar(): void {
    const orden = this.rechazando();
    if (!orden || !this.motivoValido() || this.procesando()) return;
    const nuevo = etapa(orden.estado) === 'recibido';
    this.ejecutar(orden, this.pedidos.rechazar(orden.idOrden, this.motivoFinal()), (o) =>
      `${o.folio} ${nuevo ? 'se rechazó' : 'se canceló'}. El alumno verá el motivo.`,
      () => this.rechazando.set(null),
    );
  }

  protected cerrarRechazo(): void {
    if (!this.procesando()) this.rechazando.set(null);
  }

  private ejecutar(
    orden: Orden,
    accion: Observable<Orden>,
    mensaje: (orden: Orden) => string,
    alTerminar?: () => void,
  ): void {
    this.procesando.set(orden.idOrden);
    accion.subscribe({
      next: (o) => {
        this.procesando.set(null);
        alTerminar?.();
        this.toast.ok(mensaje(o));
      },
      error: (e: ApiError) => {
        this.procesando.set(null);
        this.toast.error(e?.message ?? 'No se pudo actualizar el pedido.');
        // Puede que el alumno lo haya cancelado o que ya lo hayan movido: se trae el estado real
        this.pedidos.refrescar(this.idCafeteria).subscribe({ error: () => undefined });
      },
    });
  }
}
