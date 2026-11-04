import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable, expand, map, of, reduce, switchMap, throwError } from 'rxjs';
import { ApiClient } from '@core/http/api-client.service';
import { ApiError } from '@core/http/api-error';
import { CafeteriaRepository } from '@features/cafeterias/domain/repositories/cafeteria.repository';
import { Cafeteria, CafeteriaData } from '@features/cafeterias/domain/models/cafeteria.model';
import {
  CafeteriaDto,
  ListaCafeteriasDto,
  PaginaDto,
} from '@features/cafeterias/data/dtos/cafeteria.dto';
import { CafeteriaMapper } from '@features/cafeterias/data/mappers/cafeteria.mapper';

/** Cafeterías por página al listar: el máximo que acepta el backend paginado. */
export const TAMANO_PAGINA_CAFETERIAS = 100;

/** Límite de seguridad al recorrer páginas, por si el backend responde mal (p. ej. un `total` que nunca se alcanza). */
export const MAX_PAGINAS_CAFETERIAS = 50;

/** Una página ya leída y validada, y la siguiente que hay que pedir (`null` = no hay más). */
interface PaginaLeida {
  items: CafeteriaDto[];
  /** Cafeterías recibidas hasta esta página, incluida. */
  vistas: number;
  siguiente: number | null;
}

@Injectable()
export class CafeteriaHttpRepository extends CafeteriaRepository {
  private readonly api = inject(ApiClient);

  /**
   * CL-Sprint4 04/11/2026: HU-06B. Devuelve TODAS las cafeterías, recorriendo las páginas en orden.
   * Compatibilidad con GET /api/cafeterias en arreglo (Sprint4) y paginado (rama de Joseph).
   * Cuando todo el backend esté paginado, quitar el caso de arreglo.
   * - Arreglo (Sprint4): ignora `pagina`/`tamanoPagina` y responde todas de una vez.
   * - Paginado: `{ items, total, pagina, tamanoPagina }`; se piden las páginas 2…N mientras falten.
   * Falla con `ApiError` (mensaje en español) si la respuesta no es ni arreglo ni página, o si se pasa
   * de `MAX_PAGINAS_CAFETERIAS` páginas.
   */
  list(includeInactive: boolean): Observable<Cafeteria[]> {
    return this.listPage(includeInactive, 1, 0).pipe(
      expand(
        (page) =>
          page.siguiente ? this.listPage(includeInactive, page.siguiente, page.vistas) : EMPTY,
        1,
      ),
      // Si se da de alta una cafetería mientras se recorren las páginas, otra puede repetirse en la siguiente
      reduce((all, page) => mergeById(all, page.items), [] as CafeteriaDto[]),
      map((dtos) => dtos.map(CafeteriaMapper.toDomain)),
    );
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

  private listPage(includeInactive: boolean, pagina: number, vistasAntes: number): Observable<PaginaLeida> {
    // incluirInactivas solo si se pide: sin él el backend devuelve solo las activas
    const params: Record<string, number | boolean> = { pagina, tamanoPagina: TAMANO_PAGINA_CAFETERIAS };
    if (includeInactive) params['incluirInactivas'] = true;
    return this.api.get<ListaCafeteriasDto>('cafeterias', params).pipe(
      switchMap((body: unknown) => {
        const read = readPage(body, pagina, vistasAntes);
        return typeof read === 'string' ? throwError(() => unexpectedResponse(read)) : of(read);
      }),
    );
  }
}

/**
 * Normaliza la respuesta de `GET api/cafeterias` (arreglo o página).
 * @returns La página leída, o el motivo (texto) por el que no se pudo leer.
 */
function readPage(body: unknown, pagina: number, vistasAntes: number): PaginaLeida | string {
  // TODO(paginado): quitar este caso cuando todo el backend esté paginado
  if (Array.isArray(body)) return { items: body as CafeteriaDto[], vistas: body.length, siguiente: null };

  if (!isPage(body)) return 'la respuesta no es una lista ni una página de cafeterías';

  // Se cuenta lo recibido (no pagina × tamaño) por si el backend usa otro tamaño de página
  const vistas = vistasAntes + body.items.length;
  // Una página vacía también corta: evita pedir sin fin si `total` no cuadra
  if (body.items.length === 0 || vistas >= body.total) return { items: body.items, vistas, siguiente: null };
  if (pagina >= MAX_PAGINAS_CAFETERIAS) {
    return `se superó el límite de ${MAX_PAGINAS_CAFETERIAS} páginas`;
  }
  return { items: body.items, vistas, siguiente: pagina + 1 };
}

function isPage(body: unknown): body is PaginaDto<CafeteriaDto> {
  if (typeof body !== 'object' || body === null) return false;
  const page = body as Partial<PaginaDto<unknown>>;
  return Array.isArray(page.items) && Number.isInteger(page.total) && (page.total ?? -1) >= 0;
}

/** `status` 200: la petición sí respondió bien, pero con un cuerpo que el front no entiende. */
function unexpectedResponse(reason: string): ApiError {
  return {
    status: 200,
    message: `No se pudo leer la lista de cafeterías: ${reason}. Intenta de nuevo o avisa al equipo.`,
  };
}

function mergeById(all: CafeteriaDto[], next: CafeteriaDto[]): CafeteriaDto[] {
  const ids = new Set(all.map((c) => c.idCafeteria));
  return all.concat(next.filter((c) => !ids.has(c.idCafeteria)));
}
