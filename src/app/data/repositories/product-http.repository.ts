import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '@core/http/api-client.service';
import { ProductRepository } from '@domain/repositories/product.repository';
import { PagedResult, Product } from '@domain/models/product.model';
import { PagedResponseDto, ProductDto } from '@data/dtos/product.dto';
import { ProductMapper } from '@data/mappers/product.mapper';

@Injectable()
export class ProductHttpRepository extends ProductRepository {
  private readonly api = inject(ApiClient);

  getAll(page: number, pageSize: number): Observable<PagedResult<Product>> {
    return this.api
      .get<PagedResponseDto<ProductDto>>('productos', { pagina: page, tamanoPagina: pageSize })
      .pipe(map(ProductMapper.toPaged));
  }

  getById(id: string): Observable<Product> {
    return this.api
      .get<ProductDto>(`productos/${encodeURIComponent(id)}`)
      .pipe(map(ProductMapper.toDomain));
  }
}
