// CL-Sprint5 13/11/2026: destino del enlace del correo de verificación (Correo__UrlVerificacion del back =
// <front>/verificar-correo?token=...). Manda el token a POST api/auth/verificar-correo: si sirve, la sesión
// queda iniciada y se va al inicio (el encargado sigue a /mi-negocio por negocioHomeGuard). Si no sirve
// (vencido o ya usado), muestra el `detail` del back y deja pedir otro correo.
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthFacade } from '@features/auth/application/auth.facade';

type Estado = 'verificando' | 'fallo' | 'reenviado';

@Component({
  selector: 'app-verificar-correo',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './verificar-correo.page.html',
  styleUrl: '../recuperar/recuperar.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerificarCorreoPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  protected readonly authFacade = inject(AuthFacade);

  protected readonly estado = signal<Estado>('verificando');
  /** Por qué no se pudo verificar (el `detail` del back, o falta el token). */
  protected readonly motivo = signal('');

  protected readonly form = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
  });

  ngOnInit(): void {
    this.authFacade.clearError();
    const token = this.route.snapshot.queryParamMap.get('token')?.trim();
    if (!token) {
      this.fallar('El enlace no trae el código de verificación. Ábrelo de nuevo desde tu correo.');
      return;
    }
    this.authFacade.verificarCorreo(token).subscribe({
      next: () => void this.router.navigateByUrl('/'),
      error: () => this.fallar(this.authFacade.error() ?? 'No pudimos verificar tu correo.'),
    });
  }

  protected reenviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.authFacade.reenviarVerificacion(this.form.getRawValue().correo.trim()).subscribe({
      next: () => this.estado.set('reenviado'),
      error: () => {
        // El mensaje ya queda en authFacade.error() (p. ej. 429 demasiados intentos)
      },
    });
  }

  private fallar(motivo: string): void {
    this.authFacade.clearError();
    this.motivo.set(motivo);
    this.estado.set('fallo');
  }
}
