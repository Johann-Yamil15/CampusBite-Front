import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '@core/http/api-client.service';
import { NegocioRepository } from '@features/menu-negocio/domain/repositories/negocio.repository';
import {
  DiaHorario,
  HorarioNegocio,
  PromocionNegocio,
} from '@features/menu-negocio/domain/models/negocio.model';

/**
 * CL-Sprint5 11/11/2026 (etapa 9): `api/cafeterias/{id}/horario` y `api/cafeterias/{id}/promociones`
 * (propuestos en BACKEND_SPECIFICATION.md; aún no existen). Las respuestas ya vienen con la forma del dominio.
 */
@Injectable()
export class NegocioHttpRepository extends NegocioRepository {
  private readonly api = inject(ApiClient);

  horario(idCafeteria: string): Observable<HorarioNegocio> {
    return this.api.get<HorarioNegocio>(`cafeterias/${idCafeteria}/horario`);
  }

  guardarHorario(idCafeteria: string, dias: DiaHorario[]): Observable<HorarioNegocio> {
    return this.api.put<HorarioNegocio>(`cafeterias/${idCafeteria}/horario`, { dias });
  }

  cerrarHoy(idCafeteria: string): Observable<HorarioNegocio> {
    return this.api.post<HorarioNegocio>(`cafeterias/${idCafeteria}/horario/cierre-hoy`, {});
  }

  reabrir(idCafeteria: string): Observable<HorarioNegocio> {
    return this.api.delete<HorarioNegocio>(`cafeterias/${idCafeteria}/horario/cierre-hoy`);
  }

  promociones(idCafeteria: string): Observable<PromocionNegocio[]> {
    return this.api.get<PromocionNegocio[]>(`cafeterias/${idCafeteria}/promociones`);
  }

  guardarPromocion(idCafeteria: string, promo: PromocionNegocio): Observable<PromocionNegocio> {
    const { id, ...cuerpo } = promo;
    return id
      ? this.api.put<PromocionNegocio>(`cafeterias/${idCafeteria}/promociones/${id}`, cuerpo)
      : this.api.post<PromocionNegocio>(`cafeterias/${idCafeteria}/promociones`, cuerpo);
  }

  eliminarPromocion(idCafeteria: string, idPromocion: string): Observable<void> {
    return this.api.delete<void>(`cafeterias/${idCafeteria}/promociones/${idPromocion}`);
  }
}
