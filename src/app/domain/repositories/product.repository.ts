import { Observable } from 'rxjs';
import { PagedResult, Product } from '@domain/models/product.model';

export abstract class ProductRepository {
  abstract getAll(page: number, pageSize: number): Observable<PagedResult<Product>>;
  abstract getById(id: string): Observable<Product>;
}
