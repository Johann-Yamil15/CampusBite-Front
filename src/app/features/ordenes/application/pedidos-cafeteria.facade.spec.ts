import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';
import { MOCK_LATENCIA_MS } from '@core/mock/mock-backend';
import { DEMO_CAFETERIA, DEMO_PRODUCTO } from '@core/mock/demo-db';
import { provideOrdenes } from '@features/ordenes/ordenes.providers';
import { MisPedidosFacade } from './mis-pedidos.facade';
import { PedidosCafeteriaFacade } from './pedidos-cafeteria.facade';

/** CL-Sprint5 11/11/2026 (etapa 9): el tablero detecta los pedidos que llegan con él abierto. */
describe('PedidosCafeteriaFacade', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 11, 12, 0));
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideOrdenes(), { provide: MOCK_LATENCIA_MS, useValue: 0 }] });
  });
  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('un pedido nuevo queda en "recientes" y en "llegaron" hasta que se ve', async () => {
    const tablero = TestBed.inject(PedidosCafeteriaFacade);
    await firstValueFrom(tablero.cargar(DEMO_CAFETERIA.central));
    expect(tablero.recientes().size).toBe(0);

    const orden = await firstValueFrom(
      TestBed.inject(MisPedidosFacade).crear({
        idCafeteria: DEMO_CAFETERIA.central,
        recogidaEn: new Date(2026, 10, 11, 12, 30).toISOString(),
        metodo: 'efectivo',
        items: [{ idProducto: DEMO_PRODUCTO.sandwich, cantidad: 1 }],
      }),
    );
    await firstValueFrom(tablero.refrescar(DEMO_CAFETERIA.central));
    expect(tablero.recientes().has(orden.idOrden)).toBe(true);
    expect(tablero.llegaron().map((o) => o.idOrden)).toEqual([orden.idOrden]);

    tablero.visto(orden.idOrden);
    expect(tablero.recientes().size).toBe(0);
  });
});
