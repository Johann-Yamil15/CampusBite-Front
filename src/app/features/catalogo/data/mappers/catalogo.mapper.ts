import { MenuCafeteria, MetodoPago } from '@features/catalogo/domain/models/catalogo.model';
import { MenuCafeteriaDto, MetodoPagoDto } from '@features/catalogo/data/dtos/catalogo.dto';

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
      })),
    };
  },

  toMetodo(dto: MetodoPagoDto): MetodoPago {
    return dto.toLowerCase() as MetodoPago;
  },
};
