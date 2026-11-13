// CL-Sprint4 28/10/2026: HU-07B. Confirmación para eliminar un producto. La eliminación es física; si el producto
// tiene órdenes activas el backend responde 409 y el diálogo se queda abierto mostrando su mensaje.
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ApiError } from '@core/http/api-error';
import { MenuNegocioFacade } from '@features/menu-negocio/application/menu-negocio.facade';
import { MenuProduct } from '@features/menu-negocio/domain/models/menu.model';

@Component({
  selector: 'app-confirmar-eliminar',
  template: `
    <dialog
      #dialog
      class="confirm"
      aria-labelledby="delete-title"
      aria-describedby="delete-desc"
      (close)="onDialogClose()"
    >
      <h2 id="delete-title">¿Eliminar «{{ product().name }}»?</h2>
      <p id="delete-desc">
        Se borrará del menú de forma permanente. Si solo quieres dejar de venderlo por un tiempo,
        márcalo como no disponible.
      </p>
      @if (error(); as message) {
        <div class="cb-alert-error" role="alert">
          <span>{{ message }}</span>
        </div>
      }
      <div class="confirm-actions">
        <button type="button" class="cb-btn cb-btn--secondary" (click)="cancel()" autofocus>
          {{ error() ? 'Cerrar' : 'Cancelar' }}
        </button>
        <button
          type="button"
          class="cb-btn cb-btn--danger"
          (click)="confirm()"
          [disabled]="deleting()"
        >
          {{ deleting() ? 'Eliminando…' : 'Eliminar' }}
        </button>
      </div>
    </dialog>
  `,
  styleUrl: './confirmar-eliminar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmarEliminarComponent {
  private readonly menu = inject(MenuNegocioFacade);

  readonly product = input.required<MenuProduct>();
  /** Se emite con el nombre del producto eliminado. */
  readonly deleted = output<string>();
  readonly closed = output<void>();

  protected readonly deleting = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private wasDeleted = false;

  constructor() {
    afterNextRender(() => this.dialog().nativeElement.showModal());
  }

  protected confirm(): void {
    const product = this.product();
    this.deleting.set(true);
    this.error.set(null);
    this.menu.remove(product.id).subscribe({
      next: () => {
        this.wasDeleted = true;
        this.deleted.emit(product.name);
        this.dialog().nativeElement.close();
      },
      error: (err: ApiError) => {
        // p. ej. 409: "El producto tiene N orden(es) activa(s); desactívalo en su lugar"
        this.deleting.set(false);
        this.error.set(err.message);
      },
    });
  }

  protected cancel(): void {
    this.dialog().nativeElement.close();
  }

  protected onDialogClose(): void {
    if (!this.wasDeleted) this.closed.emit();
  }
}
