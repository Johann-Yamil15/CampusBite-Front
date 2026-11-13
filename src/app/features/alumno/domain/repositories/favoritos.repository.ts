import { Observable } from 'rxjs';
import {
  CafeteriaFavorita,
  PlatilloFavorito,
} from '@features/alumno/domain/models/favorito.model';

/**
 * CL-Sprint5 11/11/2026: contrato de los favoritos del alumno. Se enlaza en alumno.providers.ts con
 * FavoritosHttpRepository (CL-Sprint5 13/11/2026).
 * CL-Sprint5 11/11/2026 (etapa 7): también platillos. Agregar y quitar son idempotentes.
 *
 * Errores (ApiError): 401 sin sesión, 404 la cafetería o el producto no existe.
 */
export abstract class FavoritosRepository {
  /** Más recientes primero. */
  abstract listarCafeterias(): Observable<CafeteriaFavorita[]>;
  /** Idempotente: agregar una que ya está no falla. Responde la favorita completa. */
  abstract agregarCafeteria(idCafeteria: string): Observable<CafeteriaFavorita>;
  /** Idempotente: quitar una que no está no falla. */
  abstract quitarCafeteria(idCafeteria: string): Observable<void>;

  /** Más recientes primero. Incluye los que ya no están en el menú (`disponible: false`). */
  abstract listarPlatillos(): Observable<PlatilloFavorito[]>;
  /** Idempotente. Solo se puede guardar un producto que está en el menú. */
  abstract agregarPlatillo(idProducto: string): Observable<PlatilloFavorito>;
  /** Idempotente. */
  abstract quitarPlatillo(idProducto: string): Observable<void>;
}
