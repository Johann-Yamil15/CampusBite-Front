// JY-Sprint4 05/11/2026: HU futura (cascarón visual). Promociones del negocio: crear, editar, activar/pausar
// y eliminar.
// CL-Sprint5 11/11/2026 (etapa 9): se guardan con NegocioFacade (mock compartido con el alumno): las activas y
// vigentes salen en el carrusel del inicio y en la tienda de la cafetería. Validaciones por campo (dominio),
// estado de vigencia ("Visible para alumnos", "Programada", "Vencida", "En pausa"), carga, error y avisos.
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiError } from '@core/http/api-error';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { ModalComponent } from '@shared/ui/modal/modal.component';
import { PaginadorComponent, pagina } from '@shared/ui/paginador/paginador.component';
import { ToastService } from '@shared/ui/toast/toast.service';
import { NegocioFacade } from '@features/menu-negocio/application/negocio.facade';
import {
  ETIQUETA_TIPO,
  ETIQUETA_VIGENCIA,
  LIMITES_PROMOCION,
  PromocionNegocio,
  TIPOS_PROMOCION,
  TipoPromocion,
  validarPromocion,
  vigencia,
} from '@features/menu-negocio/domain/models/negocio.model';

const POR_PAGINA = 6;

/** YYYY-MM-DD local. */
function fecha(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function nuevaPromocion(): PromocionNegocio {
  const hoy = new Date();
  const fin = new Date(hoy);
  fin.setDate(fin.getDate() + 14);
  return {
    id: '', nombre: '', descripcion: '', tipo: 'porcentaje', valor: 10,
    desde: fecha(hoy), hasta: fecha(fin), activa: true, usos: 0,
  };
}

@Component({
  selector: 'app-promociones-page',
  imports: [CurrencyPipe, DatePipe, IconComponent, ModalComponent, PaginadorComponent],
  templateUrl: './promociones.page.html',
  styleUrl: './promociones.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromocionesPage {
  private readonly negocio = inject(NegocioFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  protected readonly porPagina = POR_PAGINA;
  protected readonly etiquetaTipo = ETIQUETA_TIPO;
  protected readonly etiquetaVigencia = ETIQUETA_VIGENCIA;
  protected readonly tipos = TIPOS_PROMOCION;
  protected readonly limites = LIMITES_PROMOCION;
  protected readonly hoy = fecha(new Date());
  protected readonly vigencia = vigencia;

  private readonly idCafeteria: string =
    this.route.snapshot.pathFromRoot.map((r) => r.data['id'] as string | undefined).find(Boolean) ??
    '';

  protected readonly promos = this.negocio.promociones;
  protected readonly cargando = this.negocio.cargando;
  protected readonly error = this.negocio.error;
  protected readonly cargado = signal(false);

  protected readonly visiblesParaAlumnos = computed(
    () => this.promos().filter((p) => vigencia(p, this.hoy) === 'vigente').length,
  );
  protected readonly usosTotales = computed(() => this.promos().reduce((suma, p) => suma + p.usos, 0));

  protected readonly paginaActual = signal(1);
  protected readonly visibles = computed(() => pagina(this.promos(), this.paginaActual(), POR_PAGINA));

  /** La promo del formulario; `null` = cerrado. `id` vacío = nueva. */
  protected readonly editando = signal<PromocionNegocio | null>(null);
  protected readonly eliminando = signal<PromocionNegocio | null>(null);
  protected readonly guardando = signal(false);
  private readonly intento = signal(false);
  protected readonly errorGuardar = signal<string | null>(null);
  protected readonly errores = computed(() => {
    const p = this.editando();
    return p ? validarPromocion(p) : {};
  });

  constructor() {
    this.cargar();
    effect(() => {
      const paginas = Math.max(Math.ceil(this.promos().length / POR_PAGINA), 1);
      if (untracked(this.paginaActual) > paginas) this.paginaActual.set(paginas);
    });
  }

  protected cargar(): void {
    this.negocio.cargarPromociones(this.idCafeteria).subscribe({
      next: () => this.cargado.set(true),
      error: () => undefined,
    });
  }

  protected errorDe(campo: keyof ReturnType<typeof validarPromocion>): string | null {
    return this.intento() ? (this.errores()[campo] ?? null) : null;
  }

  protected nueva(): void {
    this.abrir(nuevaPromocion());
  }

  protected editar(promo: PromocionNegocio): void {
    this.abrir({ ...promo });
  }

  private abrir(promo: PromocionNegocio): void {
    this.intento.set(false);
    this.errorGuardar.set(null);
    this.editando.set(promo);
  }

  protected cerrar(): void {
    if (!this.guardando()) this.editando.set(null);
  }

  protected campo(clave: 'nombre' | 'descripcion' | 'desde' | 'hasta', event: Event): void {
    const valor = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.editando.update((p) => (p ? { ...p, [clave]: valor } : p));
  }

  protected tipo(event: Event): void {
    const tipo = (event.target as HTMLSelectElement).value as TipoPromocion;
    this.editando.update((p) => (p ? { ...p, tipo } : p));
  }

  protected valor(event: Event): void {
    const valor = Number((event.target as HTMLInputElement).value);
    this.editando.update((p) => (p ? { ...p, valor: Number.isFinite(valor) ? valor : 0 } : p));
  }

  protected guardar(event?: Event): void {
    event?.preventDefault();
    this.intento.set(true);
    const promo = this.editando();
    if (!promo || Object.keys(this.errores()).length || this.guardando()) return;
    this.guardando.set(true);
    this.errorGuardar.set(null);
    this.negocio.guardarPromocion(this.idCafeteria, promo).subscribe({
      next: (p) => {
        this.guardando.set(false);
        this.editando.set(null);
        const visible = vigencia(p, this.hoy) === 'vigente';
        this.toast.ok(
          `${promo.id ? 'Se actualizó' : 'Se creó'} "${p.nombre}".${visible ? ' Los alumnos ya la ven.' : ''}`,
        );
      },
      error: (e: ApiError) => {
        this.guardando.set(false);
        this.errorGuardar.set(e?.message ?? 'No pudimos guardar la promoción.');
      },
    });
  }

  protected alternar(promo: PromocionNegocio): void {
    if (this.guardando()) return;
    this.guardando.set(true);
    this.negocio.guardarPromocion(this.idCafeteria, { ...promo, activa: !promo.activa }).subscribe({
      next: (p) => {
        this.guardando.set(false);
        this.toast.ok(`"${p.nombre}" quedó ${p.activa ? 'activa' : 'en pausa'}.`);
      },
      error: (e: ApiError) => {
        this.guardando.set(false);
        this.toast.error(e?.message ?? 'No pudimos cambiar la promoción.');
      },
    });
  }

  protected eliminar(): void {
    const promo = this.eliminando();
    if (!promo || this.guardando()) return;
    this.guardando.set(true);
    this.negocio.eliminarPromocion(this.idCafeteria, promo.id).subscribe({
      next: () => {
        this.guardando.set(false);
        this.eliminando.set(null);
        this.toast.ok(`Se eliminó "${promo.nombre}".`);
      },
      error: (e: ApiError) => {
        this.guardando.set(false);
        this.toast.error(e?.message ?? 'No pudimos eliminar la promoción.');
      },
    });
  }
}
