import { TestBed } from '@angular/core/testing';
import { DEMO_CAFETERIA } from './demo-db';
import { CLAVE_DEMO_NEGOCIO, DemoNegocioStore } from './demo-negocio.store';

/** CL-Sprint5 11/11/2026 (etapa 9): horario y promociones que comparten el negocio y el alumno. */
describe('DemoNegocioStore', () => {
  let store: DemoNegocioStore;
  const miercoles = (h: number, m = 0) => new Date(2026, 10, 11, h, m);

  beforeEach(() => {
    localStorage.clear();
    store = TestBed.inject(DemoNegocioStore);
  });
  afterEach(() => localStorage.clear());

  it('abre según el horario del día (Central: 07:00–17:00 entre semana)', () => {
    expect(store.estadoHoy(DEMO_CAFETERIA.central, miercoles(6, 59)).abierta).toBe(false);
    expect(store.estadoHoy(DEMO_CAFETERIA.central, miercoles(12))).toMatchObject({ abierta: true, cierraA: '17:00' });
    expect(store.estadoHoy(DEMO_CAFETERIA.central, miercoles(17)).abierta).toBe(false);
    // Domingo cerrado
    expect(store.estadoHoy(DEMO_CAFETERIA.central, new Date(2026, 10, 15, 12)).abierta).toBe(false);
  });

  it('editar el horario y "cerrar por hoy" cambian el estado y se guardan', () => {
    const semana = store.horario(DEMO_CAFETERIA.central);
    semana[2] = { abre: true, desde: '13:00', hasta: '20:00' }; // miércoles
    store.guardarHorario(DEMO_CAFETERIA.central, semana);
    expect(store.estadoHoy(DEMO_CAFETERIA.central, miercoles(12)).abierta).toBe(false);
    expect(store.estadoHoy(DEMO_CAFETERIA.central, miercoles(18))).toMatchObject({ abierta: true, cierraA: '20:00' });

    store.cerrarHoy(DEMO_CAFETERIA.central, miercoles(18));
    expect(store.estadoHoy(DEMO_CAFETERIA.central, miercoles(18))).toMatchObject({ abierta: false, cerradoHoy: true });
    // Al día siguiente vuelve a abrir sola
    expect(store.cerradoHoy(DEMO_CAFETERIA.central, new Date(2026, 10, 12, 14))).toBe(false);
    store.reabrir(DEMO_CAFETERIA.central);
    expect(store.estadoHoy(DEMO_CAFETERIA.central, miercoles(18)).abierta).toBe(true);
    expect(localStorage.getItem(CLAVE_DEMO_NEGOCIO)).toContain('20:00');
  });

  it('solo las promociones activas y vigentes llegan al alumno', () => {
    const hoy = new Date();
    const vigentes = store.promocionesVigentes(hoy).map((p) => p.nombre);
    expect(vigentes).toEqual(['Combo Estudiantil', 'Martes de café']);

    const nueva = store.guardarPromocion({
      id: '', idCafeteria: DEMO_CAFETERIA.central, nombre: 'Viernes de tacos', descripcion: 'x',
      tipo: 'precio_fijo', valor: 40, desde: '2000-01-01', hasta: '2999-12-31', activa: true, usos: 0,
    });
    expect(nueva.id).toMatch(/^promo-/);
    expect(store.promocionesVigentes(hoy).map((p) => p.nombre)).toContain('Viernes de tacos');
    store.guardarPromocion({ ...nueva, activa: false });
    expect(store.promocionesVigentes(hoy).map((p) => p.nombre)).not.toContain('Viernes de tacos');
    expect(store.eliminarPromocion(nueva.id)).toBe(true);
  });

  it('la cafetería real del encargado (que no está en la demo) usa la cafetería demo del encargado', () => {
    expect(store.idDemo('id-real-del-back')).toBe(DEMO_CAFETERIA.central);
    expect(store.idDemo(DEMO_CAFETERIA.rincon)).toBe(DEMO_CAFETERIA.rincon);
  });
});
