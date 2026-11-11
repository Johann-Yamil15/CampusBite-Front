// JY-Sprint4 05/11/2026: HU futura (cascarón visual). Perfil del alumno: datos, preferencias y accesos.
// Lo que SÍ es real: el correo sale de la sesión, "Cerrar sesión" llama a AuthFacade.logout(), y editar el
// perfil o la contraseña valida la entrada y aplica el cambio en pantalla. Falta persistirlo: ni PUT /me ni
// el cambio de contraseña con la actual existen todavía en el back.
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthFacade } from '@features/auth';
import { ModalComponent } from '@shared/ui/modal/modal.component';
import { ToastService } from '@shared/ui/toast/toast.service';
import { MisPedidosFacade } from '@features/ordenes';

type Dialogo = 'editar' | 'password' | 'salir' | null;

/** Las mismas reglas que pide el registro: 8+, una mayúscula y un número. */
const PASSWORD_OK = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

@Component({
  selector: 'app-perfil-page',
  imports: [RouterLink, ModalComponent],
  templateUrl: './perfil.page.html',
  styleUrl: './perfil.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilPage {
  private readonly auth = inject(AuthFacade);
  private readonly toast = inject(ToastService);
  private readonly pedidos = inject(MisPedidosFacade);

  protected readonly dialogo = signal<Dialogo>(null);

  // User no trae nombre todavía (el back no lo manda en /me): se parte del correo y se puede editar
  private readonly nombreEditado = signal<string | null>(null);

  protected readonly correo = computed(() => this.auth.user()?.email ?? 'juan.perez@uttt.edu.mx');
  protected readonly rol = computed(() => this.auth.role() ?? 'Alumno');

  protected readonly nombre = computed(
    () => this.nombreEditado() ?? this.correo().split('@')[0] ?? 'Alumno',
  );

  protected readonly telefono = signal('');
  protected readonly foto = 'https://picsum.photos/seed/cb-user-juan/160/160';
  protected readonly matricula = '23300022';

  protected readonly pedidosTotales = computed(() => this.pedidos.ordenes().length);
  protected readonly pedidosEnCurso = computed(() => this.pedidos.enCurso().length);

  // Preferencias locales del cascarón (no se persisten todavía)
  protected readonly avisosPedido = signal(true);
  protected readonly avisosPromos = signal(false);

  // ---------- Formulario de perfil ----------
  protected readonly formNombre = signal('');
  protected readonly formTelefono = signal('');

  protected readonly nombreValido = computed(() => this.formNombre().trim().length >= 3);

  // ---------- Formulario de contraseña ----------
  protected readonly actual = signal('');
  protected readonly nueva = signal('');
  protected readonly repetida = signal('');

  protected readonly nuevaValida = computed(() => PASSWORD_OK.test(this.nueva()));
  protected readonly coinciden = computed(() => this.nueva() === this.repetida());
  protected readonly passwordValido = computed(
    () => !!this.actual() && this.nuevaValida() && this.coinciden(),
  );

  protected abrirEditar(): void {
    this.formNombre.set(this.nombre());
    this.formTelefono.set(this.telefono());
    this.dialogo.set('editar');
  }

  protected abrirPassword(): void {
    this.actual.set('');
    this.nueva.set('');
    this.repetida.set('');
    this.dialogo.set('password');
  }

  protected cerrar(): void {
    this.dialogo.set(null);
  }

  protected campo(destino: 'formNombre' | 'formTelefono' | 'actual' | 'nueva' | 'repetida', event: Event): void {
    this[destino].set((event.target as HTMLInputElement).value);
  }

  protected alternarAviso(cual: 'avisosPedido' | 'avisosPromos'): void {
    this[cual].update((v) => !v);
    this.toast.info(
      cual === 'avisosPedido'
        ? `Avisos del estado de tus pedidos: ${this.avisosPedido() ? 'activados' : 'desactivados'}.`
        : `Avisos de promociones: ${this.avisosPromos() ? 'activados' : 'desactivados'}.`,
    );
  }

  protected guardarPerfil(): void {
    if (!this.nombreValido()) return;

    this.nombreEditado.set(this.formNombre().trim());
    this.telefono.set(this.formTelefono().trim());
    this.cerrar();
    this.toast.ok('Listo, se guardaron tus datos.');
  }

  protected guardarPassword(): void {
    if (!this.passwordValido()) return;

    this.cerrar();
    this.toast.ok('Tu contraseña se cambió. Úsala en el próximo inicio de sesión.');
  }

  protected salir(): void {
    this.cerrar();
    this.auth.logout();
  }
}
