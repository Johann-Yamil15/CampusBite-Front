import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MenuCafeteriaDto } from '@features/catalogo/data/dtos/catalogo.dto';
import { CatalogoHttpRepository } from './catalogo-http.repository';

const DTO: MenuCafeteriaDto = {
  idCafeteria: 'c1',
  cafeteria: 'Cafetería Central',
  esDelCampus: true,
  puntoEntrega: 'Edificio A',
  metodosPago: ['Efectivo', 'Tarjeta'],
  productos: [
    { idProducto: 'p1', producto: 'Latte', categoria: 'Bebidas', descripcion: null, precio: 38, imagenUrl: null },
  ],
};

/** CL-Sprint5 11/11/2026: rutas y mapeo de api/menu (antes las cubría shared/menu/menu.spec.ts de FB). */
describe('CatalogoHttpRepository', () => {
  let repo: CatalogoHttpRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), CatalogoHttpRepository],
    });
    repo = TestBed.inject(CatalogoHttpRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listarMenu hace GET a /api/menu y pasa los métodos de pago a minúsculas', () => {
    let metodos: string[] = [];
    repo.listarMenu().subscribe((menu) => (metodos = menu[0].metodosPago));

    const req = http.expectOne('/api/menu');
    expect(req.request.method).toBe('GET');
    req.flush([DTO]);

    expect(metodos).toEqual(['efectivo', 'tarjeta']);
  });

  it('menuCafeteria hace GET a /api/menu/:id', () => {
    let nombre = '';
    repo.menuCafeteria('c1').subscribe((menu) => (nombre = menu.cafeteria));
    http.expectOne('/api/menu/c1').flush(DTO);
    expect(nombre).toBe('Cafetería Central');
  });
});
