// CL-Sprint5 11/11/2026 (etapa 9): Configuración del negocio. Datos que ve el alumno (nombre, ubicación,
// punto de entrega, si es del campus) y métodos de pago aceptados. Guarda con CafeteriaFacade.update, que ya
// existe en el back (PUT api/cafeterias/{id}, permitido al personal de la cafetería), con las mismas reglas
// de GuardarCafeteriaDto (CAFETERIA_LIMITS). No toca la lógica del panel de Inicio.
// CL-Sprint5 26/11/2026: los cambios sin guardar quedan en un borrador por usuario y negocio. Al recargar se
// recuperan; si los datos no cargan por falta de internet, el formulario se arma con el borrador. Se borra al
// guardar o con "Descartar cambios". Sin internet no se envía; al volver se recargan los datos.
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiError } from '@core/http/api-error';
import { BorradoresService, esObjeto } from '@core/services/borradores.service';
import { alReconectar } from '@core/utils/al-reconectar';
import { MENSAJE_NO_ENVIADO, envioSinRed } from '@core/utils/envio-sin-red';
import {
  CAFETERIA_LIMITS,
  Cafeteria,
  CafeteriaData,
  CafeteriaFacade,
  PAYMENT_METHODS,
  PaymentMethod,
} from '@features/cafeterias';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { NombreIcono } from '@shared/ui/icon/icons';
import { ToastService } from '@shared/ui/toast/toast.service';

type Campo = 'name' | 'location' | 'pickupPoint' | 'paymentMethods';

const INFO_METODO: Record<PaymentMethod, { etiqueta: string; icono: NombreIcono; detalle: string }> = {
  Efectivo: { etiqueta: 'Efectivo', icono: 'efectivo', detalle: 'El alumno paga al recoger.' },
  Tarjeta: { etiqueta: 'Tarjeta', icono: 'tarjeta', detalle: 'Se cobra en línea al confirmar.' },
  Transferencia: { etiqueta: 'Transferencia', icono: 'transferencia', detalle: 'Tú confirmas el pago en el tablero.' },
};

/** Las reglas de GuardarCafeteriaDto del back. */
export function erroresNegocio(d: CafeteriaData): Partial<Record<Campo, string>> {
  const e: Partial<Record<Campo, string>> = {};
  const nombre = d.name.trim();
  if (nombre.length < CAFETERIA_LIMITS.nameMin || nombre.length > CAFETERIA_LIMITS.nameMax) {
    e.name = `El nombre debe tener entre ${CAFETERIA_LIMITS.nameMin} y ${CAFETERIA_LIMITS.nameMax} caracteres.`;
  }
  if (!d.location.trim()) e.location = 'Escribe dónde está tu negocio.';
  else if (d.location.trim().length > CAFETERIA_LIMITS.locationMax) {
    e.location = `Hasta ${CAFETERIA_LIMITS.locationMax} caracteres.`;
  }
  if (!d.pickupPoint.trim()) e.pickupPoint = 'Escribe dónde recogen los alumnos.';
  else if (d.pickupPoint.trim().length > CAFETERIA_LIMITS.pickupPointMax) {
    e.pickupPoint = `Hasta ${CAFETERIA_LIMITS.pickupPointMax} caracteres.`;
  }
  if (!d.paymentMethods.length) e.paymentMethods = 'Acepta al menos un método de pago.';
  return e;
}

@Component({
  selector: 'app-configuracion-page',
  imports: [IconComponent],
  templateUrl: './configuracion.page.html',
  styleUrl: './configuracion.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguracionPage {
  private readonly cafeterias = inject(CafeteriaFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  protected readonly limites = CAFETERIA_LIMITS;
  protected readonly metodos = PAYMENT_METHODS;
  protected readonly info = INFO_METODO;

  private readonly idCafeteria: string =
    this.route.snapshot.pathFromRoot.map((r) => r.data['id'] as string | undefined).find(Boolean) ??
    '';

  protected readonly cafeteria = computed<Cafeteria | null>(() => {
    const c = this.cafeterias.selected();
    return c && c.id === this.idCafeteria ? c : null;
  });
  protected readonly falloCarga = signal<string | null>(null);

  protected readonly form = signal<CafeteriaData | null>(null);
  private readonly intento = signal(false);
  protected readonly guardando = signal(false);
  protected readonly errorGuardar = signal<string | null>(null);
  private readonly borradores = inject(BorradoresService);
  protected readonly envio = envioSinRed();
  private readonly nombreBorrador = `${BORRADOR_CONFIGURACION}.${this.idCafeteria}`;
  /** Borrador leído al entrar; se aplica cuando llegan los datos del negocio (o si no cargan). */
  private borradorPorAplicar = this.borradores.leer(this.nombreBorrador, esBorradorConfiguracion);
  protected readonly recuperado = signal(this.borradorPorAplicar !== null);

  protected readonly errores = computed(() => {
    const f = this.form();
    return f ? erroresNegocio(f) : {};
  });
  protected readonly cambio = computed(() => {
    const f = this.form();
    const c = this.cafeteria();
    // Sin datos del servidor (sin internet) un borrador recuperado cuenta como cambio
    return !!f && (c ? JSON.stringify(f) !== JSON.stringify(aDatos(c)) : this.recuperado());
  });

  constructor() {
    if (!this.cafeteria()) this.cargar();
    // Cuando llega (o se guarda) la cafetería, el formulario parte de lo guardado (o del borrador, una vez)
    effect(() => {
      const c = this.cafeteria();
      if (!c) return;
      untracked(() => {
        if (this.borradorPorAplicar) {
          if (!this.form()) this.form.set(this.borradorPorAplicar);
          this.borradorPorAplicar = null;
          return;
        }
        this.form.set(aDatos(c));
      });
    });
    // Al volver el internet, si no cargaron los datos se vuelven a pedir
    alReconectar(() => {
      if (!this.cafeteria()) this.cargar();
    });
  }

  protected cargar(): void {
    if (!this.idCafeteria) {
      this.falloCarga.set('No encontramos tu negocio. Vuelve a entrar al panel.');
      return;
    }
    this.falloCarga.set(null);
    this.cafeterias.loadById(this.idCafeteria).subscribe({
      error: (e: ApiError) => {
        // Sin datos pero con borrador: se puede seguir editando (se envía al volver el internet)
        if (this.borradorPorAplicar && !this.form()) {
          this.form.set(this.borradorPorAplicar);
          return;
        }
        if (!this.form()) this.falloCarga.set(e?.message ?? 'No pudimos cargar los datos de tu negocio.');
      },
    });
  }

  protected error(campo: Campo): string | null {
    return this.intento() ? (this.errores()[campo] ?? null) : null;
  }

  protected escribir(campo: 'name' | 'location' | 'pickupPoint', event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.form.update((f) => (f ? { ...f, [campo]: valor } : f));
    this.guardarBorrador();
  }

  protected alternarCampus(): void {
    this.form.update((f) => (f ? { ...f, onCampus: !f.onCampus } : f));
    this.guardarBorrador();
  }

  protected alternarMetodo(m: PaymentMethod): void {
    this.form.update((f) =>
      f
        ? {
            ...f,
            paymentMethods: f.paymentMethods.includes(m)
              ? f.paymentMethods.filter((x) => x !== m)
              : PAYMENT_METHODS.filter((x) => x === m || f.paymentMethods.includes(x)),
          }
        : f,
    );
    this.guardarBorrador();
  }

  /** Solo lo que escribe el encargado (no lo que llega del servidor) se guarda como borrador. */
  private guardarBorrador(): void {
    const f = this.form();
    if (f) this.borradores.guardar(this.nombreBorrador, f);
  }

  protected descartar(): void {
    this.borradores.borrar(this.nombreBorrador);
    this.recuperado.set(false);
    const c = this.cafeteria();
    if (c) this.form.set(aDatos(c));
    this.intento.set(false);
    this.errorGuardar.set(null);
  }

  protected guardar(event: Event): void {
    event.preventDefault();
    this.intento.set(true);
    const f = this.form();
    if (!f || Object.keys(this.errores()).length || this.guardando()) return;
    if (!this.envio.puedeEnviar()) {
      this.errorGuardar.set(MENSAJE_NO_ENVIADO);
      return;
    }

    const datos: CafeteriaData = {
      ...f,
      name: f.name.trim(),
      location: f.location.trim(),
      pickupPoint: f.pickupPoint.trim(),
    };
    this.guardando.set(true);
    this.errorGuardar.set(null);
    this.cafeterias.update(this.idCafeteria, datos).subscribe({
      next: () => {
        this.guardando.set(false);
        this.envio.listo();
        this.borradores.borrar(this.nombreBorrador);
        this.recuperado.set(false);
        this.intento.set(false);
        this.toast.ok('Guardamos los datos de tu negocio.');
      },
      error: (e: ApiError) => {
        this.guardando.set(false);
        this.envio.falloDeRed(e);
        this.errorGuardar.set(
          e?.status === 409
            ? 'Ya existe otro negocio con ese nombre. Prueba con uno distinto.'
            : (e?.message ?? 'No pudimos guardar. Intenta de nuevo.'),
        );
      },
    });
  }
}

function aDatos(c: Cafeteria): CafeteriaData {
  return {
    name: c.name,
    location: c.location,
    onCampus: c.onCampus,
    pickupPoint: c.pickupPoint,
    paymentMethods: [...c.paymentMethods],
  };
}

/** CL-Sprint5 26/11/2026: borrador de Configuración (cb.borrador.<sub>.configuracion.<idCafeteria>). */
export const BORRADOR_CONFIGURACION = 'configuracion';

export function esBorradorConfiguracion(d: unknown): d is CafeteriaData {
  const texto = (v: unknown) => typeof v === 'string' && v.length <= 300;
  return (
    esObjeto(d) &&
    texto(d['name']) &&
    texto(d['location']) &&
    texto(d['pickupPoint']) &&
    typeof d['onCampus'] === 'boolean' &&
    Array.isArray(d['paymentMethods']) &&
    d['paymentMethods'].every((m) => (PAYMENT_METHODS as readonly unknown[]).includes(m))
  );
}
