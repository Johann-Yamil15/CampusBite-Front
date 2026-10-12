// FB-Sprint2 10/10/2026: página standalone de login con diseño a dos columnas, signals y OnPush
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthFacade } from '@application/facades/auth.facade';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPage {
  // FB-Sprint2 10/10/2026: inyección de dependencias
  private readonly fb = inject(FormBuilder);
  protected readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  constructor() {
    this.authFacade.clearError();
  }

  // FB-Sprint2 10/10/2026: estados de la interfaz de usuario (UI)
  protected readonly isPasswordVisible = signal(false);
  protected readonly userType = signal<'estudiante' | 'personal'>('estudiante');

  protected readonly loginForm = this.fb.nonNullable.group({
    // JJ-Sprint2 11/10/2026: el backend solo acepta correo en el login (LoginRequestDto.Correo)
    correo: ['', [Validators.required]],
    password: ['', [Validators.required]],
    mantenerSesion: [true]
  });

  protected togglePasswordVisibility(): void {
    this.isPasswordVisible.update(v => !v);
  }

  protected setUserType(type: 'estudiante' | 'personal'): void {
    this.userType.set(type);
  }

protected onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { correo, password } = this.loginForm.getRawValue();

    // JJ-Sprint2 11/10/2026: inicia sesión y regresa a la ruta que pidió el authGuard (returnUrl)
    this.authFacade.login({ email: correo.trim(), password }).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';
        void this.router.navigateByUrl(returnUrl);
      },
      error: () => {
        // El mensaje ya queda en authFacade.error()
      },
    });
  }
}