// CL-Sprint5 11/11/2026: selector de cantidad (− 2 +) para el carrito y las tarjetas de platillo.
// <app-cantidad [(valor)]="cantidad" [max]="20" etiqueta="Latte Helado" [quitable]="true" />
// Con `quitable`, en la cantidad mínima el botón "−" se vuelve "quitar" (bote de basura) y emite `quitar`
// en vez de bajar. El número rebota al cambiar y se anuncia al lector de pantalla.
import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { IconComponent } from '@shared/ui/icon/icon.component';

@Component({
  selector: 'app-cantidad',
  imports: [IconComponent],
  template: `
    <div class="cantidad" [class.compacta]="compacta()" role="group" [attr.aria-label]="'Cantidad de ' + etiqueta()">
      <button
        type="button"
        class="paso"
        [disabled]="!puedeBajar()"
        [attr.aria-label]="enMinimo() && quitable() ? 'Quitar ' + etiqueta() : 'Quitar uno de ' + etiqueta()"
        (click)="bajar()"
      >
        <app-icon [nombre]="enMinimo() && quitable() ? 'basura' : 'menos'" [grosor]="2" />
      </button>

      <!-- @for con track del valor: al cambiar se vuelve a crear el span y su animación se repite -->
      @for (v of [valor()]; track v) {
        <span class="valor cb-rebote" aria-live="polite">{{ v }}</span>
      }

      <button
        type="button"
        class="paso"
        [disabled]="valor() >= max()"
        [attr.aria-label]="'Agregar uno de ' + etiqueta()"
        (click)="subir()"
      >
        <app-icon nombre="mas" [grosor]="2" />
      </button>
    </div>
  `,
  styles: `
    .cantidad {
      display: inline-flex;
      align-items: center;
      gap: 0.15rem;
      padding: 0.2rem;
      border: 1px solid var(--cb-line-soft);
      border-radius: var(--cb-radius-pill);
      background: var(--cb-surface);
    }
    .paso {
      display: grid;
      place-items: center;
      width: 2.5rem;
      height: 2.5rem;
      border: 0;
      border-radius: var(--cb-radius-pill);
      background: var(--cb-surface-low);
      color: var(--cb-ink);
      cursor: pointer;
      --icon-size: 1rem;
      transition:
        background var(--cb-dur-state),
        transform var(--cb-dur-press) var(--cb-ease-out);
    }
    .paso:hover:not(:disabled) {
      background: var(--cb-surface-high);
    }
    .paso:active:not(:disabled) {
      transform: scale(0.92);
    }
    .paso:focus-visible {
      outline: none;
      box-shadow: var(--cb-focus-ring);
    }
    .paso:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .valor {
      min-width: 1.75rem;
      text-align: center;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
      color: var(--cb-ink);
    }
    /* Botones de 40px por defecto; la versión compacta (32px) es solo para tarjetas densas en escritorio */
    .compacta .paso {
      width: 2rem;
      height: 2rem;
    }
    @media (prefers-reduced-motion: reduce) {
      .paso {
        transition: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CantidadComponent {
  readonly valor = model(1);
  readonly min = input(1);
  readonly max = input(20);
  /** Nombre del producto, para que los botones digan "Agregar uno de Latte". */
  readonly etiqueta = input.required<string>();
  /** En el mínimo, "−" quita el producto (emite `quitar`). */
  readonly quitable = input(false);
  readonly compacta = input(false);
  readonly quitar = output<void>();

  protected readonly enMinimo = computed(() => this.valor() <= this.min());
  protected readonly puedeBajar = computed(() => !this.enMinimo() || this.quitable());

  protected bajar(): void {
    if (this.enMinimo()) {
      if (this.quitable()) this.quitar.emit();
      return;
    }
    this.valor.update((v) => v - 1);
  }

  protected subir(): void {
    this.valor.update((v) => Math.min(v + 1, this.max()));
  }
}
