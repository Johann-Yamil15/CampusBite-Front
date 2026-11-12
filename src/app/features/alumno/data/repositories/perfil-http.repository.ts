import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '@core/http/api-client.service';
import { PerfilRepository } from '@features/alumno/domain/repositories/perfil.repository';
import {
  DatosPersonales,
  PerfilAlumno,
  PreferenciasAlumno,
} from '@features/alumno/domain/models/perfil.model';

/**
 * CL-Sprint5 11/11/2026 (etapa 8): `api/alumnos/me/...` y `api/auth/cambiar-password` (propuestos en
 * BACKEND_SPECIFICATION.md; aún no existen). Las respuestas ya vienen con la forma del dominio.
 */
@Injectable()
export class PerfilHttpRepository extends PerfilRepository {
  private readonly api = inject(ApiClient);

  obtener(): Observable<PerfilAlumno> {
    return this.api.get<PerfilAlumno>('alumnos/me/perfil');
  }

  actualizarDatos(datos: DatosPersonales): Observable<DatosPersonales> {
    return this.api.put<DatosPersonales>('alumnos/me/perfil', datos);
  }

  actualizarPreferencias(preferencias: PreferenciasAlumno): Observable<PreferenciasAlumno> {
    return this.api.put<PreferenciasAlumno>('alumnos/me/preferencias', preferencias);
  }

  cambiarPassword(actual: string, nueva: string): Observable<void> {
    return this.api.post<void>('auth/cambiar-password', { passwordActual: actual, passwordNueva: nueva });
  }
}
