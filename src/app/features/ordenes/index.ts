// CL-Sprint5 11/11/2026: API pública de la feature ordenes; fuera de features/ordenes solo se importa desde aquí
export { MisPedidosFacade } from './application/mis-pedidos.facade';
export { PedidosCafeteriaFacade } from './application/pedidos-cafeteria.facade';
export { provideOrdenes } from './ordenes.providers';
export {
  ESTADOS_ORDEN,
  ETAPAS_ALUMNO,
  ETIQUETA_ETAPA,
  LONGITUD_CODIGO_RECOGIDA,
  MAX_CANTIDAD_POR_PRODUCTO,
  MAX_NOTAS_ORDEN,
  METODOS_PAGO_ORDEN,
  MINUTOS_MINIMOS_RECOGIDA,
  cancelablePorAlumno,
  enCurso,
  etapa,
  pasoAlumno,
  piezas,
} from './domain/models/orden.model';
export type {
  EstadoAvanceCafeteria,
  EstadoOrden,
  EstadoPago,
  Etapa,
  LineaOrden,
  MetodoPagoOrden,
  NuevaOrden,
  Orden,
} from './domain/models/orden.model';
