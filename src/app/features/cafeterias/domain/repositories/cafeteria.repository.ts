import { Observable } from 'rxjs';
import { Cafeteria, CafeteriaData } from '@features/cafeterias/domain/models/cafeteria.model';

/**
 * CL-Sprint3 20/10/2026: contrato (puerto) de cafeterías. La capa data provee la implementación
 * y se enlaza en cafeterias.providers.ts → { provide: CafeteriaRepository, useClass: CafeteriaHttpRepository }.
 */
export abstract class CafeteriaRepository {
  abstract list(includeInactive: boolean): Observable<Cafeteria[]>;
  abstract getById(id: string): Observable<Cafeteria>;
  abstract create(data: CafeteriaData): Observable<Cafeteria>;
  abstract update(id: string, data: CafeteriaData): Observable<Cafeteria>;
  abstract deactivate(id: string): Observable<void>;
  abstract reactivate(id: string): Observable<void>;
}
