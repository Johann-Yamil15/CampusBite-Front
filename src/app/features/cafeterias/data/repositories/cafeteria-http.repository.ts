import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '@core/http/api-client.service';
import { CafeteriaRepository } from '@features/cafeterias/domain/repositories/cafeteria.repository';
import { Cafeteria, CafeteriaData } from '@features/cafeterias/domain/models/cafeteria.model';
import { CafeteriaDto } from '@features/cafeterias/data/dtos/cafeteria.dto';
import { CafeteriaMapper } from '@features/cafeterias/data/mappers/cafeteria.mapper';

@Injectable()
export class CafeteriaHttpRepository extends CafeteriaRepository {
  private readonly api = inject(ApiClient);

  list(includeInactive: boolean): Observable<Cafeteria[]> {
    // Sin el parámetro el backend devuelve solo las activas; así la URL queda limpia para los alumnos
    const params = includeInactive ? { incluirInactivas: true } : undefined;
    return this.api
      .get<CafeteriaDto[]>('cafeterias', params)
      .pipe(map((dtos) => dtos.map(CafeteriaMapper.toDomain)));
  }

  getById(id: string): Observable<Cafeteria> {
    return this.api.get<CafeteriaDto>(this.path(id)).pipe(map(CafeteriaMapper.toDomain));
  }

  create(data: CafeteriaData): Observable<Cafeteria> {
    return this.api
      .post<CafeteriaDto>('cafeterias', CafeteriaMapper.toRequest(data))
      .pipe(map(CafeteriaMapper.toDomain));
  }

  update(id: string, data: CafeteriaData): Observable<Cafeteria> {
    return this.api
      .put<CafeteriaDto>(this.path(id), CafeteriaMapper.toRequest(data))
      .pipe(map(CafeteriaMapper.toDomain));
  }

  deactivate(id: string): Observable<void> {
    return this.api.delete<void>(this.path(id));
  }

  reactivate(id: string): Observable<void> {
    return this.api.post<void>(`${this.path(id)}/reactivar`, null);
  }

  private path(id: string): string {
    return `cafeterias/${encodeURIComponent(id)}`;
  }
}
