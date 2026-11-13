// CL-Sprint4 28/10/2026: HU-07B. Columna derecha del panel: conteos rápidos del menú (vienen de computed() en la facade)
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-stats-negocio',
  template: `
    <section class="stats" aria-labelledby="stats-title">
      <h2 id="stats-title">Resumen del menú</h2>
      <dl>
        <div class="stat">
          <dt>Total</dt>
          <dd>{{ total() }}</dd>
        </div>
        <div class="stat ok">
          <dt>Disponibles</dt>
          <dd>{{ available() }}</dd>
        </div>
        <div class="stat off">
          <dt>No disponibles</dt>
          <dd>{{ unavailable() }}</dd>
        </div>
      </dl>
      @if (total()) {
        <div
          class="bar"
          role="img"
          [attr.aria-label]="percent() + '% de tus productos están disponibles'"
        >
          <span [style.width.%]="percent()"></span>
        </div>
        <p class="hint">{{ percent() }}% disponible para los alumnos</p>
      }
    </section>
  `,
  styleUrl: './stats-negocio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsNegocioComponent {
  readonly total = input.required<number>();
  readonly available = input.required<number>();
  readonly unavailable = input.required<number>();

  protected readonly percent = computed(() =>
    this.total() ? Math.round((this.available() / this.total()) * 100) : 0,
  );
}
