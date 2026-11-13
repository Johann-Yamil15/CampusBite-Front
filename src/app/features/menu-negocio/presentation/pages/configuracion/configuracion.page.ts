// CL-Sprint5 11/11/2026 (etapa 9): Configuración del negocio. Datos que ve el alumno (nombre, ubicación,
// punto de entrega, si es del campus) y métodos de pago aceptados. Guarda con CafeteriaFacade.update, que ya
// existe en el back (PUT api/cafeterias/{id}, permitido al personal de la cafetería), con las mismas reglas
// de GuardarCafeteriaDto (CAFETERIA_LIMITS). No toca la lógica del panel de Inicio.
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiError } from '@core/http/api-error';
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

  protected readonly errores = computed(() => {
    const f = this.form();
    return f ? erroresNegocio(f) : {};
  });
  protected readonly cambio = computed(() => {
    const f = this.form();
    const c = this.cafeteria();
    return !!f && !!c && JSON.stringify(f) !== JSON.stringify(aDatos(c));
  });

  constructor() {
    if (!this.cafeteria()) this.cargar();
    // Cuando llega (o se guarda) la cafetería, el formulario parte de lo guardado
    effect(() => {
      const c = this.cafeteria();
      if (c) untracked(() => this.form.set(aDatos(c)));
    });
  }

  protected cargar(): void {
    if (!this.idCafeteria) {
      this.falloCarga.set('No encontramos tu negocio. Vuelve a entrar al panel.');
      return;
    }
    this.falloCarga.set(null);
    this.cafeterias.loadById(this.idCafeteria).subscribe({
      error: (e: ApiError) => this.falloCarga.set(e?.message ?? 'No pudimos cargar los datos de tu negocio.'),
    });
  }

  protected error(campo: Campo): string | null {
    return this.intento() ? (this.errores()[campo] ?? null) : null;
  }

  protected escribir(campo: 'name' | 'location' | 'pickupPoint', event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.form.update((f) => (f ? { ...f, [campo]: valor } : f));
  }

  protected alternarCampus(): void {
    this.form.update((f) => (f ? { ...f, onCampus: !f.onCampus } : f));
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
  }

  protected descartar(): void {
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
        this.intento.set(false);
        this.toast.ok('Guardamos los datos de tu negocio.');
      },
      error: (e: ApiError) => {
        this.guardando.set(false);
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
