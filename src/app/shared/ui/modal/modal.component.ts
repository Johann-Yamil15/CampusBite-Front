// JY-Sprint4 05/11/2026: cascarón de modal reutilizable (alumno y negocio). Se encarga del fondo, el
// foco inicial, Escape y la accesibilidad; el contenido y los botones los pone quien lo usa con slots.
import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, inject, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closed.emit()' },
})
export class ModalComponent {
  readonly title = input.required<string>();
  /** Texto chico bajo el título. */
  readonly subtitle = input<string | null>(null);
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly closed = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    // El lector de pantalla y el teclado entran al diálogo, no se quedan detrás del fondo
    afterNextRender(() => {
      this.host.nativeElement.querySelector<HTMLElement>('[data-modal-focus], .modal-panel')?.focus();
    });
  }
}
