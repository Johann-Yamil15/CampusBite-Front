import { Observable } from 'rxjs';
import { CafeteriaFavorita } from '@features/alumno/domain/models/favorito.model';

/**
 * CL-Sprint5 11/11/2026: contrato de los favoritos del alumno. No hay tabla ni endpoint todavía (ver
 * BACKEND_SPECIFICATION.md); se enlaza en alumno.routes.ts con el mock.
 */
export abstract class FavoritosRepository {
  abstract listarCafeterias(): Observable<CafeteriaFavorita[]>;
  /** Idempotente: agregar una que ya está no falla. Responde la favorita completa. */
  abstract agregarCafeteria(idCafeteria: string): Observable<CafeteriaFavorita>;
  /** Idempotente: quitar una que no está no falla. */
  abstract quitarCafeteria(idCafeteria: string): Observable<void>;
}
