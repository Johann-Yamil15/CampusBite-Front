// CL-Sprint5 11/11/2026 (etapa 6): "Reportar un problema" con un pedido. Hoja (modal) simple: motivo en
// opciones seleccionables, detalle opcional (obligatorio con "Otro") y, al enviar, la confirmación con el
// folio del reporte dentro de la misma hoja. Hoy responde el mock; el endpoint está propuesto para el back.
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { ApiError } from '@core/http/api-error';
import {
  ETIQUETA_MOTIVO_REPORTE,
  MAX_DETALLE_REPORTE,
  MIN_DETALLE_OTRO,
  MOTIVOS_REPORTE,
  MisPedidosFacade,
  MotivoReporte,
  Orden,
  reporteValido,
} from '@features/ordenes';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { ModalComponent } from '@shared/ui/modal/modal.component';

@Component({
  selector: 'app-reportar-problema',
  imports: [IconComponent, ModalComponent],
  template: `
    <app-modal title="Reportar un problema" [subtitle]="orden().folio + ' · ' + orden().cafeteria" size="sm" (closed)="cerrar()">
      @if (folio(); as f) {
        <div class="rp-ok" role="status">
          <span class="rp-check" aria-hidden="true"><app-icon nombre="palomita" [grosor]="2.5" /></span>
          <strong>Recibimos tu reporte {{ f }}</strong>
          <p>Lo revisamos con {{ orden().cafeteria }} y te escribimos a tu correo institucional en menos de 24 horas.</p>
        </div>
      } @else {
        <fieldset class="rp-motivos">
          <legend>¿Qué pasó?</legend>
          <div class="rp-opciones" role="radiogroup" aria-label="Motivo del reporte">
            @for (m of motivos; track m; let i = $index) {
              <button
                type="button"
                role="radio"
                class="cb-chip rp-motivo"
                [attr.aria-checked]="motivo() === m"
                [attr.data-modal-focus]="i === 0 ? '' : null"
                (click)="motivo.set(m)"
              >
                {{ etiquetas[m] }}
              </button>
            }
          </div>
        </fieldset>

        <label class="cb-field">
          <span>
            Cuéntanos más
            <small>{{ motivo() === 'otro' ? '(obligatorio)' : '(opcional)' }}</small>
          </span>
          <textarea
            rows="3"
            [attr.maxlength]="max"
            placeholder="Por ejemplo: faltó el latte, el sándwich venía frío…"
            [value]="detalle()"
            (input)="onDetalle($event)"
            [attr.aria-invalid]="faltaDetalle()"
            aria-describedby="rp-ayuda"
          ></textarea>
          <small id="rp-ayuda" [class.rp-falta]="faltaDetalle()">
            @if (faltaDetalle()) {
              Escribe al menos {{ minOtro }} caracteres. ·
            }
            {{ detalle().length }}/{{ max }}
          </small>
        </label>

        @if (error(); as e) {
          <p class="cb-alert-error rp-error" role="alert">{{ e }}</p>
        }

      }

      <div modalActions>
        @if (folio()) {
          <button type="button" class="cb-btn cb-btn--primary" data-modal-focus (click)="cerrar()">Listo</button>
        } @else {
          <button type="button" class="cb-btn cb-btn--secondary" (click)="cerrar()">Cancelar</button>
          <button
            type="button"
            class="cb-btn cb-btn--primary"
            [disabled]="!valido() || enviando()"
            [attr.aria-busy]="enviando()"
            (click)="enviar()"
          >
            {{ enviando() ? 'Enviando…' : 'Enviar reporte' }}
          </button>
        }
      </div>
    </app-modal>
  `,
  styles: `
    .rp-motivos {
      margin: 0 0 var(--cb-space-md);
      padding: 0;
      border: 0;
      legend {
        margin-bottom: 0.5rem;
        font-weight: 700;
        color: var(--cb-ink);
      }
    }
    .rp-opciones {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .rp-motivo[aria-checked='true'] {
      border-color: transparent;
      background: var(--cb-ink);
      color: var(--cb-bg);
    }
    .rp-falta {
      color: var(--cb-danger);
    }
    .rp-error {
      margin: var(--cb-space-sm) 0 0;
    }
    .rp-ok {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: var(--cb-space-md) 0;
      text-align: center;
      strong {
        font-size: var(--cb-text-lg);
        color: var(--cb-ink);
      }
      p {
        margin: 0;
        color: var(--cb-ink-soft);
      }
    }
    .rp-check {
      display: grid;
      place-items: center;
      width: 3.25rem;
      height: 3.25rem;
      border-radius: var(--cb-radius-pill);
      background: var(--cb-success);
      color: var(--cb-success-soft);
      --icon-size: 1.6rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportarProblemaComponent {
  readonly orden = input.required<Orden>();
  readonly cerrado = output<void>();

  private readonly pedidos = inject(MisPedidosFacade);

  protected readonly motivos = MOTIVOS_REPORTE;
  protected readonly etiquetas = ETIQUETA_MOTIVO_REPORTE;
  protected readonly max = MAX_DETALLE_REPORTE;
  protected readonly minOtro = MIN_DETALLE_OTRO;

  protected readonly motivo = signal<MotivoReporte | null>(null);
  protected readonly detalle = signal('');
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Folio del reporte ya recibido: la hoja muestra la confirmación. */
  protected readonly folio = signal<string | null>(null);

  protected readonly valido = computed(() => {
    const motivo = this.motivo();
    return !!motivo && reporteValido({ motivo, detalle: this.detalle() });
  });

  /** Solo se marca cuando eligió "Otro" y ya empezó a escribir algo corto. */
  protected readonly faltaDetalle = computed(
    () => this.motivo() === 'otro' && this.detalle().trim().length > 0 && !this.valido(),
  );

  protected onDetalle(event: Event): void {
    this.detalle.set((event.target as HTMLTextAreaElement).value.slice(0, MAX_DETALLE_REPORTE));
  }

  protected enviar(): void {
    const motivo = this.motivo();
    if (!motivo || !this.valido() || this.enviando()) return;
    this.enviando.set(true);
    this.error.set(null);
    this.pedidos.reportar(this.orden().idOrden, { motivo, detalle: this.detalle() }).subscribe({
      next: (r) => {
        this.enviando.set(false);
        this.folio.set(r.folio);
      },
      error: (e: ApiError) => {
        this.enviando.set(false);
        this.error.set(e?.message ?? 'No pudimos enviar tu reporte. Intenta de nuevo.');
      },
    });
  }

  protected cerrar(): void {
    if (!this.enviando()) this.cerrado.emit();
  }
}
