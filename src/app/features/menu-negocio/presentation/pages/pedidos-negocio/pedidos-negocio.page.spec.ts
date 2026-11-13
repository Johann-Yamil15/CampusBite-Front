import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';
import { MOCK_LATENCIA_MS } from '@core/mock/mock-backend';
import { DEMO_CAFETERIA, DEMO_PRODUCTO } from '@features/catalogo/data/mock/catalogo.mock-data';
import { MisPedidosFacade, PedidosCafeteriaFacade } from '@features/ordenes';
import { PedidosNegocioPage } from './pedidos-negocio.page';
import { provideOrdenesMock } from '@features/ordenes/data/mock/ordenes-mock.providers';

/**
 * JY-Sprint4 05/11/2026: cómo avanza un pedido de columna y que rechazar exija motivo.
 * CL-Sprint5 11/11/2026 (etapa 9): tablero rediseñado. Entregar exige teclear el código del alumno, hay
 * confirmar pago, rechazo con motivo y resaltado de pedidos nuevos. Mismos datos que ve el alumno.
 */
describe('PedidosNegocioPage', () => {
  let fixture: ComponentFixture<PedidosNegocioPage>;
  let el: HTMLElement;

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 11, 12, 0));
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [PedidosNegocioPage],
      providers: [provideRouter([]), provideOrdenesMock(), { provide: MOCK_LATENCIA_MS, useValue: 0 }],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  async function abrir(ver?: string) {
    fixture = TestBed.createComponent(PedidosNegocioPage);
    el = fixture.nativeElement;
    if (ver) fixture.componentRef.setInput('ver', ver);
    await fixture.whenStable();
  }

  const conteos = () => [...el.querySelectorAll('.tab-count')].map((n) => n.textContent!.trim());
  const columna = (i: number) => el.querySelectorAll<HTMLElement>('.tb-columna')[i];
  const tarjeta = (folio: string) =>
    [...el.querySelectorAll<HTMLElement>('.tb-orden')].find((t) => t.textContent!.includes(folio))!;
  const boton = (raiz: ParentNode, texto: string) =>
    [...raiz.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent!.includes(texto))!;
  const escribirCodigo = async (codigo: string) => {
    const input = el.querySelector<HTMLInputElement>('.tb-codigo')!;
    input.value = codigo;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };
  const enviarEntrega = async () => {
    el.querySelector<HTMLFormElement>('#form-entrega')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
  };

  it('reparte los pedidos por estado: Nuevos, En preparación, Listos y Cerrados', async () => {
    await abrir();
    expect([...el.querySelectorAll('.tab')].map((t) => t.textContent!.replace(/\d+/g, '').trim())).toEqual([
      'Nuevos',
      'En preparación',
      'Listos',
      'Cerrados',
    ]);
    expect(conteos()).toEqual(['2', '2', '1', '2']);
    expect(el.querySelectorAll('.tb-columna').length).toBe(3);
  });

  it('"Iniciar preparación" lo pasa a la siguiente columna', async () => {
    await abrir();
    const folio = columna(0).querySelector('.tb-folio')!.textContent!;
    boton(columna(0), 'Iniciar preparación').click();
    await fixture.whenStable();
    expect(conteos()).toEqual(['1', '3', '1', '2']);
    expect(columna(1).textContent).toContain(folio);
  });

  it('entregar pide teclear el código; si no coincide no se entrega', async () => {
    await abrir();
    boton(tarjeta('CB-2411-0039'), 'Entregar').click();
    await fixture.whenStable();
    const validar = () => boton(el.querySelector('app-modal')!, 'Validar y entregar');
    expect(validar().disabled).toBe(true);

    await escribirCodigo('12a34');
    expect(el.querySelector<HTMLInputElement>('.tb-codigo')!.value).toBe('1234');
    await escribirCodigo('000000');
    await enviarEntrega();
    expect(el.querySelector('.tb-error-texto')!.textContent).toContain('El código no coincide');
    expect(conteos()[2]).toBe('1');

    await escribirCodigo('930476');
    await enviarEntrega();
    expect(el.querySelector('app-modal')).toBeNull();
    expect(conteos()).toEqual(['2', '2', '0', '3']);
  });

  it('rechazar pide motivo y confirmación; el alumno verá el motivo', async () => {
    await abrir();
    boton(tarjeta('CB-2411-0045'), 'Rechazar').click();
    await fixture.whenStable();
    const modal = () => el.querySelector('app-modal')!;
    expect(boton(modal(), 'Rechazar pedido').disabled).toBe(true);
    boton(modal(), 'Se nos acabó un producto').click();
    await fixture.whenStable();
    boton(modal(), 'Rechazar pedido').click();
    await fixture.whenStable();
    expect(conteos()).toEqual(['1', '2', '1', '3']);

    fixture.componentRef.setInput('ver', 'cerrados');
    await fixture.whenStable();
    expect(el.querySelector('.tb-cerrados')!.textContent).toContain('Motivo: Se nos acabó un producto');
  });

  it('confirma el pago de una transferencia', async () => {
    const orden = await firstValueFrom(
      TestBed.inject(MisPedidosFacade).crear({
        idCafeteria: DEMO_CAFETERIA.central,
        recogidaEn: new Date(2026, 10, 11, 12, 40).toISOString(),
        metodo: 'transferencia',
        items: [{ idProducto: DEMO_PRODUCTO.sandwich, cantidad: 1 }],
      }),
    );
    await abrir();
    const t = tarjeta(orden.folio);
    expect(t.textContent).toContain('Pago por confirmar');
    boton(t, 'Confirmar pago').click();
    await fixture.whenStable();
    expect(tarjeta(orden.folio).textContent).toContain('Iniciar preparación');
    expect(tarjeta(orden.folio).textContent).toContain('Pagado');
  });

  it('resalta el pedido que llega con el tablero abierto', async () => {
    await abrir();
    const orden = await firstValueFrom(
      TestBed.inject(MisPedidosFacade).crear({
        idCafeteria: DEMO_CAFETERIA.central,
        recogidaEn: new Date(2026, 10, 11, 12, 40).toISOString(),
        metodo: 'efectivo',
        items: [{ idProducto: DEMO_PRODUCTO.panini, cantidad: 2 }],
      }),
    );
    await firstValueFrom(TestBed.inject(PedidosCafeteriaFacade).refrescar(''));
    await fixture.whenStable();
    expect(el.querySelector('.tb-nuevos')!.textContent).toContain('Llegó un pedido nuevo');
    expect(tarjeta(orden.folio).classList).toContain('reciente');

    tarjeta(orden.folio).dispatchEvent(new Event('pointerenter'));
    await fixture.whenStable();
    expect(el.querySelector('.tb-nuevos')).toBeNull();
  });
});
