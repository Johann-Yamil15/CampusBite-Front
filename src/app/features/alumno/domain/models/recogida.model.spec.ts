import { opcionesRecogida, redondearA5 } from './recogida.model';

/** Fecha de hoy a una hora dada (hora local). */
const a = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(2026, 10, 11, h, m, 0, 0);
  return d;
};
const horas = (lista: { fecha: Date }[]) =>
  lista.map((o) => `${o.fecha.getHours()}:${String(o.fecha.getMinutes()).padStart(2, '0')}`);

/** CL-Sprint5 11/11/2026: horarios de recogida del checkout (etapa 5). */
describe('opcionesRecogida', () => {
  const abierta = { abierta: true, cierraA: '17:00', minutosEstimados: 10 };

  it('redondea a 5 minutos hacia arriba', () => {
    expect(horas([{ fecha: redondearA5(a('13:22')) }])).toEqual(['13:25']);
    expect(horas([{ fecha: redondearA5(a('13:25')) }])).toEqual(['13:25']);
  });

  it('ofrece "lo antes posible" y saltos que no se encimen con él', () => {
    const opciones = opcionesRecogida(a('13:02'), abierta);
    expect(opciones[0]).toMatchObject({ etiqueta: 'Lo antes posible', loAntesPosible: true });
    // Lo antes posible: 13:02 + 10 = 13:12 → 13:15. "En 15 min" (13:20) queda a 5 min: se omite.
    expect(horas(opciones)).toEqual(['13:15', '13:35', '13:50', '14:05', '14:35']);
    expect(opciones.map((o) => o.etiqueta)).toEqual(['Lo antes posible', 'En 30 min', 'En 45 min', 'En 1 h', 'En 1 h 30 min']);
  });

  it('nunca ofrece menos de 5 minutos aunque la cafetería prepare más rápido', () => {
    const [primera] = opcionesRecogida(a('13:00'), { ...abierta, minutosEstimados: 2 });
    expect(horas([primera])).toEqual(['13:05']);
  });

  it('no ofrece horarios después del cierre', () => {
    expect(horas(opcionesRecogida(a('16:20'), abierta))).toEqual(['16:30', '16:50']);
  });

  it('cerrada, sin horario hoy o sin tiempo para preparar: no hay opciones', () => {
    expect(opcionesRecogida(a('13:00'), { ...abierta, abierta: false })).toEqual([]);
    expect(opcionesRecogida(a('13:00'), { ...abierta, cierraA: null })).toEqual([]);
    expect(opcionesRecogida(a('16:55'), abierta)).toEqual([]);
  });
});
