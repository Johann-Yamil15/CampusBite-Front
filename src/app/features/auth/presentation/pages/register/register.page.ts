// FB-Sprint2 10/10/2026: página standalone de registro con Signals y OnPush
// JJ-Sprint3 21/10/2026: TEC-11. Selector Alumno/Negocio (aria-pressed); el modo negocio autorregistra
// una cafetería completa (encargado + cafetería) reutilizando PAYMENT_METHODS/CAFETERIA_LIMITS de @features/cafeterias
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthFacade } from '@features/auth/application/auth.facade';
import { CAFETERIA_LIMITS, PAYMENT_METHODS, PaymentMethod } from '@features/cafeterias';

type AccountType = 'alumno' | 'cafeteria';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  protected readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);

  protected readonly isPasswordVisible = signal(false);
  protected readonly accountType = signal<AccountType>('alumno');
  protected readonly limits = CAFETERIA_LIMITS;
  protected readonly paymentMethods = PAYMENT_METHODS;

  // JJ-Sprint2 11/10/2026: mismas reglas que RegistroRequestDto del backend (nombre 2-80, correo máx. 120, contraseña 8-72)
  // JJ-Sprint2 11/10/2026: matrícula (máx. 20) y teléfono (10-15 dígitos o +) opcionales; términos obligatorios al crear cuenta
  protected readonly registerForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    matricula: ['', [Validators.maxLength(20)]],
    telefono: ['', [Validators.pattern(/^[0-9+]{10,15}$/)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    aceptaTerminos: [false, [Validators.requiredTrue]],
  });

  // JJ-Sprint3 21/10/2026: solo participa en la validación cuando accountType() === 'cafeteria' (ver setAccountType)
  protected readonly cafeteriaForm = this.fb.nonNullable.group({
    nombreCafeteria: [
      '',
      [
        Validators.required,
        Validators.minLength(CAFETERIA_LIMITS.nameMin),
        Validators.maxLength(CAFETERIA_LIMITS.nameMax),
      ],
    ],
    ubicacion: ['', [Validators.required, Validators.maxLength(CAFETERIA_LIMITS.locationMax)]],
    onCampus: [true],
    puntoEntrega: ['', [Validators.required, Validators.maxLength(CAFETERIA_LIMITS.pickupPointMax)]],
    metodosPago: this.fb.nonNullable.group(
      { Tarjeta: [false], Transferencia: [false], Efectivo: [true] },
      {
        validators: (g) =>
          Object.values(g.value as Record<string, boolean>).some(Boolean) ? null : { required: true },
      },
    ),
  });

  constructor() {
    this.authFacade.clearError();
    // Por defecto el modo es "alumno": el formulario de cafetería arranca deshabilitado
    // (un FormGroup deshabilitado no se valida ni aparece en getRawValue()).
    this.cafeteriaForm.disable();
  }

  protected setAccountType(type: AccountType): void {
    if (this.accountType() === type) return;
    this.accountType.set(type);
    this.authFacade.clearError();
    if (type === 'cafeteria') {
      this.cafeteriaForm.enable();
    } else {
      this.cafeteriaForm.disable();
    }
  }

  protected togglePasswordVisibility(): void {
    this.isPasswordVisible.update((v) => !v);
  }

  protected errorForPayment(): boolean {
    const group = this.cafeteriaForm.controls.metodosPago;
    return group.touched && group.invalid;
  }

  protected onSubmit(): void {
    const cafeteriaMode = this.accountType() === 'cafeteria';
    const formsValid = this.registerForm.valid && (!cafeteriaMode || this.cafeteriaForm.valid);
    if (!formsValid) {
      this.registerForm.markAllAsTouched();
      if (cafeteriaMode) this.cafeteriaForm.markAllAsTouched();
      return;
    }

    const { nombre, correo, matricula, telefono, password } = this.registerForm.getRawValue();

    if (!cafeteriaMode) {
      // JJ-Sprint2 11/10/2026: registra al alumno; el backend devuelve el token y la sesión queda iniciada
      this.authFacade
        .registro({
          name: nombre.trim(),
          email: correo.trim(),
          password,
          studentId: matricula.trim() || undefined,
          phone: telefono.trim() || undefined,
        })
        .subscribe({
          next: () => void this.router.navigateByUrl('/'),
          error: () => {
            // El mensaje ya queda en authFacade.error()
          },
        });
      return;
    }

    const cafeteria = this.cafeteriaForm.getRawValue();
    const paymentMethods = PAYMENT_METHODS.filter((m) => cafeteria.metodosPago[m]);

    // JJ-Sprint3 21/10/2026: autorregistra el negocio; queda activo de inmediato y con sesión como AdminCafeteria
    this.authFacade
      .registroCafeteria({
        ownerName: nombre.trim(),
        email: correo.trim(),
        password,
        phone: telefono.trim() || undefined,
        cafeteriaName: cafeteria.nombreCafeteria.trim(),
        location: cafeteria.ubicacion.trim(),
        onCampus: cafeteria.onCampus,
        pickupPoint: cafeteria.puntoEntrega.trim(),
        paymentMethods: paymentMethods as PaymentMethod[],
      })
      .subscribe({
        next: () => void this.router.navigateByUrl('/'),
        error: () => {
          // El mensaje ya queda en authFacade.error()
        },
      });
  }
}
