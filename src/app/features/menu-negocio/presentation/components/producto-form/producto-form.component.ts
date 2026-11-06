// CL-Sprint4 28/10/2026: HU-07B. Diálogo (<dialog> nativo) con formulario reactivo para crear o editar un producto.
// Reglas iguales a las del backend (GuardarProductoDto): nombre 2–100, descripción máx. 500, precio > 0 y < 1,000,000
// con máx. 2 decimales. En el alta acepta una imagen opcional (JPEG/PNG/WebP, 5 MB); al editar la imagen se cambia
// con "Cambiar imagen" del menú de la tarjeta (el PUT del backend no la recibe).
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Observable } from 'rxjs';
import { ApiError } from '@core/http/api-error';
import { MenuNegocioFacade } from '@features/menu-negocio/application/menu-negocio.facade';
import {
  Category,
  MenuProduct,
  PRODUCT_IMAGE_RULES,
  PRODUCT_LIMITS,
  ProductData,
  validateProductImage,
} from '@features/menu-negocio/domain/models/menu.model';

type FieldName = 'name' | 'description' | 'price';

/** Rechaza textos de puros espacios (el backend los recorta y los toma como vacíos). */
const notBlank = (control: AbstractControl<string>): ValidationErrors | null =>
  control.value && control.value.trim().length === 0 ? { blank: true } : null;

/** Mínimo de caracteres contando el texto recortado, como el backend. */
const trimmedMin =
  (min: number) =>
  (control: AbstractControl<string>): ValidationErrors | null =>
    control.value && control.value.trim().length > 0 && control.value.trim().length < min
      ? { minlength: true }
      : null;

/** Precio con máximo 2 decimales. */
const twoDecimals = (control: AbstractControl<number | null>): ValidationErrors | null =>
  control.value !== null && Math.round(control.value * 100) !== control.value * 100
    ? { decimals: true }
    : null;

@Component({
  selector: 'app-producto-form',
  imports: [ReactiveFormsModule],
  templateUrl: './producto-form.component.html',
  styleUrl: './producto-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductoFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly menu = inject(MenuNegocioFacade);

  /** Producto a editar; `null` = alta. El formulario se llena con sus datos actuales. */
  readonly product = input<MenuProduct | null>(null);
  readonly categories = input.required<Category[]>();
  /** Se emite con el nombre guardado, al crear o editar. */
  readonly saved = output<string>();
  /** El diálogo se cerró sin guardar (Cancelar, Esc o clic en el fondo). */
  readonly closed = output<void>();

  protected readonly limits = PRODUCT_LIMITS;
  protected readonly imageRules = PRODUCT_IMAGE_RULES;
  protected readonly isEdit = computed(() => this.product() !== null);
  protected readonly saving = signal(false);
  /** Error del backend (o de la imagen) del último intento. */
  protected readonly serverError = signal<string | null>(null);
  /** `true` si el último error fue el 503 de imágenes: se ofrece guardar sin imagen. */
  protected readonly imageServiceDown = signal(false);
  protected readonly image = signal<File | null>(null);
  protected readonly imageError = signal<string | null>(null);
  protected readonly preview = signal<string | null>(null);
  private readonly submitted = signal(false);

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  private wasSaved = false;

  protected readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(PRODUCT_LIMITS.nameMax),
      trimmedMin(PRODUCT_LIMITS.nameMin),
      notBlank,
    ]),
    description: this.fb.nonNullable.control('', [
      Validators.maxLength(PRODUCT_LIMITS.descriptionMax),
    ]),
    price: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0.01),
      Validators.max(PRODUCT_LIMITS.priceMax),
      twoDecimals,
    ]),
    categoryId: this.fb.nonNullable.control(''),
    available: this.fb.nonNullable.control(true),
  });

  constructor() {
    afterNextRender(() => {
      const product = this.product();
      if (product) {
        // Editar: rellena con los datos actuales del producto
        this.form.reset({
          name: product.name,
          description: product.description ?? '',
          price: product.price,
          categoryId: product.categoryId ?? '',
          available: product.available,
        });
      }
      this.dialog().nativeElement.showModal();
    });
    inject(DestroyRef).onDestroy(() => this.revokePreview());
  }

  /** Mensaje de error del campo, solo después de tocarlo o de intentar enviar. */
  protected errorFor(field: FieldName): string | null {
    const control = this.form.controls[field];
    if (!control.invalid || !(control.touched || this.submitted())) return null;
    return messageFor(field, control.errors ?? {});
  }

  protected onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.setImage(file);
  }

  protected removeImage(): void {
    this.setImage(null);
    const input = this.fileInput()?.nativeElement;
    if (input) input.value = '';
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid || this.imageError()) {
      this.form.markAllAsTouched();
      return;
    }

    const data = toProductData(this.form.getRawValue());
    const current = this.product();
    const request$: Observable<unknown> = current
      ? this.menu.update(current.id, data)
      : this.menu.create(data, this.image());

    this.saving.set(true);
    this.serverError.set(null);
    this.imageServiceDown.set(false);
    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.wasSaved = true;
        this.saved.emit(data.name);
        this.dialog().nativeElement.close();
      },
      error: (err: ApiError) => {
        this.saving.set(false);
        this.serverError.set(err.message);
        this.imageServiceDown.set(err.status === 503 && this.image() !== null);
      },
    });
  }

  /** Tras el 503 de imágenes: quita la imagen y guarda el producto sin ella. */
  protected saveWithoutImage(): void {
    this.removeImage();
    this.submit();
  }

  protected cancel(): void {
    this.dialog().nativeElement.close();
  }

  /** Evento `close` del <dialog> (también con Esc). */
  protected onDialogClose(): void {
    if (!this.wasSaved) this.closed.emit();
  }

  private setImage(file: File | null): void {
    this.revokePreview();
    this.image.set(file);
    this.imageError.set(file ? validateProductImage(file) : null);
    this.preview.set(file && !this.imageError() ? URL.createObjectURL(file) : null);
    this.serverError.set(null);
    this.imageServiceDown.set(false);
  }

  private revokePreview(): void {
    const url = this.preview();
    if (url) URL.revokeObjectURL(url);
  }
}

function messageFor(field: FieldName, errors: ValidationErrors): string {
  const { nameMin, nameMax, descriptionMax } = PRODUCT_LIMITS;
  switch (field) {
    case 'name':
      if (errors['maxlength']) return `El nombre puede tener máximo ${nameMax} caracteres.`;
      if (errors['minlength']) return `El nombre debe tener al menos ${nameMin} caracteres.`;
      return 'El nombre es obligatorio.';
    case 'description':
      return `La descripción puede tener máximo ${descriptionMax} caracteres.`;
    case 'price':
      if (errors['required']) return 'El precio es obligatorio.';
      if (errors['decimals']) return 'El precio puede tener máximo 2 decimales.';
      return 'El precio debe ser mayor a 0 y menor a 1,000,000.';
  }
}

interface FormValue {
  name: string;
  description: string;
  price: number | null;
  categoryId: string;
  available: boolean;
}

function toProductData(value: FormValue): ProductData {
  return {
    name: value.name.trim(),
    description: value.description.trim() || null,
    price: value.price ?? 0,
    categoryId: value.categoryId || null,
    available: value.available,
  };
}
