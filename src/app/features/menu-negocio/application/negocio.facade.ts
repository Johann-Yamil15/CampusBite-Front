import { Injectable, inject, signal } from '@angular/core';
import { Observable, defer, finalize, map, tap } from 'rxjs';
import { ApiError } from '@core/http/api-error';
import { NegocioRepository } from '@features/menu-negocio/domain/repositories/negocio.repository';
import {
  DiaHorario,
  HorarioNegocio,
  PromocionNegocio,
} from '@features/menu-negocio/domain/models/negocio.model';

/**
 * CL-Sprint5 11/11/2026 (etapa 9): horario y promociones del negocio para sus pantallas. Se provee en
 * menu-negocio.routes.ts (layout de las secciones). Los métodos devuelven un Observable frío: hay que
 * suscribirse. `cargando()`/`error()` son de las cargas; los errores de guardar le llegan a quien se suscribe.
 */
@Injectable()
export class NegocioFacade {
  private readonly repo = inject(NegocioRepository);

  readonly horario = signal<HorarioNegocio | null>(null);
  readonly promociones = signal<PromocionNegocio[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  cargarHorario(idCafeteria: string): Observable<HorarioNegocio> {
    return this.cargar(this.repo.horario(idCafeteria), (h) => this.horario.set(h), 'el horario');
  }

  cargarPromociones(idCafeteria: string): Observable<PromocionNegocio[]> {
    return this.cargar(this.repo.promociones(idCafeteria), (l) => this.promociones.set(l), 'las promociones');
  }

  guardarDia(idCafeteria: string, indice: number, dia: DiaHorario): Observable<HorarioNegocio> {
    return defer(() => {
      const dias = [...(this.horario()?.dias ?? [])];
      dias[indice] = dia;
      return this.repo.guardarHorario(idCafeteria, dias).pipe(tap((h) => this.horario.set(h)));
    });
  }

  cerrarHoy(idCafeteria: string): Observable<HorarioNegocio> {
    return this.repo.cerrarHoy(idCafeteria).pipe(tap((h) => this.horario.set(h)));
  }

  reabrir(idCafeteria: string): Observable<HorarioNegocio> {
    return this.repo.reabrir(idCafeteria).pipe(tap((h) => this.horario.set(h)));
  }

  guardarPromocion(idCafeteria: string, promo: PromocionNegocio): Observable<PromocionNegocio> {
    return this.repo.guardarPromocion(idCafeteria, promo).pipe(
      tap((guardada) =>
        this.promociones.update((l) =>
          l.some((p) => p.id === guardada.id)
            ? l.map((p) => (p.id === guardada.id ? guardada : p))
            : [guardada, ...l],
        ),
      ),
    );
  }

  eliminarPromocion(idCafeteria: string, idPromocion: string): Observable<void> {
    return this.repo.eliminarPromocion(idCafeteria, idPromocion).pipe(
      tap(() => this.promociones.update((l) => l.filter((p) => p.id !== idPromocion))),
      map(() => undefined),
    );
  }

  private cargar<T>(fuente: Observable<T>, poner: (v: T) => void, que: string): Observable<T> {
    return defer(() => {
      this.cargando.set(true);
      this.error.set(null);
      return fuente.pipe(
        tap({
          next: poner,
          error: (e: ApiError) => this.error.set(e?.message ?? `No pudimos cargar ${que}.`),
        }),
        finalize(() => this.cargando.set(false)),
      );
    });
  }
}
