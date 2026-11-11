// CL-Sprint5 11/11/2026 (etapa 5): código de recogida, estilo DiDi Food. Los 6 dígitos que el alumno
// muestra en el mostrador y que la cafetería valida al entregar (orden.codigo_recogida, sp_entregar_orden).
// Grande, en dos grupos de 3 (381 904) para dictarlo fácil, con botón de copiar. El lector de pantalla lo
// lee dígito por dígito.
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { ToastService } from '@shared/ui/toast/toast.service';

@Component({
  selector: 'app-codigo-recogida',
  imports: [IconComponent],
  template: `
    <div class="cr" [class.compacto]="compacto()">
      <p class="cr-titulo">Código de recogida</p>
      <p class="cr-codigo" [attr.aria-label]="'Código ' + deletreado()">
        @for (grupo of grupos(); track $index) {
          <span class="cr-grupo" aria-hidden="true">
            @for (d of grupo; track $index) {
              <span class="cr-digito">{{ d }}</span>
            }
          </span>
        }
      </p>
      <p class="cr-ayuda">Muéstralo en el mostrador cuando recojas.</p>
      <button type="button" class="cb-btn cb-btn--secondary cr-copiar" (click)="copiar()">
        <app-icon nombre="copiar" />Copiar código
      </button>
    </div>
  `,
  styles: `
    .cr {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: var(--cb-space-lg);
      border: 2px dashed var(--cb-primary-container);
      border-radius: var(--cb-radius-xl);
      background: var(--cb-brand-soft);
      text-align: center;
    }
    .cr-titulo {
      margin: 0;
      font-size: var(--cb-text-xs);
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--cb-primary);
    }
    .cr-codigo {
      display: flex;
      gap: 0.9rem;
      margin: 0.25rem 0;
    }
    .cr-grupo {
      display: flex;
      gap: 0.3rem;
    }
    .cr-digito {
      display: grid;
      place-items: center;
      width: 2.6rem;
      height: 3.25rem;
      border-radius: var(--cb-radius);
      background: var(--cb-surface);
      color: var(--cb-ink);
      font-size: 2rem;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
      box-shadow: var(--cb-shadow-sm);
    }
    .cr-ayuda {
      margin: 0;
      font-size: var(--cb-text-sm);
      color: var(--cb-ink-soft);
    }
    .cr-copiar {
      margin-top: 0.25rem;
      --icon-size: 1.1rem;
    }
    .compacto .cr-digito {
      width: 2rem;
      height: 2.5rem;
      font-size: 1.5rem;
    }
    @media (max-width: 359px) {
      .cr-digito {
        width: 2.1rem;
        height: 2.75rem;
        font-size: 1.6rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodigoRecogidaComponent {
  readonly codigo = input.required<string>();
  readonly compacto = input(false);

  private readonly toast = inject(ToastService);

  /** "381904" → [["3","8","1"], ["9","0","4"]]. */
  protected readonly grupos = computed(() => {
    const d = this.codigo().split('');
    return [d.slice(0, 3), d.slice(3)].filter((g) => g.length);
  });

  protected readonly deletreado = computed(() => this.codigo().split('').join(' '));

  protected async copiar(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.codigo());
      this.toast.ok('Copiamos tu código de recogida.');
    } catch {
      this.toast.info(`Tu código es ${this.deletreado()}.`);
    }
  }
}
