import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '@core/http/api-client.service';
import { OrdenesRepository } from '@features/ordenes/domain/repositories/ordenes.repository';
import {
  EstadoAvanceCafeteria,
  NuevaOrden,
  Orden,
  ReporteProblema,
  ReporteRecibido,
} from '@features/ordenes/domain/models/orden.model';
import { OrdenDto, PaginaDto } from '@features/ordenes/data/dtos/orden.dto';
import { OrdenMapper } from '@features/ordenes/data/mappers/orden.mapper';

/** sp_mis_ordenes devuelve hasta 100 por página. */
export const TAMANO_PAGINA_MIS_ORDENES = 50;

/**
 * CL-Sprint5 11/11/2026: `api/ordenes` y `api/cafeterias/{id}/ordenes`. Reemplaza a OrdenService de
 * shared/menu (FB-Sprint4). Las rutas son las propuestas en BACKEND_SPECIFICATION.md; el controller aún no
 * existe, por eso ordenes.providers.ts enlaza el mock.
 */
@Injectable()
export class OrdenesHttpRepository extends OrdenesRepository {
  private readonly api = inject(ApiClient);

  crear(nueva: NuevaOrden): Observable<Orden> {
    return this.api
      .post<OrdenDto>('ordenes', OrdenMapper.toCrearRequest(nueva))
      .pipe(map(OrdenMapper.toDomain));
  }

  misOrdenes(): Observable<Orden[]> {
    return this.api
      .get<PaginaDto<OrdenDto>>('ordenes/mias', {
        pagina: 1,
        tamanoPagina: TAMANO_PAGINA_MIS_ORDENES,
      })
      .pipe(map((pagina) => pagina.items.map(OrdenMapper.toDomain)));
  }

  obtener(idOrden: string): Observable<Orden> {
    return this.api.get<OrdenDto>(`ordenes/${idOrden}`).pipe(map(OrdenMapper.toDomain));
  }

  cancelar(idOrden: string): Observable<Orden> {
    return this.api
      .post<OrdenDto>(`ordenes/${idOrden}/cancelar`, {})
      .pipe(map(OrdenMapper.toDomain));
  }

  /** CL-Sprint5 11/11/2026 (etapa 6): endpoint nuevo, propuesto en BACKEND_SPECIFICATION.md. */
  reportar(idOrden: string, reporte: ReporteProblema): Observable<ReporteRecibido> {
    return this.api.post<ReporteRecibido>(`ordenes/${idOrden}/reportes`, {
      motivo: reporte.motivo,
      detalle: reporte.detalle.trim() || null,
    });
  }

  ordenesCafeteria(idCafeteria: string): Observable<Orden[]> {
    return this.api
      .get<OrdenDto[]>(`cafeterias/${idCafeteria}/ordenes`)
      .pipe(map((dtos) => dtos.map(OrdenMapper.toDomain)));
  }

  cambiarEstado(idOrden: string, estado: EstadoAvanceCafeteria): Observable<Orden> {
    return this.api
      .patch<OrdenDto>(`ordenes/${idOrden}/estado`, { estado: OrdenMapper.toEstadoDto(estado) })
      .pipe(map(OrdenMapper.toDomain));
  }

  entregar(idOrden: string, codigoRecogida: string): Observable<Orden> {
    return this.api
      .post<OrdenDto>(`ordenes/${idOrden}/entregar`, { codigoRecogida })
      .pipe(map(OrdenMapper.toDomain));
  }

  /** CL-Sprint5 11/11/2026 (etapa 9): endpoint nuevo (llama a sp_confirmar_pago). */
  confirmarPago(idOrden: string): Observable<Orden> {
    return this.api
      .post<OrdenDto>(`ordenes/${idOrden}/confirmar-pago`, {})
      .pipe(map(OrdenMapper.toDomain));
  }

  rechazar(idOrden: string, motivo: string): Observable<Orden> {
    return this.api
      .post<OrdenDto>(`ordenes/${idOrden}/rechazar`, { motivo })
      .pipe(map(OrdenMapper.toDomain));
  }
}
