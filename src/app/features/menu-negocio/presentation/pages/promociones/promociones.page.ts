// JY-Sprint4 05/11/2026: HU futura (cascarón visual). Promociones del negocio: crear, editar, activar/pausar
// y eliminar. Todo pasa en memoria; no hay tabla ni endpoint de promociones todavía.
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ModalComponent } from '@shared/ui/modal/modal.component';
import { PaginadorComponent, pagina } from '@shared/ui/paginador/paginador.component';
import { ToastService } from '@shared/ui/toast/toast.service';

type TipoPromo = 'porcentaje' | 'precio_fijo' | 'combo';

interface Promo {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: TipoPromo;
  /** % cuando es porcentaje, pesos cuando es precio fijo o combo. */
  valor: number;
  desde: string;
  hasta: string;
  activa: boolean;
  usos: number;
}

export const ETIQUETA_TIPO: Record<TipoPromo, string> = {
  porcentaje: 'Descuento %',
  precio_fijo: 'Precio especial',
  combo: 'Combo',
};

const SEMILLA: Promo[] = [
  {
    id: 'p1',
    nombre: 'Combo Estudiantil',
    descripcion: 'Hamburguesa + bebida del día.',
    tipo: 'combo',
    valor: 99,
    desde: '2026-11-01',
    hasta: '2026-11-30',
    activa: true,
    usos: 34,
  },
  {
    id: 'p2',
    nombre: 'Martes de café',
    descripcion: '20% en cualquier bebida caliente, todo el día.',
    tipo: 'porcentaje',
    valor: 20,
    desde: '2026-11-03',
    hasta: '2026-12-29',
    activa: true,
    usos: 12,
  },
  {
    id: 'p3',
    nombre: 'Desayuno a $45',
    descripcion: 'Chilaquiles o molletes antes de las 10:00.',
    tipo: 'precio_fijo',
    valor: 45,
    desde: '2026-10-15',
    hasta: '2026-10-31',
    activa: false,
    usos: 58,
  },
];

const VACIA: Promo = {
  id: '',
  nombre: '',
  descripcion: '',
  tipo: 'porcentaje',
  valor: 10,
  desde: '',
  hasta: '',
  activa: true,
  usos: 0,
};

const POR_PAGINA = 6;

@Component({
  selector: 'app-promociones-page',
  imports: [CurrencyPipe, ModalComponent, PaginadorComponent],
  templateUrl: './promociones.page.html',
  styleUrl: './promociones.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromocionesPage {
  private readonly toast = inject(ToastService);

  protected readonly porPagina = POR_PAGINA;
  protected readonly etiquetaTipo = ETIQUETA_TIPO;
  protected readonly tipos: TipoPromo[] = ['porcentaje', 'precio_fijo', 'combo'];

  protected readonly promos = signal<Promo[]>(SEMILLA);

  protected readonly activas = computed(() => this.promos().filter((p) => p.activa).length);
  protected readonly usosTotales = computed(() =>
    this.promos().reduce((suma, p) => suma + p.usos, 0),
  );

  protected readonly paginaActual = signal(1);

  protected readonly visibles = computed(() =>
    pagina(this.promos(), this.paginaActual(), POR_PAGINA),
  );

  constructor() {
    // Al eliminar promociones la página actual puede quedar fuera de rango
    effect(() => {
      const paginas = Math.max(Math.ceil(this.promos().length / POR_PAGINA), 1);
      if (this.paginaActual() > paginas) this.paginaActual.set(paginas);
    });
  }

  /** La promo del formulario; `null` = modal cerrado. `id` vacío = es nueva. */
  protected readonly editando = signal<Promo | null>(null);
  protected readonly eliminando = signal<Promo | null>(null);

  protected nueva(): void {
    this.editando.set({ ...VACIA });
  }

  protected editar(promo: Promo): void {
    this.editando.set({ ...promo });
  }

  protected cerrar(): void {
    this.editando.set(null);
  }

  protected campo(clave: 'nombre' | 'descripcion' | 'desde' | 'hasta', event: Event): void {
    const valor = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.editando.update((p) => (p ? { ...p, [clave]: valor } : p));
  }

  protected tipo(event: Event): void {
    const tipo = (event.target as HTMLSelectElement).value as TipoPromo;
    this.editando.update((p) => (p ? { ...p, tipo } : p));
  }

  protected valor(event: Event): void {
    const valor = Number((event.target as HTMLInputElement).value);
    this.editando.update((p) => (p ? { ...p, valor: Number.isFinite(valor) ? valor : 0 } : p));
  }

  protected readonly valida = computed(() => {
    const p = this.editando();
    return !!p && p.nombre.trim().length >= 3 && p.valor > 0 && !!p.desde && !!p.hasta;
  });

  protected guardar(): void {
    const promo = this.editando();
    if (!promo || !this.valida()) return;

    if (promo.id) {
      this.promos.update((lista) => lista.map((p) => (p.id === promo.id ? promo : p)));
      this.toast.ok(`Se actualizó "${promo.nombre}".`);
    } else {
      // Id local del cascarón; con el back lo genera la BD
      const nueva = { ...promo, id: `p${Date.now()}` };
      this.promos.update((lista) => [nueva, ...lista]);
      this.toast.ok(`Se creó "${nueva.nombre}".`);
    }

    this.cerrar();
  }

  protected alternar(promo: Promo): void {
    this.promos.update((lista) =>
      lista.map((p) => (p.id === promo.id ? { ...p, activa: !p.activa } : p)),
    );
    this.toast.ok(`"${promo.nombre}" quedó ${promo.activa ? 'en pausa' : 'activa'}.`);
  }

  protected eliminar(): void {
    const promo = this.eliminando();
    if (!promo) return;

    this.promos.update((lista) => lista.filter((p) => p.id !== promo.id));
    this.toast.ok(`Se eliminó "${promo.nombre}".`);
    this.eliminando.set(null);
  }
}
