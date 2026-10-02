import { Injectable, inject, signal } from '@angular/core';
import { ApiError } from '@core/http/api-error';
import { ProductRepository } from '@domain/repositories/product.repository';
import { Product } from '@domain/models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductFacade {
  private readonly repo = inject(ProductRepository);

  readonly products = signal<Product[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  load(page = 1, pageSize = 20): void {
    this.loading.set(true);
    this.error.set(null);

    this.repo.getAll(page, pageSize).subscribe({
      next: (result) => {
        this.products.set(result.items);
        this.total.set(result.total);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }
}
