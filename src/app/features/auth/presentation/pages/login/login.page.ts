// FB-Sprint2 10/10/2026: página standalone de login con signals y OnPush
// JJ-Sprint3 21/10/2026: rediseño Campus Quick-Bite; se quita el toggle estudiante/personal (no cambiaba nada: el rol lo decide el backend)
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthFacade } from '@features/auth/application/auth.facade';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  protected readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  constructor() {
    this.authFacade.clearError();
  }

  protected readonly isPasswordVisible = signal(false);

  protected readonly loginForm = this.fb.nonNullable.group({
    // JJ-Sprint2 11/10/2026: el backend solo acepta correo en el login (LoginRequestDto.Correo)
    correo: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  protected togglePasswordVisibility(): void {
    this.isPasswordVisible.update((v) => !v);
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
