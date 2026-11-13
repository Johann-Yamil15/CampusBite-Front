import {
  CafeteriaFavorita,
  PlatilloFavorito,
} from '@features/alumno/domain/models/favorito.model';
import {
  FavoritoCafeteriaDto,
  FavoritoPlatilloDto,
} from '@features/alumno/data/dtos/alumno.dto';

/** CL-Sprint5 13/11/2026: api/favoritos/... → dominio. */
export const FavoritosMapper = {
  toCafeteria(dto: FavoritoCafeteriaDto): CafeteriaFavorita {
    // Sin foto (el back aún no tiene dónde subirla) va vacía: la tarjeta deja su fondo de marcador
    return { ...dto, foto: dto.foto ?? '' };
  },

  toPlatillo(dto: FavoritoPlatilloDto): PlatilloFavorito {
    return { ...dto };
  },
};
