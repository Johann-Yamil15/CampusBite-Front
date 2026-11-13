// CL-Sprint5 11/11/2026 (etapa 8): "Cambiar contraseña" del Perfil. Actual, nueva (8 a 72 caracteres, como el
// registro, y distinta de la actual) y confirmación. Si la actual no es correcta el error sale en ese campo.
// "Mostrar contraseñas" ayuda en el teléfono. Mock por ahora (la actual de las cuentas de prueba).
import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { ApiError } from '@core/http/api-error';
import { ModalComponent } from '@shared/ui/modal/modal.component';
import { ToastService } from '@shared/ui/toast/toast.service';
import { PerfilFacade } from '@features/alumno/application/perfil.facade';
import {
  CambioPassword,
  LIMITES_PERFIL,
  sinErrores,
  validarCambioPassword,
} from '@features/alumno/domain/models/perfil.model';

type Campo = keyof CambioPassword;

@Component({
  selector: 'app-cambiar-password',
  imports: [ModalComponent],
  template: `
    <app-modal title="Cambiar contraseña" size="sm" (closed)="cerrar()">
      <form id="form-password" class="cp" novalidate (submit)="guardar($event)">
        <label class="cb-field">
          <span>Contraseña actual</span>
          <input
            [type]="mostrar() ? 'text' : 'password'"
            name="actual"
            autocomplete="current-password"
            data-modal-focus
            [value]="form().actual"
            (input)="escribir('actual', $event)"
            (blur)="tocar('actual')"
            [attr.aria-invalid]="!!error('actual')"
            aria-describedby="cp-actual"
          />
          @if (error('actual'); as e) {
            <small id="cp-actual" class="cp-error">{{ e }}</small>
          }
        </label>

        <label class="cb-field">
          <span>Nueva contraseña</span>
          <input
            [type]="mostrar() ? 'text' : 'password'"
            name="nueva"
            autocomplete="new-password"
            [attr.maxlength]="limites.passwordMax"
            [value]="form().nueva"
            (input)="escribir('nueva', $event)"
            (blur)="tocar('nueva')"
            [attr.aria-invalid]="!!error('nueva')"
            aria-describedby="cp-nueva"
          />
          <small id="cp-nueva" [class.cp-error]="error('nueva')" [class.cp-ok]="!error('nueva') && largoOk()">
            {{ error('nueva') ?? (largoOk() ? 'Largo correcto.' : 'Al menos ' + limites.passwordMin + ' caracteres.') }}
          </small>
        </label>

        <label class="cb-field">
          <span>Confirma la nueva contraseña</span>
          <input
            [type]="mostrar() ? 'text' : 'password'"
            name="confirmacion"
            autocomplete="new-password"
            [attr.maxlength]="limites.passwordMax"
            [value]="form().confirmacion"
            (input)="escribir('confirmacion', $event)"
            (blur)="tocar('confirmacion')"
            [attr.aria-invalid]="!!error('confirmacion')"
            aria-describedby="cp-confirmacion"
          />
          @if (error('confirmacion'); as e) {
            <small id="cp-confirmacion" class="cp-error">{{ e }}</small>
          }
        </label>

        <label class="cp-mostrar">
          <input type="checkbox" [checked]="mostrar()" (change)="mostrar.set(!mostrar())" />
          Mostrar contraseñas
        </label>

        @if (errorGuardar(); as e) {
          <p class="cb-alert-error" role="alert">{{ e }}</p>
        }
      </form>

      <div modalActions>
        <button type="button" class="cb-btn cb-btn--secondary" (click)="cerrar()">Cancelar</button>
        <button type="submit" form="form-password" class="cb-btn cb-btn--primary" [disabled]="guardando()" [attr.aria-busy]="guardando()">
          {{ guardando() ? 'Cambiando…' : 'Cambiar contraseña' }}
        </button>
      </div>
    </app-modal>
  `,
  styles: `
    .cp {
      display: flex;
      flex-direction: column;
      gap: var(--cb-space-md);
    }
    .cp-error {
      color: var(--cb-danger);
      font-weight: 600;
    }
    .cp-ok {
      color: var(--cb-success);
      font-weight: 600;
    }
    .cp-mostrar {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      min-height: 44px;
      font-size: var(--cb-text-sm);
      color: var(--cb-ink-soft);
      cursor: pointer;
      input {
        width: 1.1rem;
        height: 1.1rem;
        accent-color: var(--cb-action);
      }
    }
    .cb-alert-error {
      margin: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CambiarPasswordComponent {
  readonly cerrado = output<void>();

  private readonly perfil = inject(PerfilFacade);
  private readonly toast = inject(ToastService);

  protected readonly limites = LIMITES_PERFIL;
  protected readonly form = signal<CambioPassword>({ actual: '', nueva: '', confirmacion: '' });
  protected readonly mostrar = signal(false);
  private readonly tocados = signal<ReadonlySet<Campo>>(new Set());
  private readonly intentoGuardar = signal(false);
  /** Error del servidor sobre la contraseña actual (se borra al volver a escribirla). */
  private readonly actualIncorrecta = signal<string | null>(null);
  protected readonly guardando = signal(false);
  protected readonly errorGuardar = signal<string | null>(null);

  private readonly errores = computed(() => validarCambioPassword(this.form()));
  protected readonly largoOk = computed(() => this.form().nueva.length >= LIMITES_PERFIL.passwordMin);

  protected error(campo: Campo): string | null {
    if (campo === 'actual' && this.actualIncorrecta()) return this.actualIncorrecta();
    const visible = this.intentoGuardar() || this.tocados().has(campo);
    return visible ? (this.errores()[campo] ?? null) : null;
  }

  protected escribir(campo: Campo, event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    if (campo === 'actual') this.actualIncorrecta.set(null);
    this.form.update((f) => ({ ...f, [campo]: valor }));
  }

  protected tocar(campo: Campo): void {
    this.tocados.update((t) => new Set([...t, campo]));
  }

  protected guardar(event: Event): void {
    event.preventDefault();
    this.intentoGuardar.set(true);
    if (!sinErrores(this.errores()) || this.guardando()) return;

    const { actual, nueva } = this.form();
    this.guardando.set(true);
    this.errorGuardar.set(null);
    this.perfil.cambiarPassword(actual, nueva).subscribe({
      next: () => {
        this.guardando.set(false);
        this.toast.ok('Cambiaste tu contraseña. Úsala la próxima vez que entres.');
        this.cerrado.emit();
      },
      error: (e: ApiError) => {
        this.guardando.set(false);
        if (e?.status === 400) this.actualIncorrecta.set(e.message);
        else this.errorGuardar.set(e?.message ?? 'No pudimos cambiar tu contraseña. Intenta de nuevo.');
      },
    });
  }

  protected cerrar(): void {
    if (!this.guardando()) this.cerrado.emit();
  }
}
