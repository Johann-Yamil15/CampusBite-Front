/**
 * CL-Sprint5 11/11/2026 (etapa 5): horarios de recogida que se le ofrecen al alumno en el checkout.
 * En vez de un selector de fecha y hora, chips con horarios cercanos ("Lo antes posible", "En 15 min"…),
 * solo dentro del horario de hoy de la cafetería. Respeta la regla de sp_crear_orden: la recogida debe ser
 * al menos 5 minutos en el futuro (se repite aquí porque domain no importa otras features).
 */

export const MINUTOS_MINIMOS_RECOGIDA = 5;
/** Saltos que se ofrecen además de "lo antes posible", en minutos desde ahora. */
export const SALTOS_RECOGIDA = [15, 30, 45, 60, 90] as const;

export interface OpcionRecogida {
  /** "Lo antes posible", "En 15 min", "En 1 h"… */
  etiqueta: string;
  fecha: Date;
  /** La primera: la que se elige sola. */
  loAntesPosible: boolean;
}

export interface HorarioHoy {
  abierta: boolean;
  /** Hora de cierre de hoy (HH:mm, hora local de la cafetería) o null si hoy no abre. */
  cierraA: string | null;
  /** Tiempo típico de preparación; si no se sabe, se asumen 10 minutos. */
  minutosEstimados: number | null;
}

const MINUTO = 60_000;

/** Redondea hacia arriba al múltiplo de 5 minutos (13:22 → 13:25), sin segundos. */
export function redondearA5(fecha: Date): Date {
  const r = new Date(fecha);
  r.setSeconds(0, 0);
  const resto = r.getMinutes() % 5;
  if (resto || fecha.getSeconds() || fecha.getMilliseconds()) r.setMinutes(r.getMinutes() + (5 - resto));
  return r;
}

/** 15 → "En 15 min", 60 → "En 1 h", 90 → "En 1 h 30 min". */
function etiquetaSalto(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (!h) return `En ${m} min`;
  return m ? `En ${h} h ${m} min` : `En ${h} h`;
}

function cierreDeHoy(ahora: Date, cierraA: string): Date {
  const [h, m] = cierraA.split(':').map(Number);
  const cierre = new Date(ahora);
  cierre.setHours(h, m, 0, 0);
  return cierre;
}

/**
 * Horarios a ofrecer hoy. Vacío si la cafetería está cerrada o ya no alcanza a preparar antes de cerrar.
 * "Lo antes posible" = ahora + tiempo de preparación (mínimo 5 min), redondeado a 5 min. Los saltos
 * se ofrecen solo si caen al menos 10 min después de esa hora (para no repetir casi la misma) y antes
 * del cierre.
 */
export function opcionesRecogida(ahora: Date, horario: HorarioHoy): OpcionRecogida[] {
  if (!horario.abierta || !horario.cierraA) return [];

  const cierre = cierreDeHoy(ahora, horario.cierraA);
  const preparacion = Math.max(horario.minutosEstimados ?? 10, MINUTOS_MINIMOS_RECOGIDA);
  const primera = redondearA5(new Date(ahora.getTime() + preparacion * MINUTO));
  if (primera > cierre) return [];

  const opciones: OpcionRecogida[] = [{ etiqueta: 'Lo antes posible', fecha: primera, loAntesPosible: true }];
  for (const salto of SALTOS_RECOGIDA) {
    const fecha = redondearA5(new Date(ahora.getTime() + salto * MINUTO));
    if (fecha.getTime() - primera.getTime() < 10 * MINUTO || fecha > cierre) continue;
    opciones.push({
      etiqueta: etiquetaSalto(salto),
      fecha,
      loAntesPosible: false,
    });
  }
  return opciones;
}
