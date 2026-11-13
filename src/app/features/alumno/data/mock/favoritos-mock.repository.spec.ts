import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Observable, firstValueFrom } from 'rxjs';
import { MOCK_LATENCIA_MS } from '@core/mock/mock-backend';
import { DEMO_CAFETERIA, DEMO_PRODUCTO } from '@features/catalogo/data/mock/catalogo.mock-data';
import { TokenStorageService } from '@core/services/token-storage.service';
import { CLAVE_FAVORITOS, FavoritosMockRepository } from './favoritos-mock.repository';

/** JWT de prueba con el `sub` dado (el mock solo lee el claim). */
const tokenDe = (sub: string) => `x.${btoa(JSON.stringify({ sub })).replace(/=+$/, '')}.y`;

/** CL-Sprint5 11/11/2026 (etapa 7): favoritos simulados, persistentes en localStorage por usuario. */
describe('FavoritosMockRepository', () => {

  // CL-Sprint5 11/11/2026 (etapa 9): el abierto/cerrado sale del horario del negocio; se fija el reloj en un
  // miércoles a mediodía para que la prueba no dependa de la hora en que corre.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 11, 12, 0));
  });
  afterEach(() => vi.useRealTimers());
  const valor = <T>(o: Observable<T>) => firstValueFrom(o);
  let repo: FavoritosMockRepository;

  function crear(sub: string): FavoritosMockRepository {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: MOCK_LATENCIA_MS, useValue: 0 }, FavoritosMockRepository],
    });
    TestBed.inject(TokenStorageService).set(tokenDe(sub));
    return TestBed.inject(FavoritosMockRepository);
  }

  beforeEach(() => {
    localStorage.clear();
    repo = crear('alumno-1');
  });

  afterEach(() => localStorage.clear());

  it('arranca con los de la demo: uno disponible, uno de cafetería cerrada y uno retirado', async () => {
    const platillos = await valor(repo.listarPlatillos());
    const de = (nombre: string) => platillos.find((p) => p.producto.includes(nombre))!;
    expect(de('Sándwich')).toMatchObject({ disponible: true, cafeteriaAbierta: true });
    expect(de('Latte')).toMatchObject({ disponible: true, cafeteriaAbierta: false });
    expect(de('Malteada')).toMatchObject({ disponible: false });
    expect((await valor(repo.listarCafeterias())).length).toBe(3);
  });

  it('guarda en localStorage por usuario y sobrevive a una instancia nueva', async () => {
    await valor(repo.agregarPlatillo(DEMO_PRODUCTO.hamburguesa));
    await valor(repo.quitarCafeteria(DEMO_CAFETERIA.central));
    expect(localStorage.getItem(CLAVE_FAVORITOS + 'alumno-1')).toContain(DEMO_PRODUCTO.hamburguesa);

    const otraVez = crear('alumno-1');
    expect((await valor(otraVez.listarPlatillos()))[0].idProducto).toBe(DEMO_PRODUCTO.hamburguesa);
    expect((await valor(otraVez.listarCafeterias())).map((c) => c.idCafeteria)).not.toContain(DEMO_CAFETERIA.central);

    // Otro usuario no ve los cambios del primero
    const otro = crear('alumno-2');
    expect((await valor(otro.listarPlatillos())).map((p) => p.idProducto)).not.toContain(DEMO_PRODUCTO.hamburguesa);
  });

  it('agregar y quitar son idempotentes; un producto que no existe responde 404', async () => {
    await valor(repo.agregarPlatillo(DEMO_PRODUCTO.sandwich));
    await valor(repo.quitarPlatillo('no-esta'));
    expect((await valor(repo.listarPlatillos())).filter((p) => p.idProducto === DEMO_PRODUCTO.sandwich).length).toBe(1);
    await expect(valor(repo.agregarPlatillo('no-existe'))).rejects.toMatchObject({ status: 404 });
  });
});
