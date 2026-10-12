// FB-Sprint2 10/10/2026: página standalone de registro con Signals y OnPush
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthFacade } from '@application/facades/auth.facade';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  protected readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);

  constructor() {
    this.authFacade.clearError();
  }

  protected readonly isPasswordVisible = signal(false);

  // JJ-Sprint2 11/10/2026: mismas reglas que RegistroRequestDto del backend (nombre 2-80, correo máx. 120, contraseña 8-72)
  protected readonly registerForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]]
  });

  protected togglePasswordVisibility(): void {
    this.isPasswordVisible.update(v => !v);
  }

  protected onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { nombre, correo, password } = this.registerForm.getRawValue();

    // JJ-Sprint2 11/10/2026: registra al alumno; el backend devuelve el token y la sesión queda iniciada
    this.authFacade.registro({ name: nombre.trim(), email: correo.trim(), password }).subscribe({
      next: () => void this.router.navigateByUrl('/'),
      error: () => {
        // El mensaje ya queda en authFacade.error()
      },
    });
  }
}