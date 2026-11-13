// CL-Sprint5 11/11/2026 (etapa 9): la parte "viva" de la BD de demostración del lado del negocio: horario
// semanal, "cerrar por hoy" y promociones de cada cafetería. La escriben las pantallas del encargado
// (/mi-negocio) y la leen las del alumno (catálogo, checkout, órdenes), como lo harían con la BD real:
//   - el estado abierto/cerrado y la hora de cierre del catálogo salen de aquí (y con ellos los horarios
//     de recogida del checkout),
//   - las promociones activas salen en el carrusel del inicio y en la tienda.
// Se guarda en localStorage (cb.demo.negocio) para que sobreviva a cerrar sesión como encargado y entrar
// como alumno. Es compartido (no por usuario): es la "BD". Si el storage está bloqueado, vive en memoria.
import { Injectable } from '@angular/core';
import { DEMO_CAFETERIA, DEMO_CAFETERIAS, DEMO_CAFETERIA_ENCARGADO } from './demo-db';

/** Lunes = 0 … Domingo = 6 (como se muestra en la pantalla de Horario). */
export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;

export interface DemoDiaHorario {
  abre: boolean;
  /** HH:mm */
  desde: string;
  /** HH:mm */
  hasta: string;
}

export type DemoTipoPromocion = 'porcentaje' | 'precio_fijo' | 'combo';

export interface DemoPromocionNegocio {
  id: string;
  idCafeteria: string;
  nombre: string;
  descripcion: string;
  tipo: DemoTipoPromocion;
  /** % si es porcentaje; pesos si es precio fijo o combo. */
  valor: number;
  /** YYYY-MM-DD */
  desde: string;
  /** YYYY-MM-DD */
  hasta: string;
  activa: boolean;
  usos: number;
}

export interface EstadoHoy {
  abierta: boolean;
  /** Hora de apertura de hoy, o null si hoy no abre. */
  abreA: string | null;
  /** Hora de cierre de hoy, o null si hoy no abre (o cerró por hoy). */
  cierraA: string | null;
  /** El encargado cerró por hoy. */
  cerradoHoy: boolean;
}

interface Estado {
  horarios: Record<string, DemoDiaHorario[]>;
  /** idCafeteria → fecha (YYYY-MM-DD) en que se cerró por hoy. */
  cerradoHoy: Record<string, string>;
  promociones: DemoPromocionNegocio[];
}

export const CLAVE_DEMO_NEGOCIO = 'cb.demo.negocio';

// ---------- Fechas ----------

/** YYYY-MM-DD en hora local. */
export function fechaLocal(fecha: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())}`;
}

/** 0 = lunes … 6 = domingo. */
export function indiceDia(fecha: Date): number {
  return (fecha.getDay() + 6) % 7;
}

export function aMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function sumarDias(fecha: Date, dias: number): Date {
  const copia = new Date(fecha);
  copia.setDate(copia.getDate() + dias);
  return copia;
}

// ---------- Semilla ----------

const dia = (desde: string, hasta: string): DemoDiaHorario => ({ abre: true, desde, hasta });
const CERRADO: DemoDiaHorario = { abre: false, desde: '09:00', hasta: '13:00' };

/** Semana típica de cada cafetería demo (la hora de cierre es la que ya mostraba el catálogo). */
function horariosSemilla(): Record<string, DemoDiaHorario[]> {
  const entreSemana = (desde: string, hasta: string, sabado: DemoDiaHorario, domingo = CERRADO) => [
    ...Array.from({ length: 5 }, () => dia(desde, hasta)),
    sabado,
    domingo,
  ];
  return {
    [DEMO_CAFETERIA.central]: entreSemana('07:00', '17:00', dia('09:00', '13:00')),
    [DEMO_CAFETERIA.express]: entreSemana('07:00', '15:00', CERRADO),
    [DEMO_CAFETERIA.rincon]: entreSemana('08:00', '16:00', CERRADO),
    [DEMO_CAFETERIA.sabor]: entreSemana('11:00', '18:00', dia('11:00', '15:00')),
    [DEMO_CAFETERIA.terraza]: entreSemana('07:00', '13:00', dia('08:00', '12:00')),
    [DEMO_CAFETERIA.snack]: entreSemana('09:00', '19:00', dia('10:00', '16:00'), dia('10:00', '16:00')),
  };
}

function semilla(ahora: Date): Estado {
  const desde = fechaLocal(sumarDias(ahora, -10));
  const hasta = fechaLocal(sumarDias(ahora, 20));
  return {
    horarios: horariosSemilla(),
    // Café Express arranca "cerrado por hoy" (imprevisto): así la demo siempre tiene una cafetería cerrada
    cerradoHoy: { [DEMO_CAFETERIA.express]: fechaLocal(ahora) },
    promociones: [
      {
        id: 'promo-n1', idCafeteria: DEMO_CAFETERIA.central, nombre: 'Combo Estudiantil',
        descripcion: 'Sándwich + bebida del día.', tipo: 'combo', valor: 79, desde, hasta, activa: true, usos: 34,
      },
      {
        id: 'promo-n2', idCafeteria: DEMO_CAFETERIA.central, nombre: 'Martes de café',
        descripcion: '20% en bebidas calientes.', tipo: 'porcentaje', valor: 20, desde, hasta, activa: true, usos: 12,
      },
      {
        id: 'promo-n3', idCafeteria: DEMO_CAFETERIA.central, nombre: 'Desayuno a $45',
        descripcion: 'Molletes o chilaquiles antes de las 10:00.', tipo: 'precio_fijo', valor: 45, desde, hasta,
        activa: false, usos: 58,
      },
    ],
  };
}

// ---------- Almacén ----------

@Injectable({ providedIn: 'root' })
export class DemoNegocioStore {
  private enMemoria: Estado | null = null;

  /**
   * El encargado real (login con la API) tiene una cafetería que no está en la BD demo: sus datos simulados
   * se guardan en la cafetería demo del encargado (Cafetería Central), igual que hace el tablero de pedidos.
   */
  idDemo(idCafeteria: string): string {
    return DEMO_CAFETERIAS.some((c) => c.id === idCafeteria) ? idCafeteria : DEMO_CAFETERIA_ENCARGADO;
  }

  // ---------- Horario ----------

  horario(idCafeteria: string): DemoDiaHorario[] {
    const id = this.idDemo(idCafeteria);
    return (this.leer().horarios[id] ?? DIAS_SEMANA.map(() => ({ ...CERRADO }))).map((d) => ({ ...d }));
  }

  guardarHorario(idCafeteria: string, dias: DemoDiaHorario[]): void {
    const e = this.leer();
    this.escribir({ ...e, horarios: { ...e.horarios, [this.idDemo(idCafeteria)]: dias.map((d) => ({ ...d })) } });
  }

  cerradoHoy(idCafeteria: string, ahora = new Date()): boolean {
    return this.leer().cerradoHoy[this.idDemo(idCafeteria)] === fechaLocal(ahora);
  }

  cerrarHoy(idCafeteria: string, ahora = new Date()): void {
    const e = this.leer();
    this.escribir({ ...e, cerradoHoy: { ...e.cerradoHoy, [this.idDemo(idCafeteria)]: fechaLocal(ahora) } });
  }

  reabrir(idCafeteria: string): void {
    const e = this.leer();
    const cerradoHoy = { ...e.cerradoHoy };
    delete cerradoHoy[this.idDemo(idCafeteria)];
    this.escribir({ ...e, cerradoHoy });
  }

  /** Si abre ahora, según su horario de hoy y el "cerrar por hoy". */
  estadoHoy(idCafeteria: string, ahora = new Date()): EstadoHoy {
    const d = this.horario(idCafeteria)[indiceDia(ahora)];
    if (this.cerradoHoy(idCafeteria, ahora)) {
      return { abierta: false, abreA: null, cierraA: null, cerradoHoy: true };
    }
    if (!d?.abre) return { abierta: false, abreA: null, cierraA: null, cerradoHoy: false };
    const minutos = ahora.getHours() * 60 + ahora.getMinutes();
    return {
      abierta: minutos >= aMinutos(d.desde) && minutos < aMinutos(d.hasta),
      abreA: d.desde,
      cierraA: d.hasta,
      cerradoHoy: false,
    };
  }

  // ---------- Promociones ----------

  promociones(idCafeteria?: string): DemoPromocionNegocio[] {
    const todas = this.leer().promociones;
    const id = idCafeteria && this.idDemo(idCafeteria);
    return (id ? todas.filter((p) => p.idCafeteria === id) : todas).map((p) => ({ ...p }));
  }

  /** Activas y vigentes hoy: las que ve el alumno. */
  promocionesVigentes(ahora = new Date()): DemoPromocionNegocio[] {
    const hoy = fechaLocal(ahora);
    return this.promociones().filter((p) => p.activa && p.desde <= hoy && hoy <= p.hasta);
  }

  /** Crea (id vacío) o reemplaza. Responde la guardada. */
  guardarPromocion(promo: DemoPromocionNegocio): DemoPromocionNegocio {
    const e = this.leer();
    const guardada = {
      ...promo,
      idCafeteria: this.idDemo(promo.idCafeteria),
      id: promo.id || `promo-${crypto.randomUUID().slice(0, 8)}`,
    };
    const existe = e.promociones.some((p) => p.id === guardada.id);
    this.escribir({
      ...e,
      promociones: existe
        ? e.promociones.map((p) => (p.id === guardada.id ? guardada : p))
        : [guardada, ...e.promociones],
    });
    return { ...guardada };
  }

  eliminarPromocion(id: string): boolean {
    const e = this.leer();
    if (!e.promociones.some((p) => p.id === id)) return false;
    this.escribir({ ...e, promociones: e.promociones.filter((p) => p.id !== id) });
    return true;
  }

  // ---------- Almacenamiento ----------

  private leer(): Estado {
    try {
      const crudo = localStorage.getItem(CLAVE_DEMO_NEGOCIO);
      if (crudo) {
        const e = JSON.parse(crudo) as Partial<Estado>;
        if (e.horarios && e.cerradoHoy && Array.isArray(e.promociones)) return e as Estado;
      }
    } catch {
      return (this.enMemoria ??= semilla(new Date()));
    }
    return this.enMemoria ?? semilla(new Date());
  }

  private escribir(e: Estado): void {
    try {
      localStorage.setItem(CLAVE_DEMO_NEGOCIO, JSON.stringify(e));
    } catch {
      this.enMemoria = e;
    }
  }
}
