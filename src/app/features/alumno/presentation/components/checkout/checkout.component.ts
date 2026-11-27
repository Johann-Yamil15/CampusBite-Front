// CL-Sprint5 11/11/2026 (etapa 5): checkout del alumno. Reemplaza al diálogo de Angular Material
// confirmar-orden (FB-Sprint4), que tenía textos casi invisibles, se veía blanco en modo oscuro y usaba el
// selector de fecha y hora del navegador. Ahora es un app-modal (hoja que sube desde abajo en teléfono) con:
//   - hora de recogida en chips ("Lo antes posible", "En 30 min"…) solo dentro del horario de hoy,
//   - método de pago en tarjetas seleccionables, solo los que acepta la cafetería,
//   - notas (200 caracteres, como orden.notas) y el resumen del pedido.
// Al confirmar crea la orden con MisPedidosFacade y lleva a la confirmación con el código de recogida.
// CL-Sprint5 26/11/2026: modo sin conexión. Hora, método y notas se guardan en un borrador por usuario (se
// recuperan al recargar, también sin internet). Sin internet no se envía: queda «Reintentar». Si el envío
// falló SIN respuesta (status 0, pudo llegar), al volver el internet se revisa "Mis pedidos" y, si aparece un
// pedido de esa cafetería de hace pocos minutos, se manda a verlo en vez de dejar pedir otra vez.
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
import { BorradoresService, esObjeto } from '@core/services/borradores.service';
import { alReconectar } from '@core/utils/al-reconectar';
import { MENSAJE_NO_ENVIADO, envioSinRed } from '@core/utils/envio-sin-red';
import { CatalogoFacade, MetodoPago } from '@features/catalogo';
import { MAX_NOTAS_ORDEN, MisPedidosFacade, NuevaOrden, Orden } from '@features/ordenes';
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
import { PerfilFacade } from '@features/alumno/application/perfil.facade';

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

/** CL-Sprint5 26/11/2026: borrador del checkout (cb.borrador.<sub>.checkout). Sin código de recogida. */
export const BORRADOR_CHECKOUT = 'checkout';
/** Un pedido de esa cafetería creado hasta estos minutos antes del intento cuenta como "sí llegó". */
export const MINUTOS_PEDIDO_QUE_LLEGO = 10;

export interface BorradorCheckout {
  /** Hora de recogida elegida (ms); `null` = "Lo antes posible". */
  recogidaEn: number | null;
  metodo: MetodoPago | null;
  notas: string;
  /** Envío que falló sin respuesta (ms del intento): hay que revisar si el pedido llegó antes de reintentar. */
  intentoIncierto: number | null;
}

const METODOS: readonly string[] = Object.keys(INFO_METODO);
const numeroONull = (v: unknown) => v === null || (typeof v === 'number' && Number.isFinite(v));

export function esBorradorCheckout(d: unknown): d is BorradorCheckout {
  return (
    esObjeto(d) &&
    numeroONull(d['recogidaEn']) &&
    numeroONull(d['intentoIncierto']) &&
    (d['metodo'] === null || (typeof d['metodo'] === 'string' && METODOS.includes(d['metodo']))) &&
    typeof d['notas'] === 'string' &&
    d['notas'].length <= MAX_NOTAS_ORDEN
  );
}

/** Índice de la opción más cercana a `recogidaEn`; 0 si ya pasó (es antes de "lo antes posible"). */
export function indiceMasCercano(opciones: OpcionRecogida[], recogidaEn: number): number {
  if (!opciones.length || recogidaEn < opciones[0].fecha.getTime()) return 0;
  let mejor = 0;
  opciones.forEach((o, i) => {
    const distancia = Math.abs(o.fecha.getTime() - recogidaEn);
    if (distancia < Math.abs(opciones[mejor].fecha.getTime() - recogidaEn)) mejor = i;
  });
  return mejor;
}

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
  private readonly perfil = inject(PerfilFacade);
  private readonly borradores = inject(BorradoresService);
  protected readonly envio = envioSinRed();

  private readonly borrador = this.borradores.leer(BORRADOR_CHECKOUT, esBorradorCheckout);
  /** Hora del borrador por aplicar cuando lleguen los horarios (la cafetería puede tardar en cargar). */
  private recogidaPorRestaurar = this.borrador?.recogidaEn ?? null;

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

  // CL-Sprint5 11/11/2026 (etapa 8): preferencias del Perfil como valores iniciales
  protected readonly metodoPreferido = computed(() => this.perfil.preferencias().metodoPago);
  /** El preferido no se puede usar aquí: se avisa en vez de cambiarlo sin decir nada. */
  protected readonly preferidoNoAceptado = computed(() => {
    const m = this.metodoPreferido();
    return m && this.metodos().length && !this.metodos().includes(m) ? m : null;
  });
  protected readonly esPuntoFrecuente = computed(
    () => !!this.cafeteria() && this.perfil.preferencias().idCafeteriaFrecuente === this.carrito.idCafeteria(),
  );

  /** Índice del horario elegido (0 = lo antes posible). */
  protected readonly recogida = signal(0);
  protected readonly metodo = signal<MetodoPago | null>(this.borrador?.metodo ?? null);
  protected readonly notas = signal(this.borrador?.notas ?? '');
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Aviso suave (no error): p. ej. la hora del borrador ya pasó. */
  protected readonly nota = signal<string | null>(null);
  private readonly intentoIncierto = signal<number | null>(this.borrador?.intentoIncierto ?? null);
  protected readonly comprobando = signal(false);
  /** El pedido que sí llegó tras un envío sin respuesta. */
  protected readonly pedidoQueLlego = signal<Orden | null>(null);

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

    // Queda elegido el método preferido del Perfil si esta cafetería lo acepta; si no, el primero que acepta
    // (el alumno lo cambia con un toque)
    effect(() => {
      const metodos = this.metodos();
      const preferido = this.metodoPreferido();
      untracked(() => {
        // Sin métodos todavía (la cafetería está cargando): no se toca el que venga del borrador
        if (!metodos.length) return;
        const actual = this.metodo();
        if (actual && metodos.includes(actual)) return;
        this.metodo.set(preferido && metodos.includes(preferido) ? preferido : (metodos[0] ?? null));
      });
    });

    // Si al refrescar el horario elegido ya no existe, se regresa a "lo antes posible"
    effect(() => {
      const n = this.opciones().length;
      if (untracked(this.recogida) >= n) this.recogida.set(0);
    });

    // Hora del borrador: la opción más cercana; si ya pasó, "lo antes posible" y se avisa
    effect(() => {
      const opciones = this.opciones();
      untracked(() => {
        const guardada = this.recogidaPorRestaurar;
        if (guardada === null || !opciones.length) return;
        this.recogidaPorRestaurar = null;
        const i = indiceMasCercano(opciones, guardada);
        this.recogida.set(i);
        if (i === 0 && guardada < opciones[0].fecha.getTime()) {
          this.nota.set('La hora que habías elegido ya pasó: elegimos la más cercana.');
        }
      });
    });

    // Todo cambio se guarda en el borrador del usuario
    effect(() => {
      const opciones = this.opciones();
      const i = this.recogida();
      const datos: BorradorCheckout = {
        recogidaEn: i > 0 ? (opciones[i]?.fecha.getTime() ?? null) : null,
        metodo: this.metodo(),
        notas: this.notas(),
        intentoIncierto: this.intentoIncierto(),
      };
      untracked(() => {
        // Mientras llegan los horarios se conserva la hora del borrador
        if (this.recogidaPorRestaurar !== null) datos.recogidaEn = this.recogidaPorRestaurar;
        this.borradores.guardar(BORRADOR_CHECKOUT, datos);
      });
    });

    // Al volver el internet: si hubo un envío sin respuesta se revisa si llegó; si no, se invita a reintentar
    this.revisarSiLlego();
    alReconectar(() => {
      if (this.intentoIncierto() !== null) this.revisarSiLlego();
      else if (this.envio.pendiente()) this.error.set(null);
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
    if (!idCafeteria || !metodo || this.enviando() || this.comprobando()) return;

    // Sin internet no se envía nada: queda el borrador y el botón «Reintentar»
    if (!this.envio.puedeEnviar()) {
      this.error.set(MENSAJE_NO_ENVIADO);
      return;
    }
    // El envío anterior pudo llegar: primero se revisa "Mis pedidos"
    if (this.intentoIncierto() !== null) {
      this.revisarSiLlego();
      return;
    }

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
    this.nota.set(null);
    const intento = Date.now();
    this.pedidos.crear(nueva).subscribe({
      next: (orden) => {
        this.enviando.set(false);
        this.envio.listo();
        this.terminar();
        // Sin aviso flotante: la pantalla de confirmación ya lo dice (y el aviso tapaba su encabezado)
        void this.router.navigate(['/pedidos', orden.idOrden, 'confirmado']);
      },
      error: (e: ApiError) => {
        this.enviando.set(false);
        if (this.envio.falloDeRed(e)) {
          if (e.noEnviado) {
            this.error.set(MENSAJE_NO_ENVIADO);
            return;
          }
          // Sin respuesta y sin la marca "no salió": el pedido pudo llegar al servidor
          this.intentoIncierto.set(intento);
          this.error.set(`${e.message} No sabemos si tu pedido llegó: lo revisaremos al volver la conexión.`);
          this.revisarSiLlego();
          return;
        }
        this.error.set(e?.message ?? 'No se pudo enviar tu pedido. Intenta de nuevo.');
      },
    });
  }

  /** "Parece que tu pedido sí llegó": se va a verlo y se limpia el carrito (ese pedido ya existe). */
  protected verPedidoQueLlego(orden: Orden): void {
    this.terminar();
    void this.router.navigate(['/pedidos', orden.idOrden]);
  }

  /** Pedido hecho: se vacía el carrito y se borra el borrador del checkout. */
  private terminar(): void {
    this.carrito.vaciar();
    this.borradores.borrar(BORRADOR_CHECKOUT);
    this.ui.cerrarCheckout();
  }

  /** Tras un envío sin respuesta: busca en "Mis pedidos" uno de esta cafetería de hace pocos minutos. */
  private revisarSiLlego(): void {
    const intento = this.intentoIncierto();
    const idCafeteria = this.carrito.idCafeteria();
    if (intento === null || !idCafeteria || !this.envio.enLinea() || this.comprobando()) return;

    this.comprobando.set(true);
    this.pedidos.refrescar().subscribe({
      next: (ordenes) => {
        this.comprobando.set(false);
        const desde = intento - MINUTOS_PEDIDO_QUE_LLEGO * 60_000;
        const llego = ordenes.find((o) => o.idCafeteria === idCafeteria && Date.parse(o.creadoEn) >= desde);
        if (llego) {
          this.pedidoQueLlego.set(llego);
          this.error.set(null);
        } else {
          this.intentoIncierto.set(null);
          this.error.set('Tu pedido anterior no llegó. Revisa los datos y pulsa «Reintentar».');
        }
      },
      error: () => this.comprobando.set(false),
    });
  }
}
