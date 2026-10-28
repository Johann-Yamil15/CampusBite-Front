import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, defer, finalize, forkJoin, tap, throwError } from 'rxjs';
import { ApiError } from '@core/http/api-error';
import { MenuRepository } from '@features/menu-negocio/domain/repositories/menu.repository';
import {
  Category,
  MenuProduct,
  ProductData,
  validateProductImage,
} from '@features/menu-negocio/domain/models/menu.model';

/** Mensaje del 503 de imágenes (Azure Blob no configurado o sin respuesta). */
export const IMAGE_SERVICE_UNAVAILABLE =
  'El servicio de imágenes no está disponible por ahora. Intenta de nuevo más tarde.';

/**
 * CL-Sprint4 28/10/2026: HU-07B. "Controlador" del menú del encargado: productos y categorías de UNA
 * cafetería, con estado reactivo (signals) para el panel. Se provee en menu-negocio.routes.ts (alcance de la feature).
 *
 * Todos los métodos devuelven un `Observable` frío: **hay que suscribirse**. Al responder, los signals se
 * actualizan solos (sin recargar la lista). Si una acción falla, el error llega como `ApiError` con un
 * `message` listo para mostrar (en español, del backend o de aquí); el error de la carga queda en `error()`.
 *
 * Permisos (los valida el backend): solo el encargado de ESA cafetería o `AdminSistema`; otro → 403.
 */
@Injectable()
export class MenuNegocioFacade {
  private readonly repo = inject(MenuRepository);

  private readonly _products = signal<MenuProduct[]>([]);
  private readonly _categories = signal<Category[]>([]);
  private readonly _pending = signal<ReadonlySet<string>>(new Set());
  private cafeteriaId: string | null = null;

  /** Todos los productos (disponibles e inactivos), en el orden del backend: categoría y nombre. */
  readonly products = this._products.asReadonly();
  /** Categorías de la cafetería, ordenadas por nombre. */
  readonly categories = this._categories.asReadonly();
  /** `true` mientras se carga el menú (`load`). Las acciones no lo tocan: no se oculta la galería. */
  readonly loading = signal(false);
  /** Mensaje del error de la carga, o `null`. */
  readonly error = signal<string | null>(null);

  readonly total = computed(() => this._products().length);
  readonly availableCount = computed(() => this._products().filter((p) => p.available).length);
  readonly unavailableCount = computed(() => this.total() - this.availableCount());

  /** `true` si el producto tiene una petición en curso (toggle, imagen, guardar o eliminar). */
  isPending(productId: string): boolean {
    return this._pending().has(productId);
  }

  /**
   * Carga productos (`GET .../productos`) y categorías (`GET .../categorias`) en paralelo.
   * @returns Completa al tener ambos. Falla con `ApiError` (403 = no es su cafetería o no existe).
   */
  load(cafeteriaId: string): Observable<unknown> {
    return defer(() => {
      this.cafeteriaId = cafeteriaId;
      this.loading.set(true);
      this.error.set(null);
      return forkJoin({
        products: this.repo.listProducts(cafeteriaId),
        categories: this.repo.listCategories(cafeteriaId),
      }).pipe(
        tap(({ products, categories }) => {
          this._products.set(products);
          this._categories.set(categories);
        }),
        catchError((err: ApiError) => {
          const friendly = toFriendly(err);
          this.error.set(friendly.message);
          return throwError(() => friendly);
        }),
        finalize(() => this.loading.set(false)),
      );
    });
  }

  /**
   * Alta (`POST .../productos`, multipart, 201) con imagen opcional; lo agrega a `products`.
   * @returns El producto creado. Falla con `ApiError`: 400 = datos o imagen inválidos, 409 = nombre repetido,
   *   503 = servicio de imágenes caído (el producto NO se crea; se puede guardar sin imagen).
   */
  create(data: ProductData, image: File | null): Observable<MenuProduct> {
    return this.run(() => {
      const invalid = image ? validateProductImage(image) : null;
      if (invalid) return throwError(() => ({ status: 400, message: invalid }) satisfies ApiError);
      return this.repo
        .createProduct(this.requireCafeteria(), data, image)
        .pipe(tap((created) => this._products.update((list) => sortProducts([...list, created]))));
    });
  }

  /**
   * Edición (`PUT .../productos/{id}`, 204). El backend no devuelve el producto: se arma aquí con los datos
   * enviados y el nombre de su categoría.
   * @returns Completa sin valor. Falla con `ApiError`: 400 = datos inválidos, 404 = no existe, 409 = nombre repetido.
   */
  update(productId: string, data: ProductData): Observable<void> {
    return this.run(
      () =>
        this.repo.updateProduct(this.requireCafeteria(), productId, data).pipe(
          tap(() => {
            const categoryName =
              this._categories().find((c) => c.id === data.categoryId)?.name ?? null;
            this.patch(productId, {
              ...data,
              categoryName: data.categoryId ? categoryName : null,
              updatedAt: new Date(),
            });
            this._products.update(sortProducts);
          }),
        ),
      productId,
    );
  }

  /**
   * Toggle de disponibilidad (`PATCH .../disponible`, 204). Optimista: cambia `products` al momento y,
   * si el backend falla, regresa al valor anterior.
   */
  setAvailable(productId: string, available: boolean): Observable<void> {
    const previous = this._products().find((p) => p.id === productId)?.available;
    return this.run(() => {
      this.patch(productId, { available });
      return this.repo.setAvailable(this.requireCafeteria(), productId, available).pipe(
        tap({
          error: () => {
            if (previous !== undefined) this.patch(productId, { available: previous });
          },
        }),
      );
    }, productId);
  }

  /**
   * Eliminación física (`DELETE .../productos/{id}`, 204); lo quita de `products`.
   * @returns Completa sin valor. Falla con `ApiError`: 409 = tiene órdenes activas (el `message` del backend
   *   lo explica: hay que desactivarlo en su lugar), 404 = no existe.
   */
  remove(productId: string): Observable<void> {
    return this.run(
      () =>
        this.repo
          .deleteProduct(this.requireCafeteria(), productId)
          .pipe(tap(() => this._products.update((list) => list.filter((p) => p.id !== productId)))),
      productId,
    );
  }

  /**
   * Cambia la imagen (`POST .../productos/{id}/imagen`, 200) y actualiza su `imageUrl`.
   * Valida tipo y tamaño antes de subir.
   * @returns La URL nueva. Falla con `ApiError`: 400/413 = imagen inválida, 503 = servicio de imágenes caído.
   */
  uploadImage(productId: string, image: File): Observable<string> {
    return this.run(() => {
      const invalid = validateProductImage(image);
      if (invalid) return throwError(() => ({ status: 400, message: invalid }) satisfies ApiError);
      return this.repo
        .uploadImage(this.requireCafeteria(), productId, image)
        .pipe(tap((imageUrl) => this.patch(productId, { imageUrl, updatedAt: new Date() })));
    }, productId);
  }

  // Marca el producto como "en curso" y traduce el error a un mensaje listo para mostrar
  private run<T>(request: () => Observable<T>, productId?: string): Observable<T> {
    return defer(() => {
      if (productId) this.setPending(productId, true);
      return request().pipe(
        catchError((err: ApiError) => throwError(() => toFriendly(err))),
        finalize(() => {
          if (productId) this.setPending(productId, false);
        }),
      );
    });
  }

  private requireCafeteria(): string {
    if (!this.cafeteriaId) throw new Error('MenuNegocioFacade: llama a load(cafeteriaId) primero.');
    return this.cafeteriaId;
  }

  private patch(productId: string, changes: Partial<MenuProduct>): void {
    this._products.update((list) =>
      list.map((p) => (p.id === productId ? { ...p, ...changes } : p)),
    );
  }

  private setPending(productId: string, pending: boolean): void {
    this._pending.update((set) => {
      const next = new Set(set);
      if (pending) next.add(productId);
      else next.delete(productId);
      return next;
    });
  }
}

// Mismo orden que sp_listar_productos_cafeteria: categoría (sin categoría al final) y luego nombre
function sortProducts(list: MenuProduct[]): MenuProduct[] {
  const byText = (a: string, b: string) => a.localeCompare(b, 'es', { sensitivity: 'base' });
  return [...list].sort((a, b) => {
    if (a.categoryName !== b.categoryName) {
      if (a.categoryName === null) return 1;
      if (b.categoryName === null) return -1;
      return byText(a.categoryName, b.categoryName);
    }
    return byText(a.name, b.name);
  });
}

// En un 400 de validación muestra el primer mensaje por campo (como AuthFacade); 503/504 de imágenes con texto propio
function toFriendly(err: ApiError): ApiError {
  const firstFieldError = Object.values(err.errors ?? {}).flat()[0];
  let message = firstFieldError ?? err.message;
  if (err.status === 503) message = IMAGE_SERVICE_UNAVAILABLE;
  if (err.status === 504)
    message = 'La subida tardó demasiado. Revisa tu conexión e intenta de nuevo.';
  return { ...err, message };
}
