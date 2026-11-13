/**
 * CL-Sprint5 11/11/2026: contrato propuesto de GET api/menu y GET api/menu/{idCafeteria} (salida de
 * sp_menu_cafeteria en camelCase, enums como texto como el resto de la API). El endpoint aún no existe:
 * queda documentado en BACKEND_SPECIFICATION.md. Ajustar aquí si el back lo publica distinto.
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
  // CL-Sprint5 11/11/2026: campos propuestos para la etapa 3 (opcionales hasta que el back los mande)
  calificacion?: number | null;
  minutosPreparacion?: number | null;
  precioAnterior?: number | null;
  popular?: boolean;
  /** CL-Sprint5 11/11/2026 (etapa 4): enum Dieta del back (propuesto). */
  dietas?: DietaDto[];
}

export type DietaDto = 'Vegetariano' | 'SinGluten';

export interface MenuCafeteriaDto {
  idCafeteria: string;
  cafeteria: string;
  esDelCampus: boolean;
  puntoEntrega: string;
  metodosPago: MetodoPagoDto[];
  productos: ProductoMenuDto[];
  // CL-Sprint5 11/11/2026: campos propuestos para la etapa 3 (opcionales hasta que el back los mande)
  logoUrl?: string | null;
  portadaUrl?: string | null;
  calificacion?: number | null;
  resenas?: number | null;
  abierta?: boolean;
  cierraA?: string | null;
  minutosEstimados?: number | null;
}

/** CL-Sprint5 11/11/2026: elemento de GET api/promociones/activas (propuesto). */
export interface PromocionDto {
  idPromocion: string;
  etiqueta: string;
  titulo: string;
  subtitulo: string;
  imagenUrl: string | null;
  idCafeteria: string | null;
  categoria: string | null;
}
