// FB-Sprint2 10/10/2026: página standalone de registro con Signals y OnPush
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
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

  protected readonly isPasswordVisible = signal(false);

  // Formulario alineado con RegistroRequestDto del backend
  protected readonly registerForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required]],
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  protected togglePasswordVisibility(): void {
    this.isPasswordVisible.update(v => !v);
  }

  protected onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const payload = this.registerForm.getRawValue();
    // FB-Sprint2 10/10/2026: Llamada directa al Facade
    this.authFacade.register(payload);
  }
}