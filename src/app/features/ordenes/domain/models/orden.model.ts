/**
 * CL-Sprint5 11/11/2026: entidades y reglas de una orden. Los estados son los del ENUM estado_orden de la BD
 * y las transiciones son las de fn_validar_transicion_orden (trigger de la tabla orden):
 *
 *   pendiente → confirmada → en_preparacion → lista → entregada
 *       └──────────┴──────────────┴───────────┴──→ cancelada
 *
 * Efectivo nace "confirmada"; tarjeta y transferencia nacen "pendiente" hasta que se confirma el pago.
 * Al alumno se le muestran 4 etapas: Recibido (pendiente y confirmada), En preparación, Listo y Entregado.
 */

export const ESTADOS_ORDEN = [
  'pendiente',
  'confirmada',
  'en_preparacion',
  'lista',
  'entregada',
  'cancelada',
] as const;
export type EstadoOrden = (typeof ESTADOS_ORDEN)[number];

/** Igual que en catalogo; se repite porque domain no importa otras features. */
export const METODOS_PAGO_ORDEN = ['efectivo', 'tarjeta', 'transferencia'] as const;
export type MetodoPagoOrden = (typeof METODOS_PAGO_ORDEN)[number];

/** ENUM estado_pago de la BD. */
export type EstadoPago = 'pendiente' | 'pagado' | 'rechazado' | 'reembolsado' | 'cancelado';

/** Código de recogida: 6 dígitos (orden.codigo_recogida CHAR(6) en la BD). */
export const LONGITUD_CODIGO_RECOGIDA = 6;
/** Tope por producto (detalle_orden.cantidad BETWEEN 1 AND 20). */
export const MAX_CANTIDAD_POR_PRODUCTO = 20;
/** La recogida debe ser al menos 5 minutos en el futuro (sp_crear_orden). */
export const MINUTOS_MINIMOS_RECOGIDA = 5;
/** orden.notas VARCHAR(200). */
export const MAX_NOTAS_ORDEN = 200;

export interface LineaOrden {
  idProducto: string;
  producto: string;
  cantidad: number;
  precioUnitario: number;
  imagenUrl: string | null;
}

export interface AlumnoOrden {
  nombre: string;
  matricula: string | null;
}

export interface Orden {
  idOrden: string;
  /** Folio corto para mostrar (se deriva del id; la BD no tiene folio). */
  folio: string;
  idCafeteria: string;
  cafeteria: string;
  logoCafeteria: string | null;
  puntoEntrega: string;
  /** Solo lo ve la cafetería; en "Mis pedidos" viene `null`. */
  alumno: AlumnoOrden | null;
  estado: EstadoOrden;
  /** ISO-8601 con zona. */
  recogidaEn: string;
  /** ISO-8601 con zona. */
  creadoEn: string;
  codigoRecogida: string;
  total: number;
  metodo: MetodoPagoOrden;
  estadoPago: EstadoPago;
  notas: string | null;
  lineas: LineaOrden[];
}

/** Lo que manda el alumno al confirmar su carrito (entrada de sp_crear_orden). */
export interface NuevaOrden {
  idCafeteria: string;
  /** ISO-8601 con offset local, p. ej. 2026-10-27T13:00:00-06:00. */
  recogidaEn: string;
  metodo: MetodoPagoOrden;
  items: { idProducto: string; cantidad: number }[];
  notas?: string;
}

/** Los estados a los que la cafetería mueve una orden con sp_cambiar_estado_orden. */
export type EstadoAvanceCafeteria = 'en_preparacion' | 'lista';

// ---------- Reglas ----------

const TRANSICIONES: Record<EstadoOrden, readonly EstadoOrden[]> = {
  pendiente: ['confirmada', 'cancelada'],
  confirmada: ['en_preparacion', 'cancelada'],
  en_preparacion: ['lista', 'cancelada'],
  lista: ['entregada', 'cancelada'],
  entregada: [],
  cancelada: [],
};

/** La misma máquina de estados que el trigger de la BD. */
export function puedeTransicionar(de: EstadoOrden, a: EstadoOrden): boolean {
  return TRANSICIONES[de].includes(a);
}

/** Una orden sigue en curso mientras no se entrega ni se cancela. */
export function enCurso(orden: Pick<Orden, 'estado'>): boolean {
  return orden.estado !== 'entregada' && orden.estado !== 'cancelada';
}

/** El alumno solo cancela antes de que entre a preparación (sp_cancelar_orden). */
export function cancelablePorAlumno(orden: Pick<Orden, 'estado'>): boolean {
  return orden.estado === 'pendiente' || orden.estado === 'confirmada';
}

export function piezas(orden: Pick<Orden, 'lineas'>): number {
  return orden.lineas.reduce((suma, l) => suma + l.cantidad, 0);
}

export function totalLineas(lineas: readonly LineaOrden[]): number {
  return lineas.reduce((suma, l) => suma + l.precioUnitario * l.cantidad, 0);
}

/** Folio corto a partir del id: "CB-" + los primeros 8 hexadecimales en dos grupos (CB-A1B2-C3D4). */
export function folioDe(idOrden: string): string {
  const hex = idOrden.replace(/-/g, '').slice(0, 8).toUpperCase();
  return `CB-${hex.slice(0, 4)}-${hex.slice(4)}`;
}

// ---------- Etapas visibles ----------

/** Las 4 etapas que ve el alumno, más "cancelado". También son las clases CSS `.estado-*`. */
export const ETAPAS_ALUMNO = ['recibido', 'en_preparacion', 'listo', 'entregado'] as const;
export type Etapa = (typeof ETAPAS_ALUMNO)[number] | 'cancelado';

const ETAPA: Record<EstadoOrden, Etapa> = {
  pendiente: 'recibido',
  confirmada: 'recibido',
  en_preparacion: 'en_preparacion',
  lista: 'listo',
  entregada: 'entregado',
  cancelada: 'cancelado',
};

export function etapa(estado: EstadoOrden): Etapa {
  return ETAPA[estado];
}

export const ETIQUETA_ETAPA: Record<Etapa, string> = {
  recibido: 'Recibido',
  en_preparacion: 'En preparación',
  listo: 'Listo para recoger',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

/** Posición en la línea de tiempo del alumno (0–3), o -1 si se canceló. */
export function pasoAlumno(estado: EstadoOrden): number {
  const e = etapa(estado);
  return e === 'cancelado' ? -1 : ETAPAS_ALUMNO.indexOf(e);
}

// ---------- Cancelación (etapa 6) ----------

/**
 * CL-Sprint5 11/11/2026 (etapa 6): por qué el alumno ya no puede cancelar, o `null` si todavía puede. Son
 * los mismos casos que rechaza sp_cancelar_orden; el texto es el que ve el alumno.
 */
export function motivoNoCancelable(orden: Pick<Orden, 'estado'>): string | null {
  switch (orden.estado) {
    case 'pendiente':
    case 'confirmada':
      return null;
    case 'en_preparacion':
      return 'La cafetería ya está preparando tu pedido, así que ya no se puede cancelar desde la app. Si es urgente, habla con ellos en el mostrador.';
    case 'lista':
      return 'Tu pedido ya está listo para recoger, así que ya no se puede cancelar.';
    case 'entregada':
      return 'Este pedido ya se entregó.';
    case 'cancelada':
      return 'Este pedido ya está cancelado.';
  }
}

// ---------- Reportes de un problema (etapa 6) ----------

/** CL-Sprint5 11/11/2026 (etapa 6): motivos del formulario "Reportar un problema". */
export const MOTIVOS_REPORTE = [
  'falto_articulo',
  'producto_equivocado',
  'calidad',
  'cobro',
  'otro',
] as const;
export type MotivoReporte = (typeof MOTIVOS_REPORTE)[number];

export const ETIQUETA_MOTIVO_REPORTE: Record<MotivoReporte, string> = {
  falto_articulo: 'Faltó un artículo',
  producto_equivocado: 'Me dieron otro producto',
  calidad: 'Calidad o temperatura',
  cobro: 'Cobro incorrecto',
  otro: 'Otro',
};

export const MAX_DETALLE_REPORTE = 300;
/** Con "Otro" hay que contar qué pasó. */
export const MIN_DETALLE_OTRO = 10;

export interface ReporteProblema {
  motivo: MotivoReporte;
  detalle: string;
}

export interface ReporteRecibido {
  /** Folio del reporte para darle seguimiento (R-XXXXXX). */
  folio: string;
}

/** El detalle es opcional salvo con "Otro"; nunca más de MAX_DETALLE_REPORTE. */
export function reporteValido(r: ReporteProblema): boolean {
  const detalle = r.detalle.trim();
  if (detalle.length > MAX_DETALLE_REPORTE) return false;
  return r.motivo !== 'otro' || detalle.length >= MIN_DETALLE_OTRO;
}
