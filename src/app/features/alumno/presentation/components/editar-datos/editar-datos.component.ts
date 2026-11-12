// CL-Sprint5 11/11/2026 (etapa 8): "Editar datos" del Perfil. Nombre (obligatorio), matrícula y teléfono
// (opcionales), con las reglas del registro. Los errores se muestran al salir del campo o al intentar guardar,
// no mientras se escribe por primera vez. Guarda con PerfilFacade (mock por ahora).
import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { ApiError } from '@core/http/api-error';
import { ModalComponent } from '@shared/ui/modal/modal.component';
import { ToastService } from '@shared/ui/toast/toast.service';
import { PerfilFacade } from '@features/alumno/application/perfil.facade';
import {
  DatosPersonales,
  LIMITES_PERFIL,
  normalizarDatos,
  sinErrores,
  validarDatos,
} from '@features/alumno/domain/models/perfil.model';

type Campo = keyof DatosPersonales;

@Component({
  selector: 'app-editar-datos',
  imports: [ModalComponent],
  template: `
    <app-modal title="Editar mis datos" subtitle="Así te verá la cafetería al entregar tu pedido." size="sm" (closed)="cerrar()">
      <form id="form-datos" class="ed" novalidate (submit)="guardar($event)">
        <label class="cb-field">
          <span>Nombre completo</span>
          <input
            type="text"
            name="nombre"
            autocomplete="name"
            [attr.maxlength]="limites.nombreMax"
            data-modal-focus
            [value]="form().nombre"
            (input)="escribir('nombre', $event)"
            (blur)="tocar('nombre')"
            [attr.aria-invalid]="!!error('nombre')"
            aria-describedby="ed-nombre"
          />
          <small id="ed-nombre" [class.ed-error]="error('nombre')">{{ error('nombre') ?? 'Como quieres que te llamemos.' }}</small>
        </label>

        <label class="cb-field">
          <span>Matrícula <small>(opcional)</small></span>
          <input
            type="text"
            name="matricula"
            inputmode="numeric"
            [attr.maxlength]="limites.matriculaMax"
            [value]="form().matricula"
            (input)="escribir('matricula', $event)"
            (blur)="tocar('matricula')"
            [attr.aria-invalid]="!!error('matricula')"
            aria-describedby="ed-matricula"
          />
          <small id="ed-matricula" [class.ed-error]="error('matricula')">{{ error('matricula') ?? 'La de tu credencial de la UTTT.' }}</small>
        </label>

        <label class="cb-field">
          <span>Teléfono <small>(opcional)</small></span>
          <input
            type="tel"
            name="telefono"
            autocomplete="tel"
            inputmode="tel"
            maxlength="20"
            placeholder="442 123 4567"
            [value]="form().telefono"
            (input)="escribir('telefono', $event)"
            (blur)="tocar('telefono')"
            [attr.aria-invalid]="!!error('telefono')"
            aria-describedby="ed-telefono"
          />
          <small id="ed-telefono" [class.ed-error]="error('telefono')">{{ error('telefono') ?? 'Solo para avisarte si hay un problema con tu pedido.' }}</small>
        </label>

        @if (errorGuardar(); as e) {
          <p class="cb-alert-error" role="alert">{{ e }}</p>
        }
      </form>

      <div modalActions>
        <button type="button" class="cb-btn cb-btn--secondary" (click)="cerrar()">Cancelar</button>
        <button type="submit" form="form-datos" class="cb-btn cb-btn--primary" [disabled]="guardando()" [attr.aria-busy]="guardando()">
          {{ guardando() ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </div>
    </app-modal>
  `,
  styles: `
    .ed {
      display: flex;
      flex-direction: column;
      gap: var(--cb-space-md);
    }
    .ed-error {
      color: var(--cb-danger);
      font-weight: 600;
    }
    .cb-alert-error {
      margin: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditarDatosComponent {
  readonly cerrado = output<void>();

  private readonly perfil = inject(PerfilFacade);
  private readonly toast = inject(ToastService);

  protected readonly limites = LIMITES_PERFIL;

  // Arranca con lo guardado; si aún no escribió su nombre, se le sugiere el del correo
  protected readonly form = signal({
    nombre: this.perfil.perfil()?.datos.nombre ?? this.perfil.nombre(),
    matricula: this.perfil.perfil()?.datos.matricula ?? '',
    telefono: this.perfil.perfil()?.datos.telefono ?? '',
  });
  private readonly tocados = signal<ReadonlySet<Campo>>(new Set());
  private readonly intentoGuardar = signal(false);
  protected readonly guardando = signal(false);
  protected readonly errorGuardar = signal<string | null>(null);

  private readonly errores = computed(() => validarDatos(this.form()));

  protected error(campo: Campo): string | null {
    const visible = this.intentoGuardar() || this.tocados().has(campo);
    return visible ? (this.errores()[campo] ?? null) : null;
  }

  protected escribir(campo: Campo, event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.form.update((f) => ({ ...f, [campo]: valor }));
  }

  protected tocar(campo: Campo): void {
    this.tocados.update((t) => new Set([...t, campo]));
  }

  protected guardar(event: Event): void {
    event.preventDefault();
    this.intentoGuardar.set(true);
    if (!sinErrores(this.errores()) || this.guardando()) return;

    this.guardando.set(true);
    this.errorGuardar.set(null);
    this.perfil.guardarDatos(normalizarDatos(this.form())).subscribe({
      next: () => {
        this.guardando.set(false);
        this.toast.ok('Guardamos tus datos.');
        this.cerrado.emit();
      },
      error: (e: ApiError) => {
        this.guardando.set(false);
        this.errorGuardar.set(e?.message ?? 'No pudimos guardar tus datos. Intenta de nuevo.');
      },
    });
  }

  protected cerrar(): void {
    if (!this.guardando()) this.cerrado.emit();
  }
}
