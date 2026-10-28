// CL-Sprint4 28/10/2026: HU-07B. Panel del encargado (AdminCafeteria) para administrar el menú de su cafetería.
// Layout de 3 columnas (sidebar del negocio · galería · estadísticas) que pasa a una sola columna en < 960px.
// La cafetería se carga con CafeteriaFacade (@features/cafeterias) y el menú con MenuNegocioFacade.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ApiError } from '@core/http/api-error';
import { CafeteriaFacade } from '@features/cafeterias';
import { MenuNegocioFacade } from '@features/menu-negocio/application/menu-negocio.facade';
import { MenuProduct, PRODUCT_IMAGE_RULES } from '@features/menu-negocio/domain/models/menu.model';
import { ConfirmarEliminarComponent } from '@features/menu-negocio/presentation/components/confirmar-eliminar/confirmar-eliminar.component';
import {
  AvailabilityChange,
  GaleriaProductosComponent,
} from '@features/menu-negocio/presentation/components/galeria-productos/galeria-productos.component';
import { ProductoFormComponent } from '@features/menu-negocio/presentation/components/producto-form/producto-form.component';
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
  imports: [
    SidebarNegocioComponent,
    GaleriaProductosComponent,
    StatsNegocioComponent,
    ProductoFormComponent,
    ConfirmarEliminarComponent,
  ],
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

  /** Diálogo de crear/editar: abierto y producto en edición (`null` = alta). */
  protected readonly formOpen = signal(false);
  protected readonly editing = signal<MenuProduct | null>(null);
  /** Producto esperando confirmación para eliminarse. */
  protected readonly toDelete = signal<MenuProduct | null>(null);

  protected readonly imageAccept = PRODUCT_IMAGE_RULES.accept;
  private readonly imageInput = viewChild<ElementRef<HTMLInputElement>>('imageInput');
  /** Producto al que se le cambiará la imagen cuando el usuario elija el archivo. */
  private imageTarget: MenuProduct | null = null;
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

  protected openCreate(): void {
    this.editing.set(null);
    this.formOpen.set(true);
  }

  protected openEdit(product: MenuProduct): void {
    this.editing.set(product);
    this.formOpen.set(true);
  }

  protected closeForm(): void {
    this.formOpen.set(false);
    this.editing.set(null);
  }

  protected onSaved(name: string): void {
    const wasEdit = this.editing() !== null;
    this.closeForm();
    this.showNotice(
      'ok',
      wasEdit ? `Se guardaron los cambios de «${name}».` : `Se agregó «${name}» a tu menú.`,
    );
  }

  protected onDeleted(name: string): void {
    this.toDelete.set(null);
    this.showNotice('ok', `Se eliminó «${name}» de tu menú.`);
  }

  /** "Cambiar imagen": abre el selector de archivos del sistema. */
  protected pickImage(product: MenuProduct): void {
    const input = this.imageInput()?.nativeElement;
    if (!input) return;
    this.imageTarget = product;
    input.value = '';
    input.click();
  }

  protected onImagePicked(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    const product = this.imageTarget;
    this.imageTarget = null;
    if (!file || !product) return;
    this.menu.uploadImage(product.id, file).subscribe({
      next: () => this.showNotice('ok', `Se actualizó la imagen de «${product.name}».`),
      // 503 → "El servicio de imágenes no está disponible por ahora…" (MenuNegocioFacade)
      error: (err: ApiError) => this.showNotice('error', err.message),
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
