import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MockBackend, MockHttpError } from '@core/mock/mock-backend';
import {
  DEMO_ALUMNO,
  DEMO_CAFETERIAS,
  DEMO_CAFETERIA_ENCARGADO,
  DEMO_PRODUCTOS,
} from '@core/mock/demo-db';
import { OrdenesRepository } from '@features/ordenes/domain/repositories/ordenes.repository';
import {
  EstadoAvanceCafeteria,
  EstadoOrden,
  LONGITUD_CODIGO_RECOGIDA,
  MAX_CANTIDAD_POR_PRODUCTO,
  MINUTOS_MINIMOS_RECOGIDA,
  NuevaOrden,
  Orden,
  cancelablePorAlumno,
  folioDe,
  puedeTransicionar,
  totalLineas,
} from '@features/ordenes/domain/models/orden.model';
import { RegistroOrdenMock, estadoPagoDe, lineaDemo, ordenesDemo } from './ordenes.mock-data';

/**
 * CL-Sprint5 11/11/2026: órdenes simuladas mientras el back no tiene OrdenesController. Aplica las mismas
 * reglas que los SP de la BD (sp_crear_orden, sp_cancelar_orden, sp_cambiar_estado_orden,
 * sp_entregar_orden y el trigger de transiciones) y responde con sus mismos mensajes, así la UI se prueba
 * contra los errores reales. Para conectar el back se cambia `useClass` en ordenes.providers.ts.
 *
 * El alumno con sesión es siempre el alumno de la demo, y el tablero de cualquier cafetería incluye las de
 * la cafetería demo del encargado (el mock no conoce la cafetería real del encargado).
 */
@Injectable()
export class OrdenesMockRepository extends OrdenesRepository {
  private readonly backend = inject(MockBackend);
  private readonly registros: RegistroOrdenMock[] = ordenesDemo();

  // ---------- Alumno ----------

  crear(nueva: NuevaOrden): Observable<Orden> {
    return this.backend.responder(() => {
      const c = DEMO_CAFETERIAS.find((x) => x.id === nueva.idCafeteria);
      if (!c) throw new MockHttpError(400, 'La cafetería no existe o no está activa');
      if (!c.metodosPago.includes(nueva.metodo)) {
        throw new MockHttpError(400, `La cafetería no acepta el método de pago ${nueva.metodo}`);
      }
      const recogida = new Date(nueva.recogidaEn).getTime();
      if (!(recogida >= Date.now() + MINUTOS_MINIMOS_RECOGIDA * 60_000)) {
        throw new MockHttpError(400, 'La hora de recogida debe ser al menos 5 minutos en el futuro');
      }
      if (!nueva.items.length) throw new MockHttpError(400, 'La orden debe incluir al menos un producto');
      const ajenos = nueva.items.some(
        (i) => !DEMO_PRODUCTOS.some((p) => p.id === i.idProducto && p.idCafeteria === c.id),
      );
      if (ajenos) {
        throw new MockHttpError(400, 'Hay productos inexistentes, no disponibles o de otra cafetería');
      }
      if (nueva.items.some((i) => i.cantidad < 1 || i.cantidad > MAX_CANTIDAD_POR_PRODUCTO)) {
        throw new MockHttpError(400, 'La cantidad por producto debe estar entre 1 y 20');
      }

      const lineas = nueva.items.map((i) => lineaDemo(i.idProducto, i.cantidad));
      // Efectivo nace confirmada; tarjeta y transferencia, pendiente (hasta confirmar el pago)
      const estado: EstadoOrden = nueva.metodo === 'efectivo' ? 'confirmada' : 'pendiente';
      const idOrden = crypto.randomUUID();
      const orden: Orden = {
        idOrden,
        folio: folioDe(idOrden),
        idCafeteria: c.id,
        cafeteria: c.nombre,
        logoCafeteria: c.logo,
        puntoEntrega: c.puntoEntrega,
        alumno: { nombre: DEMO_ALUMNO.nombre, matricula: DEMO_ALUMNO.matricula },
        estado,
        recogidaEn: nueva.recogidaEn,
        creadoEn: new Date().toISOString(),
        codigoRecogida: codigoAleatorio(),
        total: totalLineas(lineas),
        metodo: nueva.metodo,
        estadoPago: estadoPagoDe(nueva.metodo, estado),
        notas: nueva.notas?.trim() || null,
        lineas,
      };
      this.registros.unshift({ idAlumno: DEMO_ALUMNO.id, orden });
      return paraAlumno(orden);
    });
  }

  misOrdenes(): Observable<Orden[]> {
    return this.backend.responder(() =>
      this.registros
        .filter((r) => r.idAlumno === DEMO_ALUMNO.id)
        .map((r) => paraAlumno(r.orden))
        .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn)),
    );
  }

  obtener(idOrden: string): Observable<Orden> {
    return this.backend.responder(() => structuredClone(this.buscar(idOrden).orden));
  }

  cancelar(idOrden: string): Observable<Orden> {
    return this.backend.responder(() => {
      const r = this.buscar(idOrden);
      if (r.idAlumno !== DEMO_ALUMNO.id) throw new MockHttpError(404, 'La orden no existe');
      if (!cancelablePorAlumno(r.orden)) {
        throw new MockHttpError(400, 'La orden ya está en preparación y no se puede cancelar');
      }
      this.mover(r, 'cancelada');
      return paraAlumno(r.orden);
    });
  }

  // ---------- Cafetería ----------

  ordenesCafeteria(idCafeteria: string): Observable<Orden[]> {
    return this.backend.responder(() =>
      this.registros
        .filter(
          (r) =>
            r.orden.idCafeteria === idCafeteria ||
            r.orden.idCafeteria === DEMO_CAFETERIA_ENCARGADO,
        )
        .map((r) => structuredClone(r.orden))
        .sort((a, b) => a.recogidaEn.localeCompare(b.recogidaEn)),
    );
  }

  cambiarEstado(idOrden: string, estado: EstadoAvanceCafeteria): Observable<Orden> {
    return this.backend.responder(() => {
      const r = this.buscar(idOrden);
      if (r.orden.estado === 'pendiente') {
        throw new MockHttpError(400, 'La orden está esperando la confirmación del pago');
      }
      this.mover(r, estado);
      return structuredClone(r.orden);
    });
  }

  entregar(idOrden: string, codigoRecogida: string): Observable<Orden> {
    return this.backend.responder(() => {
      const r = this.buscar(idOrden);
      if (r.orden.estado !== 'lista') throw new MockHttpError(400, 'La orden no está lista para entrega');
      if (r.orden.codigoRecogida !== codigoRecogida.trim()) {
        throw new MockHttpError(400, 'Código de recogida incorrecto');
      }
      this.mover(r, 'entregada');
      return structuredClone(r.orden);
    });
  }

  rechazar(idOrden: string, motivo: string): Observable<Orden> {
    return this.backend.responder(() => {
      const r = this.buscar(idOrden);
      if (!motivo.trim()) throw new MockHttpError(400, 'Indica el motivo del rechazo');
      this.mover(r, 'cancelada');
      return structuredClone(r.orden);
    });
  }

  // ---------- Internos ----------

  private buscar(idOrden: string): RegistroOrdenMock {
    const r = this.registros.find((x) => x.orden.idOrden === idOrden);
    if (!r) throw new MockHttpError(404, 'La orden no existe');
    return r;
  }

  /** Cambia el estado respetando el trigger de transiciones de la BD. */
  private mover(r: RegistroOrdenMock, estado: EstadoOrden): void {
    if (!puedeTransicionar(r.orden.estado, estado)) {
      throw new MockHttpError(
        400,
        `Transición de estado no permitida: ${r.orden.estado} -> ${estado}`,
      );
    }
    r.orden = {
      ...r.orden,
      estado,
      estadoPago: estadoPagoDe(r.orden.metodo, estado),
    };
  }
}

/** El alumno no recibe sus propios datos de alumno (eso es para la cafetería). */
function paraAlumno(orden: Orden): Orden {
  return { ...structuredClone(orden), alumno: null };
}

/** 6 dígitos con aleatoriedad criptográfica, como sp_crear_orden. */
function codigoAleatorio(): string {
  const [n] = crypto.getRandomValues(new Uint32Array(1));
  return String(n % 10 ** LONGITUD_CODIGO_RECOGIDA).padStart(LONGITUD_CODIGO_RECOGIDA, '0');
}
