// FB-Sprint4 29/10/2026: Servicio HTTP para crear la orden del alumno (sp_crear_orden).
// JY-Sprint4 05/11/2026: pasa por ApiClient (ver menu.ts).
// shortcut: POST api/ordenes todavía no existe en el back (sp_crear_orden está en la BD sin controller);
// confirmar la orden responderá 404 hasta que se levante OrdenesController.
import { Injectable, inject } from '@angular/core';
import { Observable }         from 'rxjs';
import { ApiClient }          from '@core/http/api-client.service';
import { CrearOrdenRequest }  from './menu.model';

export interface CrearOrdenResponse {
  idOrden: string;
}

@Injectable({ providedIn: 'root' })
export class OrdenService {
  private readonly api = inject(ApiClient);

  // FB-Sprint4 01/11/2026: el back responde 201 con { idOrden } (salida de sp_crear_orden)
  crearOrden(request: CrearOrdenRequest): Observable<CrearOrdenResponse> {
    return this.api.post<CrearOrdenResponse>('ordenes', request);
  }
}
