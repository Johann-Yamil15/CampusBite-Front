/**
 * CL-Sprint5 11/11/2026: contrato de GET api/menu y GET api/menu/{idCafeteria} (salida de
 * sp_menu_cafeteria en camelCase, enums como texto como el resto de la API).
 * CL-Sprint5 13/11/2026: verificado contra MenuCafeteriaDto/ProductoMenuDto del back (PR #38). Por ahora
 * llegan en null: logoUrl, portadaUrl, calificacion, resenas y precioAnterior.
 */

/** Enum `MetodoPago` del backend (igual que en cafeteria.dto.ts). */
export type MetodoPagoDto = 'Tarjeta' | 'Transferencia' | 'Efectivo';

export interface ProductoMenuDto {
  idProducto: string;
  producto: string;
  categoria: string | null;
  descripcion: string | null;
  precio: number;
  imagenUrl: string | null;
  calificacion: number | null;
  minutosPreparacion: number | null;
  precioAnterior: number | null;
  popular: boolean;
  /** Enum Dieta del back. */
  dietas: DietaDto[];
}

export type DietaDto = 'Vegetariano' | 'SinGluten';

export interface MenuCafeteriaDto {
  idCafeteria: string;
  cafeteria: string;
  esDelCampus: boolean;
  puntoEntrega: string;
  metodosPago: MetodoPagoDto[];
  productos: ProductoMenuDto[];
  logoUrl: string | null;
  portadaUrl: string | null;
  calificacion: number | null;
  resenas: number | null;
  /** Calculada por el back con el horario y el "cerrar por hoy". */
  abierta: boolean;
  /** HH:mm, o null si hoy no abre. */
  cierraA: string | null;
  minutosEstimados: number | null;
}

/** CL-Sprint5 11/11/2026: elemento de GET api/promociones/activas. */
export interface PromocionDto {
  idPromocion: string;
  etiqueta: string;
  titulo: string;
  subtitulo: string;
  imagenUrl: string | null;
  idCafeteria: string | null;
  categoria: string | null;
}
