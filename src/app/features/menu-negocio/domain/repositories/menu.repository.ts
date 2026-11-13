import { Observable } from 'rxjs';
import {
  Category,
  MenuProduct,
  ProductData,
} from '@features/menu-negocio/domain/models/menu.model';

/**
 * CL-Sprint4 28/10/2026: HU-07B. Contrato (puerto) del menú de una cafetería. La capa data provee la
 * implementación y se enlaza en menu-negocio.routes.ts → { provide: MenuRepository, useClass: MenuHttpRepository }.
 */
export abstract class MenuRepository {
  abstract listProducts(cafeteriaId: string): Observable<MenuProduct[]>;
  abstract listCategories(cafeteriaId: string): Observable<Category[]>;
  /** `image` es opcional; si viene, el backend la sube en la misma petición. */
  abstract createProduct(
    cafeteriaId: string,
    data: ProductData,
    image: File | null,
  ): Observable<MenuProduct>;
  abstract updateProduct(
    cafeteriaId: string,
    productId: string,
    data: ProductData,
  ): Observable<void>;
  abstract setAvailable(
    cafeteriaId: string,
    productId: string,
    available: boolean,
  ): Observable<void>;
  abstract deleteProduct(cafeteriaId: string, productId: string): Observable<void>;
  /** @returns La URL pública de la imagen nueva. */
  abstract uploadImage(cafeteriaId: string, productId: string, image: File): Observable<string>;
}
