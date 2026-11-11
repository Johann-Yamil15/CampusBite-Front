import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '@core/http/api-client.service';
import { FavoritosRepository } from '@features/alumno/domain/repositories/favoritos.repository';
import { CafeteriaFavorita } from '@features/alumno/domain/models/favorito.model';

/**
 * CL-Sprint5 11/11/2026: `api/favoritos/cafeterias` (propuesto en BACKEND_SPECIFICATION.md; aún no existe).
 * La respuesta ya viene con la forma del dominio, por eso no hay mapper.
 */
@Injectable()
export class FavoritosHttpRepository extends FavoritosRepository {
  private readonly api = inject(ApiClient);

  listarCafeterias(): Observable<CafeteriaFavorita[]> {
    return this.api.get<CafeteriaFavorita[]>('favoritos/cafeterias');
  }

  agregarCafeteria(idCafeteria: string): Observable<CafeteriaFavorita> {
    return this.api.put<CafeteriaFavorita>(`favoritos/cafeterias/${idCafeteria}`, {});
  }

  quitarCafeteria(idCafeteria: string): Observable<void> {
    return this.api.delete<void>(`favoritos/cafeterias/${idCafeteria}`);
  }
}
