// CL-Sprint5 11/11/2026 (etapa 8): "Editar datos" del Perfil. Nombre (obligatorio), matrícula y teléfono
// (opcionales), con las reglas del registro. Los errores se muestran al salir del campo o al intentar guardar,
// no mientras se escribe por primera vez. Guarda con PerfilFacade (PUT api/alumnos/me/perfil).
// CL-Sprint5 26/11/2026: borrador por usuario (sobrevive a recargar sin internet); se borra al guardar o al
// cancelar. Sin internet no se envía: el botón pasa a «Reintentar».
import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { ApiError } from '@core/http/api-error';
import { BorradoresService, esObjeto } from '@core/services/borradores.service';
import { MENSAJE_NO_ENVIADO, envioSinRed } from '@core/utils/envio-sin-red';
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

/** CL-Sprint5 26/11/2026: borrador de "Editar mis datos" (cb.borrador.<sub>.perfil-datos). */
export const BORRADOR_PERFIL = 'perfil-datos';

/** Lo que se edita: los tres campos como texto (vacío = sin dato). */
type FormDatos = Record<Campo, string>;

export function esBorradorPerfil(d: unknown): d is FormDatos {
  const corto = (v: unknown) => typeof v === 'string' && v.length <= 200;
  return esObjeto(d) && corto(d['nombre']) && corto(d['matricula']) && corto(d['telefono']);
}

@Component({
  selector: 'app-editar-datos',
  imports: [ModalComponent],
  template: `
    <app-modal title="Editar mis datos" subtitle="Así te verá la cafetería al entregar tu pedido." size="sm" (closed)="cerrar()">
      <form id="form-datos" class="ed" novalidate (submit)="guardar($event)">
        @if (recuperado()) {
          <p class="cb-borrador" role="status">
            Recuperamos cambios sin guardar.
            <button type="button" class="cb-link" (click)="descartar()">Descartar</button>
          </p>
        }
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
        <button
          type="submit"
          form="form-datos"
          class="cb-btn cb-btn--primary"
          [disabled]="guardando() || envio.bloqueado()"
          [attr.aria-busy]="guardando()"
        >
          {{ guardando() ? 'Guardando…' : envio.pendiente() ? 'Reintentar' : 'Guardar cambios' }}
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
  private readonly borradores = inject(BorradoresService);
  protected readonly envio = envioSinRed();

  protected readonly limites = LIMITES_PERFIL;

  // Arranca con lo guardado; si aún no escribió su nombre, se le sugiere el del correo
  private readonly guardado: FormDatos = {
    nombre: this.perfil.perfil()?.datos.nombre ?? this.perfil.nombre(),
    matricula: this.perfil.perfil()?.datos.matricula ?? '',
    telefono: this.perfil.perfil()?.datos.telefono ?? '',
  };
  // CL-Sprint5 26/11/2026: si hay borrador, arranca con él
  private readonly borrador = this.borradores.leer(BORRADOR_PERFIL, esBorradorPerfil);
  protected readonly recuperado = signal(this.borrador !== null);
  protected readonly form = signal<FormDatos>(this.borrador ?? this.guardado);
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
    this.borradores.guardar(BORRADOR_PERFIL, this.form());
  }

  /** Vuelve a lo guardado y olvida el borrador. */
  protected descartar(): void {
    this.borradores.borrar(BORRADOR_PERFIL);
    this.form.set(this.guardado);
    this.recuperado.set(false);
    this.errorGuardar.set(null);
  }

  protected tocar(campo: Campo): void {
    this.tocados.update((t) => new Set([...t, campo]));
  }

  protected guardar(event: Event): void {
    event.preventDefault();
    this.intentoGuardar.set(true);
    if (!sinErrores(this.errores()) || this.guardando()) return;
    if (!this.envio.puedeEnviar()) {
      this.errorGuardar.set(MENSAJE_NO_ENVIADO);
      return;
    }

    this.guardando.set(true);
    this.errorGuardar.set(null);
    this.perfil.guardarDatos(normalizarDatos(this.form())).subscribe({
      next: () => {
        this.guardando.set(false);
        this.envio.listo();
        this.borradores.borrar(BORRADOR_PERFIL);
        this.toast.ok('Guardamos tus datos.');
        this.cerrado.emit();
      },
      error: (e: ApiError) => {
        this.guardando.set(false);
        this.envio.falloDeRed(e);
        this.errorGuardar.set(e?.message ?? 'No pudimos guardar tus datos. Intenta de nuevo.');
      },
    });
  }

  /** Cancelar a propósito descarta el borrador (recargar la página no pasa por aquí y lo conserva). */
  protected cerrar(): void {
    if (this.guardando()) return;
    this.borradores.borrar(BORRADOR_PERFIL);
    this.cerrado.emit();
  }
}
