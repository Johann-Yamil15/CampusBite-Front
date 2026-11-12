// CL-Sprint5 11/11/2026 (etapa 6): línea de tiempo del pedido con las 4 etapas del alumno
// (Recibido → En preparación → Listo para recoger → Entregado). Vertical en teléfono y horizontal desde
// tableta. El paso actual late suave (sin animación con prefers-reduced-motion) y cada cambio se anuncia
// al lector de pantalla con una región aria-live.
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  ETAPAS_ALUMNO,
  ETIQUETA_ETAPA,
  EstadoOrden,
  Orden,
  etapa,
  pasoAlumno,
} from '@features/ordenes';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { ICONO_ETAPA, detalleEtapa } from '@features/alumno/presentation/pedido-texto';

@Component({
  selector: 'app-linea-tiempo',
  imports: [IconComponent],
  template: `
    <ol class="lt" aria-label="Avance del pedido">
      @for (paso of pasos; track paso; let i = $index) {
        <li
          class="lt-paso"
          [class.hecho]="hecho(i)"
          [class.actual]="i === actual() && !completo()"
          [attr.aria-current]="i === actual() ? 'step' : null"
        >
          <span class="lt-punto" aria-hidden="true">
            <app-icon [nombre]="hecho(i) ? 'palomita' : iconos[paso]" [grosor]="hecho(i) ? 3 : 1.9" />
          </span>
          <span class="lt-texto">
            <strong>{{ etiquetas[paso] }}</strong>
            @if (i === actual()) {
              <small>{{ detalle() }}</small>
            }
          </span>
          <span class="sr-only">{{ hecho(i) ? '(hecho)' : i === actual() ? '(ahora)' : '(pendiente)' }}</span>
        </li>
      }
    </ol>
    <p class="sr-only" aria-live="polite">Tu pedido está: {{ anuncio() }}</p>
  `,
  styleUrl: './linea-tiempo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineaTiempoComponent {
  readonly orden = input.required<Pick<Orden, 'estado' | 'puntoEntrega'>>();

  protected readonly pasos = ETAPAS_ALUMNO;
  protected readonly etiquetas = ETIQUETA_ETAPA;
  protected readonly iconos = ICONO_ETAPA;

  private readonly estado = computed<EstadoOrden>(() => this.orden().estado);
  /** 0–3 (-1 si se canceló: el detalle no muestra la línea en ese caso). */
  protected readonly actual = computed(() => pasoAlumno(this.estado()));
  /** Entregado: todos los pasos quedan hechos. */
  protected readonly completo = computed(() => this.estado() === 'entregada');
  protected readonly detalle = computed(() => detalleEtapa(this.orden()));
  protected readonly anuncio = computed(() => ETIQUETA_ETAPA[etapa(this.estado())]);

  protected hecho(i: number): boolean {
    return i < this.actual() || this.completo();
  }
}
