import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { MOCK_LATENCIA_MS } from '@core/mock/mock-backend';
import { MisPedidosFacade } from '@features/ordenes';
import { PedidosPage } from './pedidos.page';
import { provideCatalogoMock } from '@features/catalogo/data/mock/catalogo-mock.providers';
import { provideOrdenesMock } from '@features/ordenes/data/mock/ordenes-mock.providers';

/** CL-Sprint5 11/11/2026 (etapa 6): Mis pedidos con pestañas, vacío y error. */
describe('PedidosPage', () => {

  // CL-Sprint5 11/11/2026 (etapa 9): el abierto/cerrado sale del horario del negocio; se fija el reloj en un
  // miércoles a mediodía para que la prueba no dependa de la hora en que corre.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 11, 12, 0));
  });
  afterEach(() => vi.useRealTimers());
  let fixture: ComponentFixture<PedidosPage>;
  let el: HTMLElement;

  async function abrir(ver?: string, antes?: (f: MisPedidosFacade) => void) {
    await TestBed.configureTestingModule({
      imports: [PedidosPage],
      providers: [provideRouter([]), provideOrdenesMock(), provideCatalogoMock(), { provide: MOCK_LATENCIA_MS, useValue: 0 }],
    }).compileComponents();
    antes?.(TestBed.inject(MisPedidosFacade));
    fixture = TestBed.createComponent(PedidosPage);
    el = fixture.nativeElement;
    if (ver) fixture.componentRef.setInput('ver', ver);
    await fixture.whenStable();
  }

  const tarjetas = () => [...el.querySelectorAll('app-pedido-card')];

  it('muestra los activos con su avance y el código del que ya está listo', async () => {
    await abrir();
    expect(el.querySelector('#tab-activos')!.getAttribute('aria-selected')).toBe('true');
    expect(tarjetas().length).toBe(2);
    const listo = el.querySelector('.pc.listo')!;
    expect(listo.textContent).toContain('Listo para recoger');
    expect(listo.querySelector('.pc-codigo')!.textContent).toContain('402 719');
    expect(el.querySelectorAll('.pc-tramos').length).toBe(2);
  });

  it('el historial ofrece volver a pedir', async () => {
    await abrir('historial');
    expect(tarjetas().length).toBe(2);
    expect(el.querySelectorAll('app-volver-a-pedir').length).toBe(2);
    expect(el.textContent).toContain('Entregado');
    expect(el.textContent).toContain('Cancelado');
  });

  it('sin pedidos invita a explorar cafeterías', async () => {
    await abrir(undefined, (f) => vi.spyOn(f, 'cargar').mockReturnValue(of([])));
    expect(el.querySelector('.vacio h2')!.textContent).toContain('Aún no tienes pedidos');
    expect(el.querySelector('.vacio a')!.getAttribute('href')).toBe('/');
    expect(el.querySelector('[role="tablist"]')).toBeNull();
  });

  it('si falla muestra el error y "Reintentar" vuelve a cargar', async () => {
    let fallar = true;
    await abrir(undefined, (f) => {
      const real = f.cargar.bind(f);
      vi.spyOn(f, 'cargar').mockImplementation((forzar) => {
        if (!fallar) return real(forzar);
        f.error.set('Sin conexión');
        return throwError(() => ({ status: 0, message: 'Sin conexión' }));
      });
    });
    expect(el.querySelector('.mp-error')!.textContent).toContain('Sin conexión');

    fallar = false;
    el.querySelector<HTMLButtonElement>('.mp-error button')!.click();
    await fixture.whenStable();
    expect(el.querySelector('.mp-error')).toBeNull();
    expect(tarjetas().length).toBe(2);
  });
});
