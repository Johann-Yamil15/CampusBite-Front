import { Cafeteria, CafeteriaData } from '@features/cafeterias/domain/models/cafeteria.model';
import {
  CafeteriaDto,
  GuardarCafeteriaRequestDto,
} from '@features/cafeterias/data/dtos/cafeteria.dto';

export const CafeteriaMapper = {
  toDomain(dto: CafeteriaDto): Cafeteria {
    return {
      id: dto.idCafeteria,
      name: dto.nombre,
      location: dto.ubicacion,
      onCampus: dto.esDelCampus,
      pickupPoint: dto.puntoEntrega,
      active: dto.activa,
      paymentMethods: [...dto.metodosPago],
      createdAt: new Date(dto.creadoEn),
      updatedAt: new Date(dto.actualizadoEn),
    };
  },

  toRequest(data: CafeteriaData): GuardarCafeteriaRequestDto {
    return {
      nombre: data.name,
      ubicacion: data.location,
      esDelCampus: data.onCampus,
      puntoEntrega: data.pickupPoint,
      metodosPago: [...data.paymentMethods],
    };
  },
};
