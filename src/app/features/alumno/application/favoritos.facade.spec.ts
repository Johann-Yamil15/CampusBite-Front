import { TestBed } from '@angular/core/testing';
import { Subject, firstValueFrom, throwError } from 'rxjs';
import { vi } from 'vitest';
import { MOCK_LATENCIA_MS } from '@core/mock/mock-backend';
import { DEMO_CAFETERIA, DEMO_PRODUCTO } from '@features/catalogo/data/mock/catalogo.mock-data';
import { FavoritosRepository } from '@features/alumno/domain/repositories/favoritos.repository';
import { FavoritosFacade } from './favoritos.facade';
import { provideFavoritosMock } from '@features/alumno/data/mock/alumno-mock.providers';

/** CL-Sprint5 11/11/2026 (etapa 7): corazón inmediato, reversión si falla y "Deshacer" a su lugar. */
describe('FavoritosFacade', () => {
  let facade: FavoritosFacade;
  let repo: FavoritosRepository;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideFavoritosMock(), { provide: MOCK_LATENCIA_MS, useValue: 0 }] });
    facade = TestBed.inject(FavoritosFacade);
    repo = TestBed.inject(FavoritosRepository);
    await firstValueFrom(facade.cargar());
  });

  afterEach(() => localStorage.clear());

  it('carga platillos y cafeterías', () => {
    expect(facade.platillos().length).toBe(4);
    expect(facade.cafeterias().length).toBe(3);
    expect(facade.esFavorito('platillo', DEMO_PRODUCTO.sandwich)).toBe(true);
    expect(facade.esFavorito('cafeteria', DEMO_CAFETERIA.central)).toBe(true);
  });

  it('el corazón cambia antes de que responda el back', () => {
    const respuesta = new Subject<void>();
    vi.spyOn(repo, 'quitarPlatillo').mockReturnValue(respuesta);
    facade.alternar('platillo', DEMO_PRODUCTO.sandwich).subscribe();
    expect(facade.esFavorito('platillo', DEMO_PRODUCTO.sandwich)).toBe(false);
    respuesta.next();
    respuesta.complete();
  });

  it('si el back falla, todo regresa como estaba', async () => {
    vi.spyOn(repo, 'quitarCafeteria').mockReturnValue(throwError(() => ({ status: 0, message: 'Sin red' })));
    await expect(firstValueFrom(facade.alternar('cafeteria', DEMO_CAFETERIA.central))).rejects.toMatchObject({
      message: 'Sin red',
    });
    expect(facade.esFavorito('cafeteria', DEMO_CAFETERIA.central)).toBe(true);
    expect(facade.cafeterias().length).toBe(3);
  });

  it('deshacer (volver a agregar) lo regresa a su lugar en la lista', async () => {
    const antes = facade.platillos().map((p) => p.idProducto);
    expect(await firstValueFrom(facade.alternar('platillo', antes[1]))).toBe(false);
    expect(facade.platillos().map((p) => p.idProducto)).not.toContain(antes[1]);
    expect(await firstValueFrom(facade.alternar('platillo', antes[1]))).toBe(true);
    expect(facade.platillos().map((p) => p.idProducto)).toEqual(antes);
  });
});
