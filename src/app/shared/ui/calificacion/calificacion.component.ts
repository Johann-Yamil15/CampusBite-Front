// CL-Sprint5 11/11/2026: calificación compacta (★ 4.8 · 120) para tarjetas de platillo y cafetería.
// La estrella es mango (decorativa); el número lleva el contraste del texto y el lector de pantalla oye
// "Calificación 4.8 de 5, 120 reseñas".
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { IconComponent } from '@shared/ui/icon/icon.component';

@Component({
  selector: 'app-calificacion',
  imports: [DecimalPipe, IconComponent],
  template: `
    <span class="cal" [attr.aria-label]="etiquetaAccesible()" role="img">
      <app-icon nombre="estrella" />
      <strong aria-hidden="true">{{ valor() | number: '1.1-1' }}</strong>
      @if (resenas(); as n) {
        <span class="n" aria-hidden="true">({{ n }})</span>
      }
    </span>
  `,
  styles: `
    .cal {
      display: inline-flex;
      align-items: center;
      gap: 0.2rem;
      font-size: var(--cb-text-sm);
      color: var(--cb-ink);
      --icon-size: 0.95rem;
    }
    app-icon {
      color: var(--cb-promo);
    }
    strong {
      font-weight: 800;
      font-variant-numeric: tabular-nums;
    }
    .n {
      color: var(--cb-text-muted);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalificacionComponent {
  readonly valor = input.required<number>();
  readonly resenas = input<number | null>(null);

  protected readonly etiquetaAccesible = computed(() => {
    const base = `Calificación ${this.valor().toFixed(1)} de 5`;
    const n = this.resenas();
    return n ? `${base}, ${n} reseñas` : base;
  });
}
