import { Observable } from 'rxjs';
import {
  DiaHorario,
  HorarioNegocio,
  PromocionNegocio,
} from '@features/menu-negocio/domain/models/negocio.model';

/**
 * CL-Sprint5 11/11/2026 (etapa 9): horario y promociones del negocio. Se enlaza en negocio.providers.ts con
 * NegocioHttpRepository (CL-Sprint5 13/11/2026).
 *
 * Errores (ApiError): 400 datos inválidos (con `detail` en español), 403 no es su cafetería, 404 no existe.
 */
export abstract class NegocioRepository {
  abstract horario(idCafeteria: string): Observable<HorarioNegocio>;
  abstract guardarHorario(idCafeteria: string, dias: DiaHorario[]): Observable<HorarioNegocio>;
  /** Cierra solo por hoy: mañana vuelve a abrir con su horario. */
  abstract cerrarHoy(idCafeteria: string): Observable<HorarioNegocio>;
  abstract reabrir(idCafeteria: string): Observable<HorarioNegocio>;

  abstract promociones(idCafeteria: string): Observable<PromocionNegocio[]>;
  /** Crea (id vacío) o actualiza. Responde la guardada. */
  abstract guardarPromocion(idCafeteria: string, promo: PromocionNegocio): Observable<PromocionNegocio>;
  abstract eliminarPromocion(idCafeteria: string, idPromocion: string): Observable<void>;
}
