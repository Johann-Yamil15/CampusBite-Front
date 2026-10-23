// FB-Sprint3 21/10/2026: formulario reactivo de alta de cafeterías (HU-06A)
// JJ-Sprint3 21/10/2026: conectado al CafeteriaFacade (HU-06B) con los campos y reglas del backend; también edita
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  CAFETERIA_LIMITS,
  Cafeteria,
  CafeteriaData,
  CafeteriaFacade,
  PAYMENT_METHODS,
  PaymentMethod,
} from '@features/cafeterias';

type FieldName = 'name' | 'location' | 'pickupPoint' | 'paymentMethods';

interface FieldError {
  field: FieldName;
  /** id del control al que lleva el enlace del resumen de errores. */
  target: string;
  message: string;
}

/** Rechaza textos de puros espacios (el backend los recorta y los toma como vacíos). */
const notBlank = (control: AbstractControl<string>): ValidationErrors | null =>
  control.value && control.value.trim().length === 0 ? { blank: true } : null;

/** Al menos un método de pago marcado. */
const atLeastOne = (group: AbstractControl): ValidationErrors | null =>
  Object.values(group.value as Record<string, boolean>).some(Boolean) ? null : { required: true };

@Component({
  selector: 'app-cafeteria-form',
  imports: [ReactiveFormsModule],
  templateUrl: './cafeteria-form.component.html',
  styleUrl: './cafeteria-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CafeteriaFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly injector = inject(Injector);
  protected readonly cafeterias = inject(CafeteriaFacade);

  /** Cafetería a editar; `null` = alta de una nueva. */
  readonly cafeteria = input<Cafeteria | null>(null);
  /** Se emite con la cafetería que respondió el backend al crear o editar. */
  readonly saved = output<Cafeteria>();
  readonly cancelled = output<void>();

  protected readonly limits = CAFETERIA_LIMITS;
  protected readonly paymentMethods = PAYMENT_METHODS;
  protected readonly isEdit = computed(() => this.cafeteria() !== null);
  /** Errores del último intento de envío (para el resumen accesible). */
  protected readonly errorList = signal<FieldError[]>([]);
  private readonly submitted = signal(false);
  private readonly summary = viewChild<ElementRef<HTMLElement>>('errorSummary');

  // Los nombres del grupo de pagos deben coincidir con PAYMENT_METHODS (contrato del backend)
  protected readonly form = this.fb.nonNullable.group({
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(CAFETERIA_LIMITS.nameMin),
        Validators.maxLength(CAFETERIA_LIMITS.nameMax),
        notBlank,
      ],
    ],
    location: [
      '',
      [Validators.required, Validators.maxLength(CAFETERIA_LIMITS.locationMax), notBlank],
    ],
    onCampus: [true],
    pickupPoint: [
      '',
      [Validators.required, Validators.maxLength(CAFETERIA_LIMITS.pickupPointMax), notBlank],
    ],
    paymentMethods: this.fb.nonNullable.group(
      { Tarjeta: [false], Transferencia: [false], Efectivo: [true] },
      { validators: atLeastOne },
    ),
  });

  constructor() {
    // Cada vez que cambia la cafetería a editar, el formulario se llena (o se limpia para un alta)
    effect(() => {
      const cafeteria = this.cafeteria();
      untracked(() => {
        this.submitted.set(false);
        this.errorList.set([]);
        this.cafeterias.clearError();
        this.form.reset(cafeteria ? toFormValue(cafeteria) : undefined);
      });
    });
  }

  /** Mensaje de error del campo, solo después de tocarlo o de intentar enviar. */
  protected errorFor(field: FieldName): string | null {
    const control = this.form.controls[field];
    if (!control.invalid || !(control.touched || this.submitted())) return null;
    return messageFor(field, control.errors ?? {});
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorList.set(this.collectErrors());
      // Lleva el foco al resumen para que teclado y lector de pantalla sepan qué corregir
      afterNextRender(() => this.summary()?.nativeElement.focus(), { injector: this.injector });
      return;
    }

    this.errorList.set([]);
    const data = toCafeteriaData(this.form.getRawValue());
    const current = this.cafeteria();
    const request$ = current
      ? this.cafeterias.update(current.id, data)
      : this.cafeterias.create(data);

    request$.subscribe({
      next: (saved) => this.saved.emit(saved),
      error: () => {
        // El mensaje del backend (400/409 en español) ya queda en cafeterias.error()
      },
    });
  }

  protected cancel(): void {
    this.cafeterias.clearError();
    this.cancelled.emit();
  }

  /** Lleva el foco al control con error desde el resumen (sin cambiar la URL). */
  protected focusField(event: Event, target: string): void {
    event.preventDefault();
    document.getElementById(target)?.focus();
  }

  private collectErrors(): FieldError[] {
    const targets: Record<FieldName, string> = {
      name: 'cafeteria-name',
      location: 'cafeteria-location',
      pickupPoint: 'cafeteria-pickup',
      paymentMethods: `cafeteria-pay-${PAYMENT_METHODS[0]}`,
    };
    return (Object.keys(targets) as FieldName[])
      .map((field) => ({ field, target: targets[field], message: this.errorFor(field) }))
      .filter((e): e is FieldError => e.message !== null);
  }
}

function messageFor(field: FieldName, errors: ValidationErrors): string {
  const { nameMin, nameMax, locationMax, pickupPointMax } = CAFETERIA_LIMITS;
  switch (field) {
    case 'name':
      if (errors['maxlength']) return `El nombre puede tener máximo ${nameMax} caracteres.`;
      if (errors['minlength']) return `El nombre debe tener al menos ${nameMin} caracteres.`;
      return 'El nombre es obligatorio.';
    case 'location':
      if (errors['maxlength']) return `La ubicación puede tener máximo ${locationMax} caracteres.`;
      return 'La ubicación es obligatoria.';
    case 'pickupPoint':
      if (errors['maxlength'])
        return `El punto de entrega puede tener máximo ${pickupPointMax} caracteres.`;
      return 'El punto de entrega es obligatorio.';
    case 'paymentMethods':
      return 'Elige al menos un método de pago.';
  }
}

function toFormValue(cafeteria: Cafeteria) {
  return {
    name: cafeteria.name,
    location: cafeteria.location,
    onCampus: cafeteria.onCampus,
    pickupPoint: cafeteria.pickupPoint,
    paymentMethods: Object.fromEntries(
      PAYMENT_METHODS.map((m) => [m, cafeteria.paymentMethods.includes(m)]),
    ) as Record<PaymentMethod, boolean>,
  };
}

function toCafeteriaData(value: ReturnType<typeof toFormValue>): CafeteriaData {
  return {
    name: value.name.trim(),
    location: value.location.trim(),
    onCampus: value.onCampus,
    pickupPoint: value.pickupPoint.trim(),
    paymentMethods: PAYMENT_METHODS.filter((m) => value.paymentMethods[m]),
  };
}
