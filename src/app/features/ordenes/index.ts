// CL-Sprint5 11/11/2026: API pública de la feature ordenes; fuera de features/ordenes solo se importa desde aquí
export { MisPedidosFacade } from './application/mis-pedidos.facade';
export { PedidosCafeteriaFacade } from './application/pedidos-cafeteria.facade';
export { provideOrdenes } from './ordenes.providers';
export {
  ESTADOS_ORDEN,
  ETAPAS_ALUMNO,
  ETIQUETA_ETAPA,
  ETIQUETA_MOTIVO_REPORTE,
  LONGITUD_CODIGO_RECOGIDA,
  MAX_MOTIVO_RECHAZO,
  MIN_MOTIVO_RECHAZO,
  MOTIVOS_RECHAZO,
  MAX_CANTIDAD_POR_PRODUCTO,
  MAX_DETALLE_REPORTE,
  MAX_NOTAS_ORDEN,
  METODOS_PAGO_ORDEN,
  MIN_DETALLE_OTRO,
  MINUTOS_MINIMOS_RECOGIDA,
  MOTIVOS_REPORTE,
  accionTablero,
  cancelablePorAlumno,
  codigoValido,
  enCurso,
  etapa,
  motivoNoCancelable,
  pasoAlumno,
  piezas,
  reporteValido,
} from './domain/models/orden.model';
export type {
  AccionTablero,
  EstadoAvanceCafeteria,
  EstadoOrden,
  EstadoPago,
  Etapa,
  LineaOrden,
  MetodoPagoOrden,
  MotivoReporte,
  NuevaOrden,
  Orden,
  ReporteProblema,
  ReporteRecibido,
} from './domain/models/orden.model';
