import {
  Dieta,
  MenuCafeteria,
  MetodoPago,
  Promocion,
} from '@features/catalogo/domain/models/catalogo.model';
import {
  DietaDto,
  MenuCafeteriaDto,
  MetodoPagoDto,
  PromocionDto,
} from '@features/catalogo/data/dtos/catalogo.dto';

const DIETA: Record<DietaDto, Dieta> = { Vegetariano: 'vegetariano', SinGluten: 'sin_gluten' };

/** CL-Sprint5 11/11/2026: DTO del menú → entidad del catálogo. */
export const CatalogoMapper = {
  toDomain(dto: MenuCafeteriaDto): MenuCafeteria {
    return {
      idCafeteria: dto.idCafeteria,
      cafeteria: dto.cafeteria,
      esDelCampus: dto.esDelCampus,
      puntoEntrega: dto.puntoEntrega,
      metodosPago: dto.metodosPago.map(CatalogoMapper.toMetodo),
      productos: dto.productos.map((p) => ({
        idProducto: p.idProducto,
        producto: p.producto,
        categoria: p.categoria,
        descripcion: p.descripcion,
        precio: p.precio,
        imagenUrl: p.imagenUrl,
        calificacion: p.calificacion ?? null,
        minutosPreparacion: p.minutosPreparacion ?? null,
        precioAnterior: p.precioAnterior ?? null,
        popular: p.popular ?? false,
        dietas: (p.dietas ?? []).map((d) => DIETA[d]).filter(Boolean),
      })),
      logoUrl: dto.logoUrl ?? null,
      portadaUrl: dto.portadaUrl ?? null,
      calificacion: dto.calificacion ?? null,
      resenas: dto.resenas ?? null,
      // sp_menu_cafeteria solo devuelve cafeterías activas: sin el dato, se asume abierta
      abierta: dto.abierta ?? true,
      cierraA: dto.cierraA ?? null,
      minutosEstimados: dto.minutosEstimados ?? null,
    };
  },

  toPromocion(dto: PromocionDto): Promocion {
    return { ...dto };
  },

  toMetodo(dto: MetodoPagoDto): MetodoPago {
    return dto.toLowerCase() as MetodoPago;
  },
};
