/**
 * CL-Sprint3 20/10/2026: forma EXACTA del contrato de `api/cafeterias` del backend .NET (System.Text.Json → camelCase,
 * enums como texto). Fuente: CampusBite-Back/src/CampusBite.Application/Cafeterias/Dtos y
 * src/CampusBite.Api/Cafeterias/CafeteriasController.cs (TEC-08). Ajustar si cambia el API.
 */

/** Enum `MetodoPago` del backend. No acepta números. */
export type MetodoPagoDto = 'Tarjeta' | 'Transferencia' | 'Efectivo';

/** Respuesta de `GET api/cafeterias` (arreglo), `GET api/cafeterias/{id}`, `POST` (201) y `PUT` (200). */
export interface CafeteriaDto {
  /** GUID. */
  idCafeteria: string;
  nombre: string;
  ubicacion: string;
  esDelCampus: boolean;
  puntoEntrega: string;
  activa: boolean;
  /** Sin repetidos, ordenados Tarjeta → Transferencia → Efectivo. */
  metodosPago: MetodoPagoDto[];
  /** Fecha ISO-8601 con zona. */
  creadoEn: string;
  /** Fecha ISO-8601 con zona. */
  actualizadoEn: string;
}

/** Body de `POST api/cafeterias` y `PUT api/cafeterias/{id}`. Validaciones del backend entre paréntesis. */
export interface GuardarCafeteriaRequestDto {
  /** Requerido (2–100 caracteres, sin contar espacios de los extremos). Único sin distinguir mayúsculas. */
  nombre: string;
  /** Requerido (máx. 150). */
  ubicacion: string;
  /** Requerido (no puede omitirse). */
  esDelCampus: boolean;
  /** Requerido (máx. 100). */
  puntoEntrega: string;
  /** Requerido, al menos uno. */
  metodosPago: MetodoPagoDto[];
}
