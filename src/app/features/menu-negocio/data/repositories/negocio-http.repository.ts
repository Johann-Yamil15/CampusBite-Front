import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '@core/http/api-client.service';
import { NegocioRepository } from '@features/menu-negocio/domain/repositories/negocio.repository';
import {
  DiaHorario,
  HorarioNegocio,
  PromocionNegocio,
} from '@features/menu-negocio/domain/models/negocio.model';
import { HorarioDto, PromocionNegocioDto } from '@features/menu-negocio/data/dtos/negocio.dto';
import { NegocioMapper } from '@features/menu-negocio/data/mappers/negocio.mapper';

/**
 * CL-Sprint5 11/11/2026 (etapa 9): `api/cafeterias/{id}/horario` y `api/cafeterias/{id}/promociones`.
 * CL-Sprint5 13/11/2026: conectado al back (NegocioController, PR #38).
 */
@Injectable()
export class NegocioHttpRepository extends NegocioRepository {
  private readonly api = inject(ApiClient);

  horario(idCafeteria: string): Observable<HorarioNegocio> {
    return this.api
      .get<HorarioDto>(`cafeterias/${idCafeteria}/horario`)
      .pipe(map(NegocioMapper.toHorario));
  }

  guardarHorario(idCafeteria: string, dias: DiaHorario[]): Observable<HorarioNegocio> {
    return this.api
      .put<HorarioDto>(`cafeterias/${idCafeteria}/horario`, { dias })
      .pipe(map(NegocioMapper.toHorario));
  }

  cerrarHoy(idCafeteria: string): Observable<HorarioNegocio> {
    return this.api
      .post<HorarioDto>(`cafeterias/${idCafeteria}/horario/cierre-hoy`, {})
      .pipe(map(NegocioMapper.toHorario));
  }

  reabrir(idCafeteria: string): Observable<HorarioNegocio> {
    return this.api
      .delete<HorarioDto>(`cafeterias/${idCafeteria}/horario/cierre-hoy`)
      .pipe(map(NegocioMapper.toHorario));
  }

  promociones(idCafeteria: string): Observable<PromocionNegocio[]> {
    return this.api
      .get<PromocionNegocioDto[]>(`cafeterias/${idCafeteria}/promociones`)
      .pipe(map((dtos) => dtos.map(NegocioMapper.toPromocion)));
  }

  guardarPromocion(idCafeteria: string, promo: PromocionNegocio): Observable<PromocionNegocio> {
    const cuerpo = NegocioMapper.toGuardarRequest(promo);
    const peticion = promo.id
      ? this.api.put<PromocionNegocioDto>(`cafeterias/${idCafeteria}/promociones/${promo.id}`, cuerpo)
      : this.api.post<PromocionNegocioDto>(`cafeterias/${idCafeteria}/promociones`, cuerpo);
    return peticion.pipe(map(NegocioMapper.toPromocion));
  }

  eliminarPromocion(idCafeteria: string, idPromocion: string): Observable<void> {
    return this.api.delete<void>(`cafeterias/${idCafeteria}/promociones/${idPromocion}`);
  }
}
