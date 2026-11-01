// FB-Sprint4 29/10/2026: Servicio HTTP para crear la orden del alumno (sp_crear_orden).
import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { environment }        from '../../environments/environment';
import { Observable }         from 'rxjs';
import { CrearOrdenRequest }  from '../models/menu.model';

export interface CrearOrdenResponse {
  idOrden: string;
}

@Injectable({ providedIn: 'root' })
export class OrdenService {
  private readonly http = inject(HttpClient);

  // FB-Sprint4 01/11/2026: el back responde 201 con { idOrden } (salida de sp_crear_orden)
  crearOrden(request: CrearOrdenRequest): Observable<CrearOrdenResponse> {
    return this.http.post<CrearOrdenResponse>(`${environment.apiUrl}/ordenes`, request);
  }
}
