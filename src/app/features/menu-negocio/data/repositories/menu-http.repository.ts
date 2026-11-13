import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '@core/http/api-client.service';
import { MenuRepository } from '@features/menu-negocio/domain/repositories/menu.repository';
import {
  Category,
  MenuProduct,
  ProductData,
} from '@features/menu-negocio/domain/models/menu.model';
import {
  CategoriaDto,
  ImagenProductoDto,
  ProductoDto,
} from '@features/menu-negocio/data/dtos/menu.dto';
import { MenuMapper } from '@features/menu-negocio/data/mappers/menu.mapper';

/** CL-Sprint4 28/10/2026: HU-07B. `api/cafeterias/{idCafeteria}/productos` y `.../categorias` (TEC-09/TEC-10). */
@Injectable()
export class MenuHttpRepository extends MenuRepository {
  private readonly api = inject(ApiClient);

  listProducts(cafeteriaId: string): Observable<MenuProduct[]> {
    return this.api
      .get<ProductoDto[]>(this.products(cafeteriaId))
      .pipe(map((dtos) => dtos.map(MenuMapper.toDomain)));
  }

  listCategories(cafeteriaId: string): Observable<Category[]> {
    return this.api
      .get<CategoriaDto[]>(`${this.cafeteria(cafeteriaId)}/categorias`)
      .pipe(map((dtos) => dtos.map(MenuMapper.toCategory)));
  }

  createProduct(
    cafeteriaId: string,
    data: ProductData,
    image: File | null,
  ): Observable<MenuProduct> {
    // Con FormData, HttpClient pone él solo el Content-Type multipart con su boundary
    return this.api
      .post<ProductoDto>(this.products(cafeteriaId), MenuMapper.toCreateFormData(data, image))
      .pipe(map(MenuMapper.toDomain));
  }

  updateProduct(cafeteriaId: string, productId: string, data: ProductData): Observable<void> {
    return this.api.put<void>(this.product(cafeteriaId, productId), MenuMapper.toRequest(data));
  }

  setAvailable(cafeteriaId: string, productId: string, available: boolean): Observable<void> {
    // El backend espera el booleano crudo como JSON (`true` / `false`)
    return this.api.patch<void>(`${this.product(cafeteriaId, productId)}/disponible`, available);
  }

  deleteProduct(cafeteriaId: string, productId: string): Observable<void> {
    return this.api.delete<void>(this.product(cafeteriaId, productId));
  }

  uploadImage(cafeteriaId: string, productId: string, image: File): Observable<string> {
    const form = new FormData();
    form.append('archivo', image, image.name);
    return this.api
      .post<ImagenProductoDto>(`${this.product(cafeteriaId, productId)}/imagen`, form)
      .pipe(map((dto) => dto.imagenUrl));
  }

  private cafeteria(cafeteriaId: string): string {
    return `cafeterias/${encodeURIComponent(cafeteriaId)}`;
  }

  private products(cafeteriaId: string): string {
    return `${this.cafeteria(cafeteriaId)}/productos`;
  }

  private product(cafeteriaId: string, productId: string): string {
    return `${this.products(cafeteriaId)}/${encodeURIComponent(productId)}`;
  }
}
