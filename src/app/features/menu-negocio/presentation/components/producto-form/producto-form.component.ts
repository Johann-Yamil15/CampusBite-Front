// CL-Sprint4 28/10/2026: HU-07B. Diálogo (<dialog> nativo) con formulario reactivo para crear o editar un producto.
// Reglas iguales a las del backend (GuardarProductoDto): nombre 2–100, descripción máx. 500, precio > 0 y < 1,000,000
// con máx. 2 decimales. En el alta acepta una imagen opcional (JPEG/PNG/WebP, 5 MB); al editar la imagen se cambia
// con "Cambiar imagen" del menú de la tarjeta (el PUT del backend no la recibe).
// CL-Sprint5 26/11/2026: borrador por usuario y producto (sobrevive a recargar sin internet; la imagen no, un
// archivo no cabe en localStorage). Se borra al guardar o al cancelar. Sin internet no se envía.
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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiError } from '@core/http/api-error';
import { BorradoresService, esObjeto } from '@core/services/borradores.service';
import { MENSAJE_NO_ENVIADO, envioSinRed } from '@core/utils/envio-sin-red';
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
  private readonly borradores = inject(BorradoresService);
  protected readonly envio = envioSinRed();
  /** CL-Sprint5 26/11/2026: se recuperó un borrador al abrir. */
  protected readonly recuperado = signal(false);

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
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      this.form.reset(this.valoresIniciales());
      // CL-Sprint5 26/11/2026: si hay borrador de este producto (o del alta), se recupera
      const borrador = this.borradores.leer(this.nombreBorrador(), esBorradorProducto);
      if (borrador) {
        this.form.reset(borrador);
        this.recuperado.set(true);
      }
      this.form.valueChanges
        .pipe(takeUntilDestroyed(destroyRef))
        .subscribe(() => this.borradores.guardar(this.nombreBorrador(), this.form.getRawValue()));
      this.dialog().nativeElement.showModal();
    });
    destroyRef.onDestroy(() => this.revokePreview());
  }

  /** Vuelve a los datos del producto (o al formulario vacío) y olvida el borrador. */
  protected descartar(): void {
    // Sin emitir valueChanges: si no, el reinicio se volvería a guardar como borrador
    this.form.reset(this.valoresIniciales(), { emitEvent: false });
    this.borradores.borrar(this.nombreBorrador());
    this.recuperado.set(false);
    this.serverError.set(null);
  }

  private valoresIniciales(): FormValue {
    const product = this.product();
    // Editar: los datos actuales del producto; alta: vacío
    return product
      ? {
          name: product.name,
          description: product.description ?? '',
          price: product.price,
          categoryId: product.categoryId ?? '',
          available: product.available,
        }
      : { name: '', description: '', price: null, categoryId: '', available: true };
  }

  private nombreBorrador(): string {
    return `${BORRADOR_PRODUCTO}.${this.product()?.id ?? 'nuevo'}`;
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
    if (!this.envio.puedeEnviar()) {
      this.serverError.set(MENSAJE_NO_ENVIADO);
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
        this.envio.listo();
        this.borradores.borrar(this.nombreBorrador());
        this.wasSaved = true;
        this.saved.emit(data.name);
        this.dialog().nativeElement.close();
      },
      error: (err: ApiError) => {
        this.saving.set(false);
        this.envio.falloDeRed(err);
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
    if (this.wasSaved) return;
    // Cerrar a propósito descarta el borrador (recargar la página no pasa por aquí y lo conserva)
    this.borradores.borrar(this.nombreBorrador());
    this.closed.emit();
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

/** CL-Sprint5 26/11/2026: borrador del formulario (cb.borrador.<sub>.producto.<id|nuevo>). Sin la imagen. */
export const BORRADOR_PRODUCTO = 'producto';

export function esBorradorProducto(d: unknown): d is FormValue {
  return (
    esObjeto(d) &&
    typeof d['name'] === 'string' &&
    d['name'].length <= PRODUCT_LIMITS.nameMax &&
    typeof d['description'] === 'string' &&
    d['description'].length <= PRODUCT_LIMITS.descriptionMax &&
    (d['price'] === null || (typeof d['price'] === 'number' && Number.isFinite(d['price']))) &&
    typeof d['categoryId'] === 'string' &&
    typeof d['available'] === 'boolean'
  );
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
