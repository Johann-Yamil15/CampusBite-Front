// JJ-Sprint3 21/10/2026: TEC-12. Recuperación simple: correo + nueva contraseña + confirmar, sin código de
// verificación (se agrega en una historia futura). Reusa la "cáscara" global de login/registro.
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthFacade } from '@features/auth/application/auth.facade';

const passwordsMatch = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('nuevaPassword')?.value;
  const confirm = group.get('confirmarPassword')?.value;
  return password === confirm ? null : { passwordsMismatch: true };
};

@Component({
  selector: 'app-recuperar',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './recuperar.page.html',
  styleUrl: './recuperar.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecuperarPage {
  private readonly fb = inject(FormBuilder);
  protected readonly authFacade = inject(AuthFacade);

  protected readonly isPasswordVisible = signal(false);
  /** `true` tras un envío exitoso: se reemplaza el formulario por un mensaje de confirmación. */
  protected readonly done = signal(false);

  protected readonly form = this.fb.nonNullable.group(
    {
      correo: ['', [Validators.required, Validators.email]],
      nuevaPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirmarPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  constructor() {
    this.authFacade.clearError();
  }

  protected togglePasswordVisibility(): void {
    this.isPasswordVisible.update((v) => !v);
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { correo, nuevaPassword } = this.form.getRawValue();
    this.authFacade.restablecerPassword(correo.trim(), nuevaPassword).subscribe({
      next: () => this.done.set(true),
      error: () => {
        // El mensaje ya queda en authFacade.error()
      },
    });
  }
}
