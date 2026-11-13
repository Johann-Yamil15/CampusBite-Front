import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { MOCK_LATENCIA_MS } from '@core/mock/mock-backend';
import { provideOrdenes } from '@features/ordenes';
import { EstadisticasPage } from './estadisticas.page';

/** CL-Sprint5 11/11/2026 (etapa 9): estadísticas con los pedidos simulados del tablero (5 nov). */
describe('EstadisticasPage', () => {
  let fixture: ComponentFixture<EstadisticasPage>;
  let el: HTMLElement;

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 11, 12, 0));
    await TestBed.configureTestingModule({
      imports: [EstadisticasPage],
      providers: [provideRouter([]), provideOrdenes(), { provide: MOCK_LATENCIA_MS, useValue: 0 }],
    }).compileComponents();
    fixture = TestBed.createComponent(EstadisticasPage);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  afterEach(() => vi.useRealTimers());

  const kpi = (nombre: string) =>
    [...el.querySelectorAll('.es-kpi')].find((k) => k.textContent!.includes(nombre))!.querySelector('dd')!.textContent!.trim();
  const boton = (texto: string) =>
    [...el.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent!.includes(texto))!;

  it('calcula ventas, pedidos y ticket de los últimos 7 días', () => {
    expect(kpi('Ventas')).toBe('$617');
    expect(kpi('Pedidos')).toBe('6');
    expect(kpi('Ticket promedio')).toBe('$103');
    expect(kpi('Cancelados')).toBe('1');
    expect(el.querySelectorAll('.es-col').length).toBe(7);
  });

  it('muestra más vendidos y la hora pico', () => {
    expect(el.querySelector('#es-top')!.parentElement!.querySelector('li')!.textContent).toContain('Panini Caprese');
    expect(el.querySelector('.es-nota')!.textContent).toContain('12:00');
  });

  it('"Hoy" sin pedidos lo dice y ofrece ver 30 días', async () => {
    boton('Hoy').click();
    await fixture.whenStable();
    expect(el.querySelector('.vacio h2')!.textContent).toContain('Sin pedidos en este periodo');
    boton('Ver los últimos 30 días').click();
    await fixture.whenStable();
    expect(el.querySelectorAll('.es-col').length).toBe(30);
  });
});
