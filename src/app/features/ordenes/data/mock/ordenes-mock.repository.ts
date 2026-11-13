import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MockBackend, MockHttpError } from '@core/mock/mock-backend';
import {
  DEMO_ALUMNO,
  DEMO_CAFETERIAS,
  DEMO_CAFETERIA_ENCARGADO,
  DEMO_PRODUCTOS,
} from '@features/catalogo/data/mock/catalogo.mock-data';
import { OrdenesRepository } from '@features/ordenes/domain/repositories/ordenes.repository';
import {
  EstadoAvanceCafeteria,
  EstadoOrden,
  LONGITUD_CODIGO_RECOGIDA,
  MAX_CANTIDAD_POR_PRODUCTO,
  MINUTOS_MINIMOS_RECOGIDA,
  NuevaOrden,
  Orden,
  ReporteProblema,
  ReporteRecibido,
  cancelablePorAlumno,
  folioDe,
  puedeTransicionar,
  reporteValido,
  totalLineas,
} from '@features/ordenes/domain/models/orden.model';
import { RegistroOrdenMock, estadoPagoDe, lineaDemo, ordenesDemo } from './ordenes.mock-data';

/**
 * CL-Sprint5 11/11/2026: órdenes simuladas mientras el back no tiene OrdenesController. Aplica las mismas
 * reglas que los SP de la BD (sp_crear_orden, sp_cancelar_orden, sp_cambiar_estado_orden,
 * sp_entregar_orden y el trigger de transiciones) y responde con sus mismos mensajes.
 * CL-Sprint5 13/11/2026: solo para pruebas (la app usa el back); se enlaza con provideOrdenesMock(). Se quitó
 * la "cocina simulada" (MOCK_COCINA): las órdenes las mueve el encargado desde el tablero.
 *
 * El alumno con sesión es siempre el alumno de la demo, y el tablero de cualquier cafetería incluye las de
 * la cafetería demo del encargado (el mock no conoce la cafetería real del encargado).
 */
@Injectable()
export class OrdenesMockRepository extends OrdenesRepository {
  private readonly backend = inject(MockBackend);
  private readonly registros: RegistroOrdenMock[] = ordenesDemo();
  /** Órdenes que ya tienen un reporte (uno por orden). */
  private readonly reportadas = new Set<string>();

  // ---------- Alumno ----------

  crear(nueva: NuevaOrden): Observable<Orden> {
    return this.backend.responder(() => {
      const c = DEMO_CAFETERIAS.find((x) => x.id === nueva.idCafeteria);
      if (!c) throw new MockHttpError(400, 'La cafetería no existe o no está activa');
      // CL-Sprint5 11/11/2026 (etapa 9): respeta si está abierta y su hora de cierre (fijas en los datos)
      const hoy = { abierta: c.abierta, cierraA: c.cierraA };
      if (!hoy.abierta) throw new MockHttpError(400, 'La cafetería está cerrada en este momento');
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
      const r = new Date(nueva.recogidaEn);
      if (hoy.cierraA && r.getHours() * 60 + r.getMinutes() > aMinutos(hoy.cierraA)) {
        throw new MockHttpError(400, `La cafetería cierra a las ${hoy.cierraA}; elige una hora antes`);
      }
      if (nueva.items.some((i) => i.cantidad < 1 || i.cantidad > MAX_CANTIDAD_POR_PRODUCTO)) {
        throw new MockHttpError(400, 'La cantidad por producto debe estar entre 1 y 20');
      }

      const lineas = nueva.items.map((i) => lineaDemo(i.idProducto, i.cantidad));
      // Efectivo nace confirmada; tarjeta y transferencia, pendiente (hasta confirmar el pago).
      // CL-Sprint5 11/11/2026 (etapa 5): la tarjeta simula una pasarela que cobra en el acto (el back
      // llamaría a sp_confirmar_pago): queda confirmada y pagada. La transferencia sigue pendiente hasta
      // que la cafetería la confirme.
      const estado: EstadoOrden = nueva.metodo === 'transferencia' ? 'pendiente' : 'confirmada';
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
        motivoCancelacion: null,
        lineas,
      };
      const registro = { idAlumno: DEMO_ALUMNO.id, orden };
      this.registros.unshift(registro);
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
      r.orden = { ...r.orden, motivoCancelacion: 'Cancelado por el alumno' };
      return paraAlumno(r.orden);
    });
  }

  reportar(idOrden: string, reporte: ReporteProblema): Observable<ReporteRecibido> {
    return this.backend.responder(() => {
      const r = this.buscar(idOrden);
      if (r.idAlumno !== DEMO_ALUMNO.id) throw new MockHttpError(404, 'La orden no existe');
      if (!reporteValido(reporte)) {
        throw new MockHttpError(400, 'Cuéntanos qué pasó (al menos 10 caracteres, máximo 300)');
      }
      if (this.reportadas.has(idOrden)) {
        throw new MockHttpError(409, 'Ya reportaste un problema con este pedido; lo estamos revisando');
      }
      this.reportadas.add(idOrden);
      return { folio: `R-${codigoAleatorio()}` };
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
        .map((r) => paraCafeteria(r.orden))
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
      return paraCafeteria(r.orden);
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
      return paraCafeteria(r.orden);
    });
  }

  rechazar(idOrden: string, motivo: string): Observable<Orden> {
    return this.backend.responder(() => {
      const r = this.buscar(idOrden);
      if (!motivo.trim()) throw new MockHttpError(400, 'Indica el motivo del rechazo');
      this.mover(r, 'cancelada');
      r.orden = { ...r.orden, motivoCancelacion: motivo.trim() };
      return paraCafeteria(r.orden);
    });
  }

  confirmarPago(idOrden: string): Observable<Orden> {
    return this.backend.responder(() => {
      const r = this.buscar(idOrden);
      if (r.orden.estado !== 'pendiente') {
        throw new MockHttpError(400, 'El pago de esta orden ya estaba confirmado');
      }
      this.mover(r, 'confirmada');
      return paraCafeteria(r.orden);
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

/** CL-Sprint5 13/11/2026: como el back, el tablero no recibe el código (el encargado lo teclea). */
function paraCafeteria(orden: Orden): Orden {
  return { ...structuredClone(orden), codigoRecogida: null };
}

/** 6 dígitos con aleatoriedad criptográfica, como sp_crear_orden. */
function codigoAleatorio(): string {
  const [n] = crypto.getRandomValues(new Uint32Array(1));
  return String(n % 10 ** LONGITUD_CODIGO_RECOGIDA).padStart(LONGITUD_CODIGO_RECOGIDA, '0');
}

/** "HH:mm" → minutos desde la medianoche. */
function aMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}
