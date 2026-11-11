/**
 * CL-Sprint5 11/11/2026: contrato PROPUESTO de api/ordenes (aún no existe en el back). Sigue las convenciones
 * de la API actual: camelCase, nombres en español, enums como texto PascalCase (System.Text.Json con
 * JsonStringEnumConverter) y paginación { items, total, pagina, tamanoPagina }. Queda documentado en
 * BACKEND_SPECIFICATION.md; ajustar aquí si el back lo publica distinto.
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
  codigoRecogida: string;
  total: number;
  metodo: MetodoPagoDto;
  estadoPago: EstadoPagoDto;
  notas: string | null;
  lineas: LineaOrdenDto[];
}

export interface CrearOrdenRequestDto {
  idCafeteria: string;
  recogidaEn: string;
  metodo: MetodoPagoDto;
  items: { idProducto: string; cantidad: number }[];
  notas?: string;
}

export interface PaginaDto<T> {
  items: T[];
  total: number;
  pagina: number;
  tamanoPagina: number;
}
