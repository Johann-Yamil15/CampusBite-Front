/**
 * CL-Sprint5 11/11/2026 (etapa 9): horario y promociones del negocio, con sus reglas como funciones puras.
 * Lo que se guarda aquí lo ve el alumno: el horario decide si la cafetería está abierta y hasta qué hora
 * puede recoger; las promociones activas y vigentes salen en su inicio y en la tienda.
 */

/** Lunes = 0 … Domingo = 6. */
export const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;

export interface DiaHorario {
  abre: boolean;
  /** HH:mm */
  desde: string;
  /** HH:mm */
  hasta: string;
}

export interface HorarioNegocio {
  /** 7 días, de lunes a domingo. */
  dias: DiaHorario[];
  cerradoHoy: boolean;
  /** Si los alumnos pueden pedir en este momento. */
  abiertaAhora: boolean;
}

export const TIPOS_PROMOCION = ['porcentaje', 'precio_fijo', 'combo'] as const;
export type TipoPromocion = (typeof TIPOS_PROMOCION)[number];

export const ETIQUETA_TIPO: Record<TipoPromocion, string> = {
  porcentaje: 'Descuento %',
  precio_fijo: 'Precio especial',
  combo: 'Combo',
};

export interface PromocionNegocio {
  /** Vacío = nueva. */
  id: string;
  nombre: string;
  descripcion: string;
  tipo: TipoPromocion;
  /** % si es porcentaje; pesos si es precio fijo o combo. */
  valor: number;
  /** YYYY-MM-DD */
  desde: string;
  /** YYYY-MM-DD */
  hasta: string;
  activa: boolean;
  usos: number;
}

export const LIMITES_PROMOCION = {
  nombreMin: 3,
  nombreMax: 60,
  descripcionMax: 140,
  porcentajeMax: 90,
  precioMax: 2000,
} as const;

// ---------- Reglas ----------

export function aMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/** Un día abierto necesita cerrar después de abrir. */
export function diaValido(d: DiaHorario): boolean {
  return !d.abre || (!!d.desde && !!d.hasta && aMinutos(d.hasta) > aMinutos(d.desde));
}

export function horasDia(d: DiaHorario): number {
  return d.abre && diaValido(d) ? (aMinutos(d.hasta) - aMinutos(d.desde)) / 60 : 0;
}

export type ErroresPromocion = Partial<Record<'nombre' | 'descripcion' | 'valor' | 'fechas', string>>;

export function validarPromocion(p: PromocionNegocio): ErroresPromocion {
  const e: ErroresPromocion = {};
  const nombre = p.nombre.trim();
  if (nombre.length < LIMITES_PROMOCION.nombreMin) e.nombre = 'Ponle un nombre de al menos 3 letras.';
  else if (nombre.length > LIMITES_PROMOCION.nombreMax) e.nombre = `Hasta ${LIMITES_PROMOCION.nombreMax} caracteres.`;
  if (p.descripcion.trim().length > LIMITES_PROMOCION.descripcionMax) {
    e.descripcion = `Hasta ${LIMITES_PROMOCION.descripcionMax} caracteres.`;
  }
  if (!Number.isFinite(p.valor) || p.valor <= 0) {
    e.valor = p.tipo === 'porcentaje' ? 'El descuento debe ser mayor a 0%.' : 'El precio debe ser mayor a $0.';
  } else if (p.tipo === 'porcentaje' && (p.valor > LIMITES_PROMOCION.porcentajeMax || !Number.isInteger(p.valor))) {
    e.valor = `Usa un porcentaje entero de 1 a ${LIMITES_PROMOCION.porcentajeMax}.`;
  } else if (p.tipo !== 'porcentaje' && p.valor > LIMITES_PROMOCION.precioMax) {
    e.valor = `El precio puede ser hasta $${LIMITES_PROMOCION.precioMax}.`;
  }
  if (!p.desde || !p.hasta) e.fechas = 'Elige desde y hasta cuándo aplica.';
  else if (p.hasta < p.desde) e.fechas = 'La fecha final no puede ser antes de la inicial.';
  return e;
}

export type VigenciaPromocion = 'vigente' | 'programada' | 'vencida' | 'pausada';

/** Si los alumnos la ven hoy y, si no, por qué. `hoy` en YYYY-MM-DD. */
export function vigencia(p: Pick<PromocionNegocio, 'activa' | 'desde' | 'hasta'>, hoy: string): VigenciaPromocion {
  if (!p.activa) return 'pausada';
  if (p.desde > hoy) return 'programada';
  if (p.hasta < hoy) return 'vencida';
  return 'vigente';
}

export const ETIQUETA_VIGENCIA: Record<VigenciaPromocion, string> = {
  vigente: 'Visible para alumnos',
  programada: 'Programada',
  vencida: 'Vencida',
  pausada: 'En pausa',
};
