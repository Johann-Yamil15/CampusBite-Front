import {
  HorarioNegocio,
  PromocionNegocio,
  TipoPromocion,
} from '@features/menu-negocio/domain/models/negocio.model';
import {
  GuardarPromocionDto,
  HorarioDto,
  PromocionNegocioDto,
  TipoPromocionDto,
} from '@features/menu-negocio/data/dtos/negocio.dto';

const TIPO: Record<TipoPromocionDto, TipoPromocion> = {
  Porcentaje: 'porcentaje',
  PrecioFijo: 'precio_fijo',
  Combo: 'combo',
};

const TIPO_DTO: Record<TipoPromocion, TipoPromocionDto> = {
  porcentaje: 'Porcentaje',
  precio_fijo: 'PrecioFijo',
  combo: 'Combo',
};

/** CL-Sprint5 13/11/2026: horario y promociones del negocio ↔ dominio. La API solo acepta el tipo en PascalCase. */
export const NegocioMapper = {
  toHorario(dto: HorarioDto): HorarioNegocio {
    return {
      dias: dto.dias.map((d) => ({ ...d })),
      cerradoHoy: dto.cerradoHoy,
      abiertaAhora: dto.abiertaAhora,
    };
  },

  toPromocion(dto: PromocionNegocioDto): PromocionNegocio {
    return { ...dto, descripcion: dto.descripcion ?? '', tipo: TIPO[dto.tipo] };
  },

  /** Sin `id` (va en la URL) ni `usos` (lo cuenta el back). */
  toGuardarRequest(p: PromocionNegocio): GuardarPromocionDto {
    return {
      nombre: p.nombre.trim(),
      descripcion: p.descripcion.trim() || null,
      tipo: TIPO_DTO[p.tipo],
      valor: p.valor,
      desde: p.desde,
      hasta: p.hasta,
      activa: p.activa,
    };
  },
};
