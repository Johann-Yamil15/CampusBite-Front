import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, defer, finalize, map, of, tap } from 'rxjs';
import { ApiError } from '@core/http/api-error';
import { AuthFacade } from '@features/auth';
import { PerfilRepository } from '@features/alumno/domain/repositories/perfil.repository';
import {
  DatosPersonales,
  PREFERENCIAS_INICIALES,
  PerfilAlumno,
  PreferenciasAlumno,
  iniciales,
  nombreVisible,
} from '@features/alumno/domain/models/perfil.model';

/**
 * CL-Sprint5 11/11/2026 (etapa 8): perfil del alumno, una instancia en el layout (como FavoritosFacade).
 * De aquí salen el nombre y las iniciales que muestran el layout, el inicio y el perfil (antes cada uno lo
 * armaba distinto y el perfil decía "alumno" en minúsculas), y las preferencias que usa el checkout.
 * Los métodos devuelven un Observable frío: hay que suscribirse. Los errores de guardar le llegan a quien
 * se suscribe; `error()` es solo de la carga.
 */
@Injectable()
export class PerfilFacade {
  private readonly repo = inject(PerfilRepository);
  private readonly auth = inject(AuthFacade);

  private readonly _perfil = signal<PerfilAlumno | null>(null);
  readonly perfil = this._perfil.asReadonly();
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  /** El correo de la sesión gana (es el real); el del perfil sirve tras recargar antes de /me. */
  readonly correo = computed(() => this.auth.user()?.email ?? this._perfil()?.correo ?? null);
  readonly nombre = computed(() => nombreVisible(this._perfil()?.datos.nombre, this.correo()));
  readonly primerNombre = computed(() => this.nombre().split(' ')[0]);
  readonly iniciales = computed(() => iniciales(this.nombre()));
  readonly preferencias = computed(() => this._perfil()?.preferencias ?? PREFERENCIAS_INICIALES);

  cargar(forzar = false): Observable<PerfilAlumno> {
    const actual = this._perfil();
    if (actual && !forzar) return of(actual);
    return defer(() => {
      this.cargando.set(true);
      this.error.set(null);
      return this.repo.obtener().pipe(
        tap({
          next: (perfil) => this._perfil.set(perfil),
          error: (e: ApiError) => this.error.set(e?.message ?? 'No pudimos cargar tu perfil.'),
        }),
        finalize(() => this.cargando.set(false)),
      );
    });
  }

  guardarDatos(datos: DatosPersonales): Observable<void> {
    return this.repo.actualizarDatos(datos).pipe(
      tap((guardados) => this._perfil.update((p) => (p ? { ...p, datos: guardados } : p))),
      map(() => undefined),
    );
  }

  /** Guarda un cambio parcial (un interruptor, el método preferido…) sobre las preferencias actuales. */
  guardarPreferencias(cambio: Partial<PreferenciasAlumno>): Observable<void> {
    return defer(() =>
      this.repo.actualizarPreferencias({ ...this.preferencias(), ...cambio }).pipe(
        tap((preferencias) => this._perfil.update((p) => (p ? { ...p, preferencias } : p))),
        map(() => undefined),
      ),
    );
  }

  cambiarPassword(actual: string, nueva: string): Observable<void> {
    return this.repo.cambiarPassword(actual, nueva);
  }
}
