import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MockBackend, MockHttpError } from '@core/mock/mock-backend';
import { NegocioRepository } from '@features/menu-negocio/domain/repositories/negocio.repository';
import {
  DIAS,
  DiaHorario,
  HorarioNegocio,
  PromocionNegocio,
  aMinutos,
  diaValido,
  validarPromocion,
} from '@features/menu-negocio/domain/models/negocio.model';

/**
 * CL-Sprint5 11/11/2026 (etapa 9): horario y promociones simulados, con las mismas reglas que el dominio.
 * CL-Sprint5 13/11/2026: solo para pruebas (la app usa el back); se enlaza con provideNegocioMock(). Ya no
 * comparte datos con el catálogo (se retiró DemoNegocioStore): cada instancia guarda su estado en memoria y
 * responde 400 con el mensaje en español, como el back.
 */
@Injectable()
export class NegocioMockRepository extends NegocioRepository {
  private readonly backend = inject(MockBackend);

  private dias: DiaHorario[] = semanaSemilla();
  /** Fecha (YYYY-MM-DD) en que se cerró por hoy, o null. */
  private cerradoEl: string | null = null;
  private lista: PromocionNegocio[] = promocionesSemilla(new Date());

  horario(_idCafeteria: string): Observable<HorarioNegocio> {
    return this.backend.responder(() => this.leerHorario());
  }

  guardarHorario(_idCafeteria: string, dias: DiaHorario[]): Observable<HorarioNegocio> {
    return this.backend.responder(() => {
      if (dias.length !== DIAS.length) throw new MockHttpError(400, 'El horario debe tener exactamente 7 días.');
      const malo = dias.findIndex((d) => !diaValido(d));
      if (malo >= 0) {
        throw new MockHttpError(400, `${DIAS[malo]}: la hora de cierre tiene que ser después de la de apertura`);
      }
      this.dias = dias.map((d) => ({ ...d }));
      return this.leerHorario();
    });
  }

  cerrarHoy(_idCafeteria: string): Observable<HorarioNegocio> {
    return this.backend.responder(() => {
      this.cerradoEl = fechaLocal(new Date());
      return this.leerHorario();
    });
  }

  reabrir(_idCafeteria: string): Observable<HorarioNegocio> {
    return this.backend.responder(() => {
      this.cerradoEl = null;
      return this.leerHorario();
    });
  }

  promociones(_idCafeteria: string): Observable<PromocionNegocio[]> {
    return this.backend.responder(() => this.lista.map((p) => ({ ...p })));
  }

  guardarPromocion(_idCafeteria: string, promo: PromocionNegocio): Observable<PromocionNegocio> {
    return this.backend.responder(() => {
      const errores = Object.values(validarPromocion(promo));
      if (errores.length) throw new MockHttpError(400, errores[0]!);
      if (promo.id && !this.lista.some((p) => p.id === promo.id)) {
        throw new MockHttpError(404, 'La promoción no existe');
      }
      const guardada: PromocionNegocio = {
        ...promo,
        nombre: promo.nombre.trim(),
        descripcion: promo.descripcion.trim(),
        id: promo.id || `promo-${crypto.randomUUID().slice(0, 8)}`,
      };
      this.lista = promo.id
        ? this.lista.map((p) => (p.id === guardada.id ? guardada : p))
        : [guardada, ...this.lista];
      return { ...guardada };
    });
  }

  eliminarPromocion(_idCafeteria: string, idPromocion: string): Observable<void> {
    return this.backend.responder(() => {
      if (!this.lista.some((p) => p.id === idPromocion)) {
        throw new MockHttpError(404, 'La promoción no existe');
      }
      this.lista = this.lista.filter((p) => p.id !== idPromocion);
    });
  }

  private leerHorario(ahora = new Date()): HorarioNegocio {
    const cerradoHoy = this.cerradoEl === fechaLocal(ahora);
    const d = this.dias[(ahora.getDay() + 6) % 7];
    const minutos = ahora.getHours() * 60 + ahora.getMinutes();
    const abiertaAhora =
      !cerradoHoy && !!d?.abre && minutos >= aMinutos(d.desde) && minutos < aMinutos(d.hasta);
    return { dias: this.dias.map((x) => ({ ...x })), cerradoHoy, abiertaAhora };
  }
}

/** YYYY-MM-DD en hora local. */
function fechaLocal(fecha: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())}`;
}

/** La semana de la Cafetería Central de prueba: L–V 07:00–17:00, sábado 09:00–13:00, domingo cerrado. */
function semanaSemilla(): DiaHorario[] {
  const abre = (desde: string, hasta: string): DiaHorario => ({ abre: true, desde, hasta });
  return [
    ...Array.from({ length: 5 }, () => abre('07:00', '17:00')),
    abre('09:00', '13:00'),
    { abre: false, desde: '09:00', hasta: '13:00' },
  ];
}

function promocionesSemilla(ahora: Date): PromocionNegocio[] {
  const dia = (dias: number) => {
    const f = new Date(ahora);
    f.setDate(f.getDate() + dias);
    return fechaLocal(f);
  };
  const desde = dia(-10);
  const hasta = dia(20);
  return [
    { id: 'promo-n1', nombre: 'Combo Estudiantil', descripcion: 'Sándwich + bebida del día.', tipo: 'combo',
      valor: 79, desde, hasta, activa: true, usos: 34 },
    { id: 'promo-n2', nombre: 'Martes de café', descripcion: '20% en bebidas calientes.', tipo: 'porcentaje',
      valor: 20, desde, hasta, activa: true, usos: 12 },
    { id: 'promo-n3', nombre: 'Desayuno a $45', descripcion: 'Molletes o chilaquiles antes de las 10:00.',
      tipo: 'precio_fijo', valor: 45, desde, hasta, activa: false, usos: 58 },
  ];
}
