import { Observable } from 'rxjs';
import {
  DatosPersonales,
  PerfilAlumno,
  PreferenciasAlumno,
} from '@features/alumno/domain/models/perfil.model';

/**
 * CL-Sprint5 11/11/2026 (etapa 8): contrato del perfil del alumno. Se enlaza en alumno.providers.ts con
 * PerfilHttpRepository (CL-Sprint5 13/11/2026).
 *
 * Errores (ApiError): 400 datos inválidos (mismas reglas que el registro) o contraseña actual incorrecta,
 * 401 sin sesión, 409 matrícula repetida, 429 demasiados intentos.
 */
export abstract class PerfilRepository {
  abstract obtener(): Observable<PerfilAlumno>;
  /** Responde los datos como quedaron guardados. */
  abstract actualizarDatos(datos: DatosPersonales): Observable<DatosPersonales>;
  abstract actualizarPreferencias(preferencias: PreferenciasAlumno): Observable<PreferenciasAlumno>;
  abstract cambiarPassword(actual: string, nueva: string): Observable<void>;
}
