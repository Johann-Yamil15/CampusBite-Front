import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom } from 'rxjs';
import { vi } from 'vitest';
import { MOCK_LATENCIA_MS } from '@core/mock/mock-backend';
import { DemoNegocioStore } from '@core/mock/demo-negocio.store';
import { DEMO_CAFETERIA, DEMO_PRODUCTO } from '@core/mock/demo-db';
import { Orden } from '@features/ordenes/domain/models/orden.model';
import { MOCK_COCINA, OrdenesMockRepository } from './ordenes-mock.repository';

/** ISO con offset dentro de `minutos`. */
const dentroDe = (minutos: number) => new Date(Date.now() + minutos * 60_000).toISOString();

/** CL-Sprint5 11/11/2026: el mock aplica las mismas reglas que los SP de órdenes de la BD. */
describe('OrdenesMockRepository', () => {

  // CL-Sprint5 11/11/2026 (etapa 9): el abierto/cerrado sale del horario del negocio; se fija el reloj en un
  // miércoles a mediodía para que la prueba no dependa de la hora en que corre.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 11, 12, 0));
  });
  afterEach(() => vi.useRealTimers());
  let repo: OrdenesMockRepository;

  const valor = <T>(o: Observable<T>) => firstValueFrom(o);
  const falla = (o: Observable<unknown>) => firstValueFrom(o).then(
    () => { throw new Error('se esperaba un error'); },
    (e: { status: number; message: string }) => e,
  );

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: MOCK_LATENCIA_MS, useValue: 0 },
        { provide: MOCK_COCINA, useValue: null },
        OrdenesMockRepository,
      ],
    });
    repo = TestBed.inject(OrdenesMockRepository);
  });

  it('mis órdenes no traen los datos del alumno y van de la más reciente a la más vieja', async () => {
    const mias = await valor(repo.misOrdenes());
    expect(mias.length).toBe(4);
    expect(mias.every((o) => o.alumno === null)).toBe(true);
    expect(mias.map((o) => o.folio)[0]).toBe('CB-2411-0042');
  });

  it('crear con efectivo nace confirmada, con código de 6 dígitos y total del menú', async () => {
    const orden = await valor(
      repo.crear({
        idCafeteria: DEMO_CAFETERIA.central,
        recogidaEn: dentroDe(30),
        metodo: 'efectivo',
        items: [{ idProducto: DEMO_PRODUCTO.sandwich, cantidad: 2 }],
      }),
    );
    expect(orden.estado).toBe('confirmada');
    expect(orden.codigoRecogida).toMatch(/^\d{6}$/);
    expect(orden.total).toBe(110);
    expect((await valor(repo.misOrdenes()))[0].idOrden).toBe(orden.idOrden);
  });

  it('tarjeta simula el cobro en línea (confirmada y pagada); transferencia queda pendiente', async () => {
    const pedir = (metodo: 'tarjeta' | 'transferencia') =>
      valor(
        repo.crear({
          idCafeteria: DEMO_CAFETERIA.central,
          recogidaEn: dentroDe(30),
          metodo,
          items: [{ idProducto: DEMO_PRODUCTO.panini, cantidad: 1 }],
        }),
      );
    expect(await pedir('tarjeta')).toMatchObject({ estado: 'confirmada', estadoPago: 'pagado' });
    expect(await pedir('transferencia')).toMatchObject({ estado: 'pendiente', estadoPago: 'pendiente' });
  });

  it('crear rechaza recogida en menos de 5 minutos y productos de otra cafetería', async () => {
    const base = { idCafeteria: DEMO_CAFETERIA.central, metodo: 'efectivo' as const };
    expect(
      await falla(repo.crear({ ...base, recogidaEn: dentroDe(2), items: [{ idProducto: DEMO_PRODUCTO.sandwich, cantidad: 1 }] })),
    ).toMatchObject({ status: 400, message: expect.stringContaining('5 minutos') });
    expect(
      await falla(repo.crear({ ...base, recogidaEn: dentroDe(30), items: [{ idProducto: DEMO_PRODUCTO.latte, cantidad: 1 }] })),
    ).toMatchObject({ status: 400, message: expect.stringContaining('otra cafetería') });
  });

  it('el alumno cancela una confirmada pero no una en preparación', async () => {
    const mias = await valor(repo.misOrdenes());
    const enPreparacion = mias.find((o) => o.estado === 'en_preparacion')!;
    expect(await falla(repo.cancelar(enPreparacion.idOrden))).toMatchObject({ status: 400 });

    const nueva = await valor(
      repo.crear({
        idCafeteria: DEMO_CAFETERIA.central,
        recogidaEn: dentroDe(30),
        metodo: 'efectivo',
        items: [{ idProducto: DEMO_PRODUCTO.sandwich, cantidad: 1 }],
      }),
    );
    expect((await valor(repo.cancelar(nueva.idOrden))).estado).toBe('cancelada');
  });

  describe('cafetería', () => {
    let tablero: Orden[];
    const de = (estado: Orden['estado']) => tablero.find((o) => o.estado === estado)!;

    beforeEach(async () => {
      tablero = await valor(repo.ordenesCafeteria(DEMO_CAFETERIA.central));
    });

    it('ve los datos del alumno', () => {
      expect(tablero.every((o) => o.alumno !== null)).toBe(true);
    });

    it('avanza confirmada → en preparación → lista, sin saltos', async () => {
      const id = de('confirmada').idOrden;
      expect(await falla(repo.cambiarEstado(id, 'lista'))).toMatchObject({ status: 400 });
      expect((await valor(repo.cambiarEstado(id, 'en_preparacion'))).estado).toBe('en_preparacion');
      expect((await valor(repo.cambiarEstado(id, 'lista'))).estado).toBe('lista');
    });

    it('entregar exige estar lista y el código correcto; el efectivo queda pagado', async () => {
      const lista = de('lista');
      expect(await falla(repo.entregar(lista.idOrden, '000000'))).toMatchObject({
        message: 'Código de recogida incorrecto',
      });
      const entregada = await valor(repo.entregar(lista.idOrden, lista.codigoRecogida));
      expect(entregada.estado).toBe('entregada');
      expect(entregada.estadoPago).toBe('pagado');

      expect(await falla(repo.entregar(de('confirmada').idOrden, '123456'))).toMatchObject({
        message: 'La orden no está lista para entrega',
      });
    });

    it('rechazar pide motivo y cancela', async () => {
      const id = de('confirmada').idOrden;
      expect(await falla(repo.rechazar(id, '  '))).toMatchObject({ status: 400 });
      const rechazada = await valor(repo.rechazar(id, 'Sin insumos'));
      expect(rechazada).toMatchObject({ estado: 'cancelada', motivoCancelacion: 'Sin insumos' });
    });

    // CL-Sprint5 11/11/2026 (etapa 9)
    it('confirmar pago solo desde pendiente (transferencia)', async () => {
      const nueva = await valor(
        repo.crear({
          idCafeteria: DEMO_CAFETERIA.central,
          recogidaEn: dentroDe(30),
          metodo: 'transferencia',
          items: [{ idProducto: DEMO_PRODUCTO.sandwich, cantidad: 1 }],
        }),
      );
      expect(nueva.estado).toBe('pendiente');
      const pagada = await valor(repo.confirmarPago(nueva.idOrden));
      expect(pagada).toMatchObject({ estado: 'confirmada', estadoPago: 'pagado' });
      expect(await falla(repo.confirmarPago(nueva.idOrden))).toMatchObject({ status: 400 });
    });
  });

  // CL-Sprint5 11/11/2026 (etapa 9): el pedido respeta el horario del negocio
  it('no deja pedir si la cafetería cerró por hoy o después de su cierre', async () => {
    const pedir = (recogidaEn: string) =>
      repo.crear({
        idCafeteria: DEMO_CAFETERIA.central,
        recogidaEn,
        metodo: 'efectivo',
        items: [{ idProducto: DEMO_PRODUCTO.sandwich, cantidad: 1 }],
      });
    expect(await falla(pedir(new Date(2026, 10, 11, 17, 30).toISOString()))).toMatchObject({
      message: 'La cafetería cierra a las 17:00; elige una hora antes',
    });
    TestBed.inject(DemoNegocioStore).cerrarHoy(DEMO_CAFETERIA.central);
    expect(await falla(pedir(dentroDe(30)))).toMatchObject({ message: 'La cafetería está cerrada en este momento' });
    TestBed.inject(DemoNegocioStore).reabrir(DEMO_CAFETERIA.central);
  });

  // CL-Sprint5 11/11/2026 (etapa 6)
  describe('reportes y cocina simulada', () => {
    it('reportar responde un folio, una sola vez por orden', async () => {
      const id = (await valor(repo.misOrdenes()))[0].idOrden;
      expect(await falla(repo.reportar(id, { motivo: 'otro', detalle: 'mal' }))).toMatchObject({ status: 422 });
      const r = await valor(repo.reportar(id, { motivo: 'falto_articulo', detalle: '' }));
      expect(r.folio).toMatch(/^R-\d{6}$/);
      expect(await falla(repo.reportar(id, { motivo: 'cobro', detalle: '' }))).toMatchObject({ status: 409 });
    });

    it('la cocina avanza una orden nueva hasta "lista" y nunca la entrega', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 10, 11, 12, 0));
      try {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            { provide: MOCK_LATENCIA_MS, useValue: 0 },
            { provide: MOCK_COCINA, useValue: { confirmarPagoMs: 1000, prepararMs: 1000, terminarMs: 1000 } },
            OrdenesMockRepository,
          ],
        });
        repo = TestBed.inject(OrdenesMockRepository);
        const orden = await valor(
          repo.crear({
            idCafeteria: DEMO_CAFETERIA.central,
            recogidaEn: dentroDe(30),
            metodo: 'transferencia',
            items: [{ idProducto: DEMO_PRODUCTO.sandwich, cantidad: 1 }],
          }),
        );
        const estado = async () => (await valor(repo.obtener(orden.idOrden))).estado;
        expect(await estado()).toBe('pendiente');
        vi.advanceTimersByTime(1000);
        expect(await estado()).toBe('confirmada');
        vi.advanceTimersByTime(1000);
        expect(await estado()).toBe('en_preparacion');
        vi.advanceTimersByTime(1000);
        expect(await estado()).toBe('lista');
        vi.advanceTimersByTime(60_000);
        expect(await estado()).toBe('lista');
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
