import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { CatalogoRepository } from '@features/catalogo/domain/repositories/catalogo.repository';
import { MenuCafeteria } from '@features/catalogo/domain/models/catalogo.model';
import { CatalogoFacade } from './catalogo.facade';

const MENU: MenuCafeteria[] = [
  {
    idCafeteria: 'c1',
    cafeteria: 'Central',
    esDelCampus: true,
    puntoEntrega: 'Barra',
    logoUrl: null,
    portadaUrl: null,
    calificacion: null,
    resenas: null,
    abierta: true,
    cierraA: null,
    minutosEstimados: null,
    metodosPago: ['efectivo'],
    productos: [
      { idProducto: 'p1', producto: 'Latte', categoria: 'Bebidas', descripcion: null, precio: 38, imagenUrl: null, calificacion: null, minutosPreparacion: null, precioAnterior: null, popular: false },
    ],
  },
];

describe('CatalogoFacade', () => {
  const repo = { listarMenu: vi.fn(), menuCafeteria: vi.fn() };
  let facade: CatalogoFacade;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({ providers: [{ provide: CatalogoRepository, useValue: repo }] });
    facade = TestBed.inject(CatalogoFacade);
  });

  it('carga una sola vez salvo que se fuerce', async () => {
    repo.listarMenu.mockReturnValue(of(MENU));
    await firstValueFrom(facade.cargar());
    await firstValueFrom(facade.cargar());
    expect(repo.listarMenu).toHaveBeenCalledTimes(1);

    await firstValueFrom(facade.cargar(true));
    expect(repo.listarMenu).toHaveBeenCalledTimes(2);
    expect(facade.platillos()[0]).toMatchObject({ producto: 'Latte', cafeteria: 'Central' });
    expect(facade.cafeteria('c1')?.metodosPago).toEqual(['efectivo']);
  });

  it('si falla deja el mensaje en error() y apaga cargando()', async () => {
    repo.listarMenu.mockReturnValue(throwError(() => ({ status: 503, message: 'Sin servicio' })));
    await expect(firstValueFrom(facade.cargar())).rejects.toBeTruthy();
    expect(facade.error()).toBe('Sin servicio');
    expect(facade.cargando()).toBe(false);
  });
});
