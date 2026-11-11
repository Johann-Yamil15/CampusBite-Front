import { Observable } from 'rxjs';
import {
  EstadoAvanceCafeteria,
  NuevaOrden,
  Orden,
} from '@features/ordenes/domain/models/orden.model';

/**
 * CL-Sprint5 11/11/2026: contrato (puerto) de las órdenes, para el alumno y para la cafetería. Los SP ya
 * existen en la BD (sp_crear_orden, sp_mis_ordenes, sp_cancelar_orden, sp_cola_cafeteria,
 * sp_cambiar_estado_orden, sp_entregar_orden); falta el controller. Se enlaza en ordenes.providers.ts.
 *
 * Errores (ApiError): 400 regla de negocio (cafetería cerrada, transición no permitida, código incorrecto),
 * 403 no es su orden / su cafetería, 404 no existe.
 */
export abstract class OrdenesRepository {
  // ---------- Alumno ----------
  /** Crea la orden con lo del carrito. Responde la orden completa, con su código de recogida. */
  abstract crear(nueva: NuevaOrden): Observable<Orden>;
  /** Órdenes del alumno con sesión, más recientes primero. */
  abstract misOrdenes(): Observable<Orden[]>;
  /** Una orden con sus líneas. El alumno solo ve las suyas; la cafetería, las de su negocio. */
  abstract obtener(idOrden: string): Observable<Orden>;
  /** Solo en pendiente o confirmada. */
  abstract cancelar(idOrden: string): Observable<Orden>;

  // ---------- Cafetería ----------
  /** Órdenes del día de la cafetería (activas y cerradas), por hora de recogida. */
  abstract ordenesCafeteria(idCafeteria: string): Observable<Orden[]>;
  abstract cambiarEstado(idOrden: string, estado: EstadoAvanceCafeteria): Observable<Orden>;
  /** Entrega validando el código de recogida que muestra el alumno. Solo desde "lista". */
  abstract entregar(idOrden: string, codigoRecogida: string): Observable<Orden>;
  /** La cafetería rechaza/cancela con un motivo que se le muestra al alumno. */
  abstract rechazar(idOrden: string, motivo: string): Observable<Orden>;
}
