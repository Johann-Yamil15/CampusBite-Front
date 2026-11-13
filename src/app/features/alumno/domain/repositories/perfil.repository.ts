import { Observable } from 'rxjs';
import {
  DatosPersonales,
  PerfilAlumno,
  PreferenciasAlumno,
} from '@features/alumno/domain/models/perfil.model';

/**
 * CL-Sprint5 11/11/2026 (etapa 8): contrato del perfil del alumno. No existe en el back (propuesto en
 * BACKEND_SPECIFICATION.md); se enlaza en alumno.providers.ts con el mock.
 *
 * Errores (ApiError): 400 contraseña actual incorrecta, 401 sin sesión, 422 datos inválidos (mismas reglas
 * que el registro).
 */
export abstract class PerfilRepository {
  abstract obtener(): Observable<PerfilAlumno>;
  /** Responde los datos como quedaron guardados. */
  abstract actualizarDatos(datos: DatosPersonales): Observable<DatosPersonales>;
  abstract actualizarPreferencias(preferencias: PreferenciasAlumno): Observable<PreferenciasAlumno>;
  abstract cambiarPassword(actual: string, nueva: string): Observable<void>;
}
