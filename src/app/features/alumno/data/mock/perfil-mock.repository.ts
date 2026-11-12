import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MockBackend, MockHttpError } from '@core/mock/mock-backend';
import { TokenStorageService } from '@core/services/token-storage.service';
import { readJwtClaim } from '@core/utils/jwt.util';
import { PerfilRepository } from '@features/alumno/domain/repositories/perfil.repository';
import {
  DatosPersonales,
  PREFERENCIAS_INICIALES,
  PerfilAlumno,
  PreferenciasAlumno,
  sinErrores,
  validarCambioPassword,
  validarDatos,
} from '@features/alumno/domain/models/perfil.model';

/** Prefijo de la clave en localStorage; se completa con el `sub` del JWT. */
export const CLAVE_PERFIL = 'cb.perfil.';

/** Contraseña de las cuentas de prueba: la "actual" que acepta el mock. */
export const PASSWORD_DEMO = 'Password123';

interface Guardado {
  datos: DatosPersonales;
  preferencias: PreferenciasAlumno;
}

/**
 * CL-Sprint5 11/11/2026 (etapa 8): perfil simulado mientras el back no tiene el endpoint. Datos y
 * preferencias se guardan en localStorage por usuario (cb.perfil.<sub del JWT>). La contraseña NO se guarda:
 * el mock solo valida que la actual sea la de las cuentas de prueba y aplica las reglas del registro.
 * Para conectar el back se cambia `useClass` en alumno.providers.ts.
 */
@Injectable()
export class PerfilMockRepository extends PerfilRepository {
  private readonly backend = inject(MockBackend);
  private readonly tokens = inject(TokenStorageService);
  private enMemoria: Guardado | null = null;

  obtener(): Observable<PerfilAlumno> {
    return this.backend.responder(() => {
      const g = this.leer();
      return {
        correo: readJwtClaim(this.tokens.get(), 'email') ?? '',
        datos: { ...g.datos },
        preferencias: { ...g.preferencias },
      };
    });
  }

  actualizarDatos(datos: DatosPersonales): Observable<DatosPersonales> {
    return this.backend.responder(() => {
      const errores = validarDatos({
        nombre: datos.nombre ?? '',
        matricula: datos.matricula ?? '',
        telefono: datos.telefono ?? '',
      });
      if (!sinErrores(errores)) throw new MockHttpError(422, Object.values(errores)[0]!);
      this.escribir({ ...this.leer(), datos: { ...datos } });
      return { ...datos };
    });
  }

  actualizarPreferencias(preferencias: PreferenciasAlumno): Observable<PreferenciasAlumno> {
    return this.backend.responder(() => {
      this.escribir({ ...this.leer(), preferencias: { ...preferencias } });
      return { ...preferencias };
    });
  }

  cambiarPassword(actual: string, nueva: string): Observable<void> {
    return this.backend.responder(() => {
      const errores = validarCambioPassword({ actual, nueva, confirmacion: nueva });
      if (!sinErrores(errores)) throw new MockHttpError(422, Object.values(errores)[0]!);
      if (actual !== PASSWORD_DEMO) throw new MockHttpError(400, 'La contraseña actual no es correcta.');
    });
  }

  // ---------- Almacenamiento ----------

  private clave(): string {
    return CLAVE_PERFIL + (readJwtClaim(this.tokens.get(), 'sub') ?? 'anonimo');
  }

  private leer(): Guardado {
    try {
      const crudo = localStorage.getItem(this.clave());
      if (crudo) {
        const g = JSON.parse(crudo) as Partial<Guardado>;
        if (g.datos && g.preferencias) {
          return { datos: g.datos, preferencias: { ...PREFERENCIAS_INICIALES, ...g.preferencias } };
        }
      }
    } catch {
      if (this.enMemoria) return this.enMemoria;
    }
    return inicial();
  }

  private escribir(g: Guardado): void {
    try {
      localStorage.setItem(this.clave(), JSON.stringify(g));
    } catch {
      this.enMemoria = g;
    }
  }
}

function inicial(): Guardado {
  return {
    datos: { nombre: null, matricula: null, telefono: null },
    preferencias: { ...PREFERENCIAS_INICIALES },
  };
}
