import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';
import { MOCK_LATENCIA_MS } from '@core/mock/mock-backend';
import { DEMO_CAFETERIA, DEMO_PRODUCTO } from '@core/mock/demo-db';
import { provideCatalogo } from '@features/catalogo';
import { MisPedidosFacade, PedidosCafeteriaFacade, provideOrdenes } from '@features/ordenes';
import { PedidoDetallePage, REFRESCO_DETALLE_MS } from './pedido-detalle.page';

const LISTA = '24110041-0000-4000-8000-000000000000';
const EN_PREPARACION = '24110042-0000-4000-8000-000000000000';

/** CL-Sprint5 11/11/2026 (etapa 6): detalle con seguimiento en vivo, código y cancelación. */
describe('PedidoDetallePage', () => {

  // CL-Sprint5 11/11/2026 (etapa 9): el abierto/cerrado sale del horario del negocio; se fija el reloj en un
  // miércoles a mediodía para que la prueba no dependa de la hora en que corre.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 11, 12, 0));
  });
  afterEach(() => vi.useRealTimers());
  let fixture: ComponentFixture<PedidoDetallePage>;
  let el: HTMLElement;

  async function configurar() {
    await TestBed.configureTestingModule({
      imports: [PedidoDetallePage],
      providers: [provideRouter([]), provideOrdenes(), provideCatalogo(), { provide: MOCK_LATENCIA_MS, useValue: 0 }],
    }).compileComponents();
  }

  async function abrir(id: string) {
    fixture = TestBed.createComponent(PedidoDetallePage);
    el = fixture.nativeElement;
    fixture.componentRef.setInput('id', id);
    await fixture.whenStable();
  }

  /** Un pedido nuevo con efectivo: nace "confirmada" (todavía se puede cancelar). */
  async function nuevo(): Promise<string> {
    const orden = await firstValueFrom(
      TestBed.inject(MisPedidosFacade).crear({
        idCafeteria: DEMO_CAFETERIA.central,
        recogidaEn: new Date(Date.now() + 30 * 60_000).toISOString(),
        metodo: 'efectivo',
        items: [{ idProducto: DEMO_PRODUCTO.sandwich, cantidad: 1 }],
      }),
    );
    return orden.idOrden;
  }

  const boton = (texto: string) =>
    [...el.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent!.includes(texto));
  const chip = () => el.querySelector('.pd-head .chip')!.textContent!.trim();

  afterEach(() => vi.useRealTimers());

  it('listo para recoger: el código en grande y sin cancelar', async () => {
    await configurar();
    await abrir(LISTA);
    const listo = el.querySelector('.pd-listo')!;
    expect(listo.textContent).toContain('¡Tu pedido está listo!');
    expect([...listo.querySelectorAll('.cr-digito')].map((d) => d.textContent!.trim()).join('')).toBe('402719');
    expect(listo.querySelector('.cr.compacto')).toBeNull();
    expect(boton('Copiar código')).toBeTruthy();
    expect(boton('Cancelar pedido')).toBeUndefined();
    expect(el.querySelector('.pd-no-cancelar')!.textContent).toContain('listo para recoger');
  });

  it('en preparación: la línea va en el paso 2, el código a mano y dice por qué no se cancela', async () => {
    await configurar();
    await abrir(EN_PREPARACION);
    const pasos = [...el.querySelectorAll('.lt-paso')];
    expect(pasos.length).toBe(4);
    expect(pasos[0].classList).toContain('hecho');
    expect(pasos[1].getAttribute('aria-current')).toBe('step');
    expect(el.querySelector('.pd-codigo-chico .cr.compacto')).toBeTruthy();
    expect(el.querySelector('.pd-no-cancelar')!.textContent).toContain('ya está preparando');
  });

  it('cancelar pide confirmación y deja el pedido cancelado', async () => {
    await configurar();
    await abrir(await nuevo());
    boton('Cancelar pedido')!.click();
    await fixture.whenStable();
    expect(el.querySelector('app-modal')!.textContent).toContain('¿Cancelar este pedido?');
    boton('Sí, cancelar')!.click();
    await fixture.whenStable();
    expect(el.querySelector('app-modal')).toBeNull();
    expect(chip()).toBe('Cancelado');
    expect(el.querySelector('.pd-cancelado')).toBeTruthy();
    expect(el.querySelector('app-volver-a-pedir')).toBeTruthy();
  });

  it('si la cafetería empezó a prepararlo mientras decidía, explica el motivo en la misma ventana', async () => {
    await configurar();
    const id = await nuevo();
    await abrir(id);
    boton('Cancelar pedido')!.click();
    await fixture.whenStable();
    await firstValueFrom(TestBed.inject(PedidosCafeteriaFacade).cambiarEstado(id, 'en_preparacion'));
    boton('Sí, cancelar')!.click();
    await fixture.whenStable();
    const modal = el.querySelector('app-modal')!;
    expect(modal.querySelector('[role="alert"]')!.textContent).toContain('no se puede cancelar');
    expect(modal.textContent).toContain('ya está preparando');
    expect(boton('Entendido')).toBeTruthy();
    expect(chip()).toBe('En preparación');
  });

  it('avanza en vivo cuando el tablero del negocio cambia el estado', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    vi.setSystemTime(new Date(2026, 10, 11, 12, 0));
    await configurar();
    const id = await nuevo();
    await abrir(id);
    expect(chip()).toBe('Recibido');

    await firstValueFrom(TestBed.inject(PedidosCafeteriaFacade).cambiarEstado(id, 'en_preparacion'));
    vi.advanceTimersByTime(REFRESCO_DETALLE_MS);
    await fixture.whenStable();
    expect(chip()).toBe('En preparación');

    await firstValueFrom(TestBed.inject(PedidosCafeteriaFacade).cambiarEstado(id, 'lista'));
    vi.advanceTimersByTime(REFRESCO_DETALLE_MS);
    await fixture.whenStable();
    expect(chip()).toBe('Listo para recoger');
    expect(el.querySelector('.pd-listo')).toBeTruthy();
  });

  it('un id que no existe dice que no lo encontramos', async () => {
    await configurar();
    await abrir('no-existe');
    expect(el.textContent).toContain('No encontramos ese pedido');
  });
});
