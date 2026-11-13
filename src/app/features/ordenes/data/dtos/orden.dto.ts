/**
 * CL-Sprint5 11/11/2026: contrato de api/ordenes. Sigue las convenciones de la API: camelCase, nombres en
 * español, enums como texto PascalCase (System.Text.Json con JsonStringEnumConverter) y paginación
 * { items, total, pagina, tamanoPagina }.
 * CL-Sprint5 13/11/2026: verificado contra OrdenDtos.cs del back (PR #38).
 */

export type EstadoOrdenDto =
  | 'Pendiente'
  | 'Confirmada'
  | 'EnPreparacion'
  | 'Lista'
  | 'Entregada'
  | 'Cancelada';

export type MetodoPagoDto = 'Tarjeta' | 'Transferencia' | 'Efectivo';

export type EstadoPagoDto = 'Pendiente' | 'Pagado' | 'Rechazado' | 'Reembolsado' | 'Cancelado';

export interface LineaOrdenDto {
  idProducto: string;
  producto: string;
  cantidad: number;
  precioUnitario: number;
  imagenUrl: string | null;
}

export interface OrdenDto {
  idOrden: string;
  idCafeteria: string;
  cafeteria: string;
  logoCafeteria: string | null;
  puntoEntrega: string;
  /** Solo en las respuestas para la cafetería. */
  alumno: { nombre: string; matricula: string | null } | null;
  estado: EstadoOrdenDto;
  recogidaEn: string;
  creadoEn: string;
  /** CL-Sprint5 13/11/2026: solo le llega al alumno dueño; la cafetería lo recibe en null (lo teclea). */
  codigoRecogida: string | null;
  total: number;
  metodo: MetodoPagoDto;
  estadoPago: EstadoPagoDto;
  notas: string | null;
  /** CL-Sprint5 11/11/2026 (etapa 9): null si no se canceló. */
  motivoCancelacion: string | null;
  lineas: LineaOrdenDto[];
}

export interface CrearOrdenRequestDto {
  idCafeteria: string;
  recogidaEn: string;
  metodo: MetodoPagoDto;
  items: { idProducto: string; cantidad: number }[];
  notas?: string;
}

/** CL-Sprint5 13/11/2026: enum MotivoReporte del back. */
export type MotivoReporteDto = 'FaltoArticulo' | 'ProductoEquivocado' | 'Calidad' | 'Cobro' | 'Otro';

/** Body de POST api/ordenes/{id}/reportes. `detalle` es obligatorio (≥ 10) solo con Otro. */
export interface CrearReporteRequestDto {
  motivo: MotivoReporteDto;
  detalle: string | null;
}

export interface PaginaDto<T> {
  items: T[];
  total: number;
  pagina: number;
  tamanoPagina: number;
}
