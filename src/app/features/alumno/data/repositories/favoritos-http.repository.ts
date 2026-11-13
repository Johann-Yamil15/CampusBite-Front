import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '@core/http/api-client.service';
import { FavoritosRepository } from '@features/alumno/domain/repositories/favoritos.repository';
import {
  CafeteriaFavorita,
  PlatilloFavorito,
} from '@features/alumno/domain/models/favorito.model';
import {
  FavoritoCafeteriaDto,
  FavoritoPlatilloDto,
} from '@features/alumno/data/dtos/alumno.dto';
import { FavoritosMapper } from '@features/alumno/data/mappers/favoritos.mapper';

/**
 * CL-Sprint5 11/11/2026: `api/favoritos/cafeterias` y (etapa 7) `api/favoritos/platillos`. PUT y DELETE son
 * idempotentes (200 con el objeto | 204); 404 si la cafetería o el producto no existe.
 * CL-Sprint5 13/11/2026: conectado al back (AlumnosController, PR #38).
 */
@Injectable()
export class FavoritosHttpRepository extends FavoritosRepository {
  private readonly api = inject(ApiClient);

  listarCafeterias(): Observable<CafeteriaFavorita[]> {
    return this.api
      .get<FavoritoCafeteriaDto[]>('favoritos/cafeterias')
      .pipe(map((dtos) => dtos.map(FavoritosMapper.toCafeteria)));
  }

  agregarCafeteria(idCafeteria: string): Observable<CafeteriaFavorita> {
    return this.api
      .put<FavoritoCafeteriaDto>(`favoritos/cafeterias/${idCafeteria}`, {})
      .pipe(map(FavoritosMapper.toCafeteria));
  }

  quitarCafeteria(idCafeteria: string): Observable<void> {
    return this.api.delete<void>(`favoritos/cafeterias/${idCafeteria}`);
  }

  listarPlatillos(): Observable<PlatilloFavorito[]> {
    return this.api
      .get<FavoritoPlatilloDto[]>('favoritos/platillos')
      .pipe(map((dtos) => dtos.map(FavoritosMapper.toPlatillo)));
  }

  agregarPlatillo(idProducto: string): Observable<PlatilloFavorito> {
    return this.api
      .put<FavoritoPlatilloDto>(`favoritos/platillos/${idProducto}`, {})
      .pipe(map(FavoritosMapper.toPlatillo));
  }

  quitarPlatillo(idProducto: string): Observable<void> {
    return this.api.delete<void>(`favoritos/platillos/${idProducto}`);
  }
}
