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
}

export interface MenuCafeteriaDto {
  idCafeteria: string;
  cafeteria: string;
  esDelCampus: boolean;
  puntoEntrega: string;
  metodosPago: MetodoPagoDto[];
  productos: ProductoMenuDto[];
}
