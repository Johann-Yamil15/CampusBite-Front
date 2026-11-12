/**
 * CL-Sprint5 11/11/2026 (etapa 9): estadísticas del negocio calculadas con las órdenes (las mismas del
 * tablero), no cifras fijas. Funciones puras: reciben formas mínimas para no depender de la feature ordenes.
 *   - Ventas y pedidos cuentan lo no cancelado; el ticket es ventas / pedidos.
 *   - Por estado agrupa como el tablero (pendiente y confirmada = "Nuevos").
 *   - Más vendidos por piezas; horas pico por la hora en que se hizo el pedido.
 */

export interface LineaResumible {
  idProducto: string;
  producto: string;
  cantidad: number;
  precioUnitario: number;
}

export interface OrdenResumible {
  estado: string;
  total: number;
  /** ISO-8601 */
  creadoEn: string;
  lineas: LineaResumible[];
}

export const PERIODOS = ['hoy', '7d', '30d'] as const;
export type Periodo = (typeof PERIODOS)[number];

export const ETIQUETA_PERIODO: Record<Periodo, string> = {
  hoy: 'Hoy',
  '7d': 'Últimos 7 días',
  '30d': 'Últimos 30 días',
};

export const GRUPOS_ESTADO = ['nuevos', 'preparacion', 'listos', 'entregados', 'cancelados'] as const;
export type GrupoEstado = (typeof GRUPOS_ESTADO)[number];

export const ETIQUETA_GRUPO: Record<GrupoEstado, string> = {
  nuevos: 'Nuevos',
  preparacion: 'En preparación',
  listos: 'Listos',
  entregados: 'Entregados',
  cancelados: 'Cancelados',
};

const GRUPO: Record<string, GrupoEstado> = {
  pendiente: 'nuevos',
  confirmada: 'nuevos',
  en_preparacion: 'preparacion',
  lista: 'listos',
  entregada: 'entregados',
  cancelada: 'cancelados',
};

export interface Barra {
  etiqueta: string;
  valor: number;
}

export interface Estadisticas {
  ventas: number;
  pedidos: number;
  ticketPromedio: number;
  cancelados: number;
  porEstado: Record<GrupoEstado, number>;
  /** Un día por barra, del más viejo al de hoy (solo 7d y 30d agrupan por día). */
  ventasPorDia: Barra[];
  /** Hasta 5, de más a menos piezas. */
  masVendidos: { producto: string; piezas: number; monto: number }[];
  /** Solo las horas con pedidos, en orden. */
  horasPico: Barra[];
}

const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function inicioDelDia(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

/** Las órdenes dentro del periodo (contando hoy). */
export function enPeriodo<T extends OrdenResumible>(ordenes: readonly T[], periodo: Periodo, ahora: Date): T[] {
  const dias = periodo === 'hoy' ? 1 : periodo === '7d' ? 7 : 30;
  const desde = inicioDelDia(ahora);
  desde.setDate(desde.getDate() - (dias - 1));
  return ordenes.filter((o) => new Date(o.creadoEn) >= desde && new Date(o.creadoEn) <= ahora);
}

export function estadisticas(ordenes: readonly OrdenResumible[], periodo: Periodo, ahora: Date): Estadisticas {
  const delPeriodo = enPeriodo(ordenes, periodo, ahora);
  const validas = delPeriodo.filter((o) => o.estado !== 'cancelada');
  const ventas = validas.reduce((s, o) => s + o.total, 0);

  const porEstado = Object.fromEntries(GRUPOS_ESTADO.map((g) => [g, 0])) as Record<GrupoEstado, number>;
  for (const o of delPeriodo) {
    const g = GRUPO[o.estado];
    if (g) porEstado[g]++;
  }

  // Ventas por día (7 o 30 barras; "hoy" muestra una)
  const dias = periodo === 'hoy' ? 1 : periodo === '7d' ? 7 : 30;
  const ventasPorDia: Barra[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const dia = inicioDelDia(ahora);
    dia.setDate(dia.getDate() - i);
    const siguiente = new Date(dia);
    siguiente.setDate(siguiente.getDate() + 1);
    const valor = validas
      .filter((o) => {
        const f = new Date(o.creadoEn);
        return f >= dia && f < siguiente;
      })
      .reduce((s, o) => s + o.total, 0);
    const etiqueta = dias === 30 ? String(dia.getDate()) : i === 0 ? 'Hoy' : DIAS_CORTOS[dia.getDay()];
    ventasPorDia.push({ etiqueta, valor });
  }

  // Más vendidos
  const productos = new Map<string, { producto: string; piezas: number; monto: number }>();
  for (const o of validas) {
    for (const l of o.lineas) {
      const p = productos.get(l.idProducto) ?? { producto: l.producto, piezas: 0, monto: 0 };
      p.piezas += l.cantidad;
      p.monto += l.cantidad * l.precioUnitario;
      productos.set(l.idProducto, p);
    }
  }
  const masVendidos = [...productos.values()]
    .sort((a, b) => b.piezas - a.piezas || b.monto - a.monto)
    .slice(0, 5);

  // Horas pico
  const horas = new Map<number, number>();
  for (const o of validas) {
    const h = new Date(o.creadoEn).getHours();
    horas.set(h, (horas.get(h) ?? 0) + 1);
  }
  const horasPico = [...horas.entries()]
    .sort(([a], [b]) => a - b)
    .map(([h, valor]) => ({ etiqueta: `${String(h).padStart(2, '0')}:00`, valor }));

  return {
    ventas,
    pedidos: validas.length,
    ticketPromedio: validas.length ? ventas / validas.length : 0,
    cancelados: porEstado.cancelados,
    porEstado,
    ventasPorDia,
    masVendidos,
    horasPico,
  };
}
