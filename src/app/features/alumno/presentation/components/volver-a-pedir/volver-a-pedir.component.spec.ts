import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MOCK_LATENCIA_MS } from '@core/mock/mock-backend';
import { DEMO_CAFETERIA, DEMO_PRODUCTO } from '@features/catalogo/data/mock/catalogo.mock-data';
import { MisPedidosFacade } from '@features/ordenes';
import { CarritoStore } from '@features/alumno/application/carrito.store';
import { CarritoUiService } from '@features/alumno/presentation/carrito-ui.service';
import { VolverAPedirComponent } from './volver-a-pedir.component';
import { provideCatalogoMock } from '@features/catalogo/data/mock/catalogo-mock.providers';
import { provideOrdenesMock } from '@features/ordenes/data/mock/ordenes-mock.providers';

const ENTREGADA = '24110038-0000-4000-8000-000000000000'; // Sabor: hamburguesa + malteada retirada
const CANCELADA = '24110035-0000-4000-8000-000000000000'; // Express: latte

/** CL-Sprint5 11/11/2026 (etapa 6): volver a pedir con los productos reales de hoy. */
describe('VolverAPedirComponent', () => {

  // CL-Sprint5 11/11/2026 (etapa 9): el abierto/cerrado sale del horario del negocio; se fija el reloj en un
  // miércoles a mediodía para que la prueba no dependa de la hora en que corre.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 11, 12, 0));
  });
  afterEach(() => vi.useRealTimers());
  let fixture: ComponentFixture<VolverAPedirComponent>;
  let el: HTMLElement;
  let carrito: CarritoStore;

  async function abrir(idOrden: string) {
    await TestBed.configureTestingModule({
      imports: [VolverAPedirComponent],
      providers: [provideRouter([]), provideOrdenesMock(), provideCatalogoMock(), { provide: MOCK_LATENCIA_MS, useValue: 0 }],
    }).compileComponents();
    const pedidos = TestBed.inject(MisPedidosFacade);
    await firstValueFrom(pedidos.cargar(true));
    carrito = TestBed.inject(CarritoStore);
    carrito.vaciar();
    TestBed.inject(CarritoUiService).cerrar();
    fixture = TestBed.createComponent(VolverAPedirComponent);
    el = fixture.nativeElement;
    fixture.componentRef.setInput('orden', pedidos.porId(idOrden));
    await fixture.whenStable();
  }

  const pulsar = async (texto: string) => {
    [...el.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent!.includes(texto))!.click();
    await fixture.whenStable();
  };

  it('si todo sigue en el menú y el carrito está libre, agrega y abre el carrito', async () => {
    await abrir(CANCELADA);
    await pulsar('Volver a pedir');
    expect(el.querySelector('app-modal')).toBeNull();
    expect(carrito.items()).toMatchObject([
      { idProducto: DEMO_PRODUCTO.latte, cantidad: 1, idCafeteria: DEMO_CAFETERIA.express },
    ]);
    expect(TestBed.inject(CarritoUiService).abierto()).toBe(true);
  });

  it('avisa lo que ya no está disponible y agrega el resto con su id real', async () => {
    await abrir(ENTREGADA);
    await pulsar('Volver a pedir');
    expect(el.querySelector('.vp-aviso')!.textContent).toContain('Malteada de Vainilla');
    await pulsar('Agregar al carrito');
    expect(carrito.items().map((i) => i.idProducto)).toEqual([DEMO_PRODUCTO.hamburguesa]);
    expect(carrito.idCafeteria()).toBe(DEMO_CAFETERIA.sabor);
  });

  it('si el carrito es de otra cafetería, lo dice y ofrece vaciarlo', async () => {
    await abrir(CANCELADA);
    carrito.agregar({
      idProducto: DEMO_PRODUCTO.sandwich,
      producto: 'Sándwich',
      precio: 55,
      cantidad: 1,
      imagenUrl: null,
      idCafeteria: DEMO_CAFETERIA.central,
      cafeteria: 'Cafetería Central',
    });
    await fixture.whenStable();
    await pulsar('Volver a pedir');
    expect(el.querySelector('app-modal')!.textContent).toContain('Cafetería Central');
    await pulsar('Vaciar y agregar');
    expect(carrito.items().map((i) => i.idProducto)).toEqual([DEMO_PRODUCTO.latte]);
  });
});
