import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '@core/http/api-client.service';
import { PerfilRepository } from '@features/alumno/domain/repositories/perfil.repository';
import {
  DatosPersonales,
  PerfilAlumno,
  PreferenciasAlumno,
} from '@features/alumno/domain/models/perfil.model';
import {
  DatosAlumnoDto,
  PerfilAlumnoDto,
  PreferenciasAlumnoDto,
} from '@features/alumno/data/dtos/alumno.dto';
import { PerfilMapper } from '@features/alumno/data/mappers/perfil.mapper';

/**
 * CL-Sprint5 11/11/2026 (etapa 8): `api/alumnos/me/...` y `api/auth/cambiar-password`.
 * CL-Sprint5 13/11/2026: conectado al back (PR #38). Errores: 400 validación o contraseña actual incorrecta,
 * 409 matrícula repetida, 429 demasiados intentos al cambiar la contraseña.
 */
@Injectable()
export class PerfilHttpRepository extends PerfilRepository {
  private readonly api = inject(ApiClient);

  obtener(): Observable<PerfilAlumno> {
    return this.api.get<PerfilAlumnoDto>('alumnos/me/perfil').pipe(map(PerfilMapper.toDomain));
  }

  actualizarDatos(datos: DatosPersonales): Observable<DatosPersonales> {
    return this.api
      .put<DatosAlumnoDto>('alumnos/me/perfil', PerfilMapper.toDatosRequest(datos))
      .pipe(map(PerfilMapper.toDatos));
  }

  actualizarPreferencias(preferencias: PreferenciasAlumno): Observable<PreferenciasAlumno> {
    return this.api
      .put<PreferenciasAlumnoDto>(
        'alumnos/me/preferencias',
        PerfilMapper.toPreferenciasRequest(preferencias),
      )
      .pipe(map(PerfilMapper.toPreferencias));
  }

  cambiarPassword(actual: string, nueva: string): Observable<void> {
    return this.api.post<void>('auth/cambiar-password', {
      passwordActual: actual,
      passwordNueva: nueva,
    });
  }
}
