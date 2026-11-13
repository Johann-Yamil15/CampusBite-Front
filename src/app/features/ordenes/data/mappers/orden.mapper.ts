import {
  EstadoOrden,
  EstadoPago,
  MetodoPagoOrden,
  MotivoReporte,
  NuevaOrden,
  Orden,
  ReporteProblema,
  folioDe,
} from '@features/ordenes/domain/models/orden.model';
import {
  CrearOrdenRequestDto,
  CrearReporteRequestDto,
  EstadoOrdenDto,
  MetodoPagoDto,
  MotivoReporteDto,
  OrdenDto,
} from '@features/ordenes/data/dtos/orden.dto';

const ESTADO: Record<EstadoOrdenDto, EstadoOrden> = {
  Pendiente: 'pendiente',
  Confirmada: 'confirmada',
  EnPreparacion: 'en_preparacion',
  Lista: 'lista',
  Entregada: 'entregada',
  Cancelada: 'cancelada',
};

const ESTADO_DTO = Object.fromEntries(
  Object.entries(ESTADO).map(([dto, estado]) => [estado, dto]),
) as Record<EstadoOrden, EstadoOrdenDto>;

const METODO_DTO: Record<MetodoPagoOrden, MetodoPagoDto> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
};

// CL-Sprint5 13/11/2026: la API solo acepta el texto PascalCase del enum (no números ni snake_case)
const MOTIVO_DTO: Record<MotivoReporte, MotivoReporteDto> = {
  falto_articulo: 'FaltoArticulo',
  producto_equivocado: 'ProductoEquivocado',
  calidad: 'Calidad',
  cobro: 'Cobro',
  otro: 'Otro',
};

/** CL-Sprint5 11/11/2026: DTO de api/ordenes ↔ entidades del dominio. */
export const OrdenMapper = {
  toDomain(dto: OrdenDto): Orden {
    return {
      idOrden: dto.idOrden,
      folio: folioDe(dto.idOrden),
      idCafeteria: dto.idCafeteria,
      cafeteria: dto.cafeteria,
      logoCafeteria: dto.logoCafeteria,
      puntoEntrega: dto.puntoEntrega,
      alumno: dto.alumno,
      estado: ESTADO[dto.estado],
      recogidaEn: dto.recogidaEn,
      creadoEn: dto.creadoEn,
      codigoRecogida: dto.codigoRecogida,
      total: dto.total,
      metodo: dto.metodo.toLowerCase() as MetodoPagoOrden,
      estadoPago: dto.estadoPago.toLowerCase() as EstadoPago,
      notas: dto.notas,
      motivoCancelacion: dto.motivoCancelacion,
      lineas: dto.lineas.map((l) => ({ ...l })),
    };
  },

  toCrearRequest(nueva: NuevaOrden): CrearOrdenRequestDto {
    return {
      idCafeteria: nueva.idCafeteria,
      recogidaEn: nueva.recogidaEn,
      metodo: METODO_DTO[nueva.metodo],
      items: nueva.items.map((i) => ({ ...i })),
      ...(nueva.notas ? { notas: nueva.notas } : {}),
    };
  },

  toEstadoDto(estado: EstadoOrden): EstadoOrdenDto {
    return ESTADO_DTO[estado];
  },

  toReporteRequest(reporte: ReporteProblema): CrearReporteRequestDto {
    return { motivo: MOTIVO_DTO[reporte.motivo], detalle: reporte.detalle.trim() || null };
  },
};
