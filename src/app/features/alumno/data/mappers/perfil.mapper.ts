import {
  DatosPersonales,
  MetodoPagoPreferido,
  PerfilAlumno,
  PreferenciasAlumno,
} from '@features/alumno/domain/models/perfil.model';
import {
  DatosAlumnoDto,
  MetodoPagoDto,
  PerfilAlumnoDto,
  PreferenciasAlumnoDto,
} from '@features/alumno/data/dtos/alumno.dto';

const METODO: Record<MetodoPagoDto, MetodoPagoPreferido> = {
  Efectivo: 'efectivo',
  Tarjeta: 'tarjeta',
  Transferencia: 'transferencia',
};

const METODO_DTO: Record<MetodoPagoPreferido, MetodoPagoDto> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
};

/** CL-Sprint5 13/11/2026: api/alumnos/me/... ↔ dominio. La API solo acepta el método en PascalCase. */
export const PerfilMapper = {
  toDomain(dto: PerfilAlumnoDto): PerfilAlumno {
    return {
      correo: dto.correo,
      datos: PerfilMapper.toDatos(dto.datos),
      preferencias: PerfilMapper.toPreferencias(dto.preferencias),
    };
  },

  toDatos(dto: DatosAlumnoDto): DatosPersonales {
    return { nombre: dto.nombre, matricula: dto.matricula ?? null, telefono: dto.telefono ?? null };
  },

  toDatosRequest(datos: DatosPersonales): DatosAlumnoDto {
    return { nombre: datos.nombre ?? '', matricula: datos.matricula, telefono: datos.telefono };
  },

  toPreferencias(dto: PreferenciasAlumnoDto): PreferenciasAlumno {
    return {
      idCafeteriaFrecuente: dto.idCafeteriaFrecuente ?? null,
      metodoPago: dto.metodoPago ? METODO[dto.metodoPago] : null,
      avisoPedidoListo: dto.avisoPedidoListo,
      avisoPromociones: dto.avisoPromociones,
    };
  },

  toPreferenciasRequest(p: PreferenciasAlumno): PreferenciasAlumnoDto {
    return {
      idCafeteriaFrecuente: p.idCafeteriaFrecuente,
      metodoPago: p.metodoPago ? METODO_DTO[p.metodoPago] : null,
      avisoPedidoListo: p.avisoPedidoListo,
      avisoPromociones: p.avisoPromociones,
    };
  },
};
