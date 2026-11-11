import { Observable } from 'rxjs';
import { MenuCafeteria } from '@features/catalogo/domain/models/catalogo.model';

/**
 * CL-Sprint5 11/11/2026: contrato (puerto) del catálogo del alumno. Se enlaza en catalogo.providers.ts:
 * hoy con CatalogoMockRepository porque el back aún no expone GET api/menu; cuando lo haga, solo se cambia
 * `useClass` por CatalogoHttpRepository.
 */
export abstract class CatalogoRepository {
  /** Menú de todas las cafeterías activas. */
  abstract listarMenu(): Observable<MenuCafeteria[]>;
  /** Menú de una cafetería activa. Falla con 404 si no existe o no está activa. */
  abstract menuCafeteria(idCafeteria: string): Observable<MenuCafeteria>;
}
