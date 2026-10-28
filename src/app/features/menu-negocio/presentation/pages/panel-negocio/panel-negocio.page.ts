// CL-Sprint4 28/10/2026: HU-07B. Panel del encargado (AdminCafeteria) para administrar el menú de su cafetería.
// Layout de 3 columnas (sidebar del negocio · galería · estadísticas) que pasa a una sola columna en < 960px.
// La cafetería se carga con CafeteriaFacade (@features/cafeterias) y el menú con MenuNegocioFacade.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { ApiError } from '@core/http/api-error';
import { CafeteriaFacade } from '@features/cafeterias';
import { MenuNegocioFacade } from '@features/menu-negocio/application/menu-negocio.facade';
import {
  AvailabilityChange,
  GaleriaProductosComponent,
} from '@features/menu-negocio/presentation/components/galeria-productos/galeria-productos.component';
import { SidebarNegocioComponent } from '@features/menu-negocio/presentation/components/sidebar-negocio/sidebar-negocio.component';
import { StatsNegocioComponent } from '@features/menu-negocio/presentation/components/stats-negocio/stats-negocio.component';

/** Cuánto se queda visible un aviso antes de ocultarse. */
const NOTICE_MS = 5000;

interface Notice {
  kind: 'ok' | 'error';
  text: string;
}

@Component({
  selector: 'app-panel-negocio-page',
  imports: [SidebarNegocioComponent, GaleriaProductosComponent, StatsNegocioComponent],
  templateUrl: './panel-negocio.page.html',
  styleUrl: './panel-negocio.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelNegocioPage implements OnInit {
  /** Id de la cafetería, de la ruta `/negocio/:id` (withComponentInputBinding). */
  readonly id = input.required<string>();

  protected readonly menu = inject(MenuNegocioFacade);
  private readonly cafeterias = inject(CafeteriaFacade);
  private readonly destroyRef = inject(DestroyRef);

  /** La cafetería de esta ruta (CafeteriaFacade.selected es global: se ignora si es otra). */
  protected readonly cafeteria = computed(() => {
    const selected = this.cafeterias.selected();
    return selected && sameId(selected.id, this.id()) ? selected : null;
  });
  protected readonly cafeteriaError = signal<string | null>(null);
  /** `true` cuando ya respondió la primera carga del menú (para no mostrar "vacío" mientras carga). */
  protected readonly loaded = signal(false);
  protected readonly notice = signal<Notice | null>(null);

  private noticeTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.destroyRef.onDestroy(() => clearTimeout(this.noticeTimer));
  }

  ngOnInit(): void {
    this.reload();
  }

  protected reload(): void {
    const id = this.id();
    this.cafeteriaError.set(null);
    this.cafeterias.loadById(id).subscribe({
      error: (err: ApiError) => this.cafeteriaError.set(err.message),
    });
    this.menu.load(id).subscribe({
      next: () => this.loaded.set(true),
      error: () => this.loaded.set(true),
    });
  }

  /** Toggle sin recargar: la facade cambia la tarjeta al momento y la regresa si el backend falla. */
  protected onAvailabilityChange({ product, available }: AvailabilityChange): void {
    this.menu.setAvailable(product.id, available).subscribe({
      error: (err: ApiError) =>
        this.showNotice('error', `No se pudo cambiar «${product.name}»: ${err.message}`),
    });
  }

  protected showNotice(kind: Notice['kind'], text: string): void {
    clearTimeout(this.noticeTimer);
    this.notice.set({ kind, text });
    this.noticeTimer = setTimeout(() => this.notice.set(null), NOTICE_MS);
  }
}

// Los GUID pueden venir en mayúsculas en la URL y en minúsculas del backend
function sameId(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}
