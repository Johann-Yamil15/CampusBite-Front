import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MockBackend, MockHttpError } from '@core/mock/mock-backend';
import { DemoNegocioStore } from '@core/mock/demo-negocio.store';
import { NegocioRepository } from '@features/menu-negocio/domain/repositories/negocio.repository';
import {
  DIAS,
  DiaHorario,
  HorarioNegocio,
  PromocionNegocio,
  diaValido,
  validarPromocion,
} from '@features/menu-negocio/domain/models/negocio.model';

/**
 * CL-Sprint5 11/11/2026 (etapa 9): horario y promociones simulados sobre DemoNegocioStore, la misma "BD" que
 * lee el catálogo del alumno: guardar aquí cambia lo que el alumno ve (abierto/cerrado, horarios de recogida,
 * carrusel y tienda). Aplica las mismas reglas que el dominio y responde 422 como lo haría el back.
 */
@Injectable()
export class NegocioMockRepository extends NegocioRepository {
  private readonly backend = inject(MockBackend);
  private readonly store = inject(DemoNegocioStore);

  horario(idCafeteria: string): Observable<HorarioNegocio> {
    return this.backend.responder(() => this.leerHorario(idCafeteria));
  }

  guardarHorario(idCafeteria: string, dias: DiaHorario[]): Observable<HorarioNegocio> {
    return this.backend.responder(() => {
      if (dias.length !== DIAS.length) throw new MockHttpError(422, 'El horario debe tener los 7 días');
      const malo = dias.findIndex((d) => !diaValido(d));
      if (malo >= 0) {
        throw new MockHttpError(422, `${DIAS[malo]}: la hora de cierre tiene que ser después de la de apertura`);
      }
      this.store.guardarHorario(idCafeteria, dias);
      return this.leerHorario(idCafeteria);
    });
  }

  cerrarHoy(idCafeteria: string): Observable<HorarioNegocio> {
    return this.backend.responder(() => {
      this.store.cerrarHoy(idCafeteria);
      return this.leerHorario(idCafeteria);
    });
  }

  reabrir(idCafeteria: string): Observable<HorarioNegocio> {
    return this.backend.responder(() => {
      this.store.reabrir(idCafeteria);
      return this.leerHorario(idCafeteria);
    });
  }

  promociones(idCafeteria: string): Observable<PromocionNegocio[]> {
    return this.backend.responder(() => this.store.promociones(idCafeteria).map(aDominio));
  }

  guardarPromocion(idCafeteria: string, promo: PromocionNegocio): Observable<PromocionNegocio> {
    return this.backend.responder(() => {
      const errores = Object.values(validarPromocion(promo));
      if (errores.length) throw new MockHttpError(422, errores[0]!);
      if (promo.id && !this.store.promociones(idCafeteria).some((p) => p.id === promo.id)) {
        throw new MockHttpError(404, 'La promoción no existe');
      }
      return aDominio(
        this.store.guardarPromocion({
          ...promo,
          nombre: promo.nombre.trim(),
          descripcion: promo.descripcion.trim(),
          idCafeteria,
        }),
      );
    });
  }

  eliminarPromocion(idCafeteria: string, idPromocion: string): Observable<void> {
    return this.backend.responder(() => {
      if (!this.store.promociones(idCafeteria).some((p) => p.id === idPromocion)) {
        throw new MockHttpError(404, 'La promoción no existe');
      }
      this.store.eliminarPromocion(idPromocion);
    });
  }

  private leerHorario(idCafeteria: string): HorarioNegocio {
    const hoy = this.store.estadoHoy(idCafeteria);
    return {
      dias: this.store.horario(idCafeteria),
      cerradoHoy: hoy.cerradoHoy,
      abiertaAhora: hoy.abierta,
    };
  }
}

function aDominio(p: PromocionNegocio & { idCafeteria?: string }): PromocionNegocio {
  return {
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion,
    tipo: p.tipo,
    valor: p.valor,
    desde: p.desde,
    hasta: p.hasta,
    activa: p.activa,
    usos: p.usos,
  };
}
