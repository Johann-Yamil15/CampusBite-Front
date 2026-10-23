// FB-Sprint3 21/10/2026: página del Panel de Administración (HU-06A)
// JJ-Sprint3 21/10/2026: lista real de cafeterías (HU-06B) con alta, edición, baja lógica y reactivación
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Cafeteria, CafeteriaFacade } from '@features/cafeterias';
import { CafeteriaFormComponent } from '@features/admin/presentation/components/cafeteria-form/cafeteria-form.component';

/** Cuánto se queda visible el aviso de "se guardó" antes de ocultarse. */
const NOTICE_MS = 5000;

@Component({
  selector: 'app-admin-panel',
  imports: [CafeteriaFormComponent],
  templateUrl: './admin-panel.page.html',
  styleUrl: './admin-panel.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPanelPage implements OnInit {
  protected readonly cafeterias = inject(CafeteriaFacade);
  private readonly destroyRef = inject(DestroyRef);

  /** El panel abre el formulario de alta/edición encima de la lista. */
  protected readonly formOpen = signal(false);
  protected readonly editing = signal<Cafeteria | null>(null);
  protected readonly showInactive = signal(true);
  /** Cafetería esperando confirmación de baja. */
  protected readonly pendingDeactivate = signal<Cafeteria | null>(null);
  /** Aviso de éxito (se anuncia con role="status"). */
  protected readonly notice = signal<string | null>(null);
  /** `true` cuando ya respondió la primera carga (para no mostrar "sin cafeterías" mientras carga). */
  protected readonly loaded = signal(false);

  protected readonly visible = computed(() =>
    this.showInactive() ? this.cafeterias.list() : this.cafeterias.list().filter((c) => c.active),
  );
  protected readonly activeCount = computed(
    () => this.cafeterias.list().filter((c) => c.active).length,
  );

  private readonly confirmDialog = viewChild<ElementRef<HTMLDialogElement>>('confirmDialog');
  private noticeTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.destroyRef.onDestroy(() => clearTimeout(this.noticeTimer));
  }

  ngOnInit(): void {
    this.reload();
  }

  protected reload(): void {
    // El admin ve también las dadas de baja para poder reactivarlas
    this.cafeterias.load({ includeInactive: true }).subscribe({
      next: () => this.loaded.set(true),
      error: () => this.loaded.set(true),
    });
  }

  protected openCreate(): void {
    this.editing.set(null);
    this.formOpen.set(true);
  }

  protected openEdit(cafeteria: Cafeteria): void {
    this.editing.set(cafeteria);
    this.formOpen.set(true);
  }

  protected closeForm(): void {
    this.formOpen.set(false);
    this.editing.set(null);
  }

  protected onSaved(cafeteria: Cafeteria): void {
    const wasEdit = this.editing() !== null;
    this.closeForm();
    this.showNotice(
      wasEdit ? `Se guardaron los cambios de «${cafeteria.name}».` : `Se registró «${cafeteria.name}».`,
    );
  }

  protected askDeactivate(cafeteria: Cafeteria): void {
    this.cafeterias.clearError();
    this.pendingDeactivate.set(cafeteria);
    this.confirmDialog()?.nativeElement.showModal();
  }

  protected closeConfirm(): void {
    this.confirmDialog()?.nativeElement.close();
  }

  protected confirmDeactivate(): void {
    const cafeteria = this.pendingDeactivate();
    this.closeConfirm();
    if (!cafeteria) return;
    this.cafeterias.deactivate(cafeteria.id).subscribe({
      next: () => this.showNotice(`«${cafeteria.name}» quedó dada de baja.`),
      error: () => {
        // p. ej. 409 si tiene órdenes en curso: el mensaje queda en cafeterias.error()
      },
    });
  }

  protected reactivate(cafeteria: Cafeteria): void {
    this.cafeterias.reactivate(cafeteria.id).subscribe({
      next: () => this.showNotice(`«${cafeteria.name}» se reactivó.`),
      error: () => {
        // El mensaje queda en cafeterias.error()
      },
    });
  }

  protected toggleInactive(event: Event): void {
    this.showInactive.set((event.target as HTMLInputElement).checked);
  }

  private showNotice(message: string): void {
    clearTimeout(this.noticeTimer);
    this.notice.set(message);
    this.noticeTimer = setTimeout(() => this.notice.set(null), NOTICE_MS);
  }
}
