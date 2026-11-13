/**
 * CL-Sprint5 13/11/2026: contratos de api/cafeterias/{id}/horario y .../promociones, verificados contra
 * NegocioDtos.cs del back (PR #38). Enums como texto PascalCase; fechas de promoción como YYYY-MM-DD.
 */

export interface DiaHorarioDto {
  abre: boolean;
  /** HH:mm */
  desde: string;
  /** HH:mm */
  hasta: string;
}

/** GET/PUT api/cafeterias/{id}/horario y POST/DELETE .../horario/cierre-hoy. */
export interface HorarioDto {
  /** 7 días, lunes primero. */
  dias: DiaHorarioDto[];
  cerradoHoy: boolean;
  abiertaAhora: boolean;
}

/** Enum `TipoPromocion` del back. */
export type TipoPromocionDto = 'Porcentaje' | 'PrecioFijo' | 'Combo';

/** Elemento de GET api/cafeterias/{id}/promociones (y respuesta de POST/PUT). */
export interface PromocionNegocioDto {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: TipoPromocionDto;
  valor: number;
  /** YYYY-MM-DD */
  desde: string;
  /** YYYY-MM-DD */
  hasta: string;
  activa: boolean;
  /** Llega en 0 por ahora. */
  usos: number;
}

/** Body de POST y PUT .../promociones[/{idPromocion}]. Porcentaje: entero 1..90; PrecioFijo/Combo: 0 < v ≤ 2000. */
export interface GuardarPromocionDto {
  nombre: string;
  descripcion: string | null;
  tipo: TipoPromocionDto;
  valor: number;
  desde: string;
  hasta: string;
  activa: boolean;
}
