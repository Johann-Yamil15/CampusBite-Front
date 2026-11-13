import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CafeteriaFacade } from '@features/cafeterias/application/cafeteria.facade';
import { CafeteriaDto } from '@features/cafeterias/data/dtos/cafeteria.dto';
import { provideCafeterias } from './cafeterias.providers';

const DTO: CafeteriaDto = {
  idCafeteria: '00000000-0000-0000-0000-0000000000c1',
  nombre: 'Cafetería Central',
  ubicacion: 'Edificio principal',
  esDelCampus: true,
  puntoEntrega: 'Puerta 1',
  activa: true,
  metodosPago: ['Efectivo'],
  creadoEn: '2026-10-20T12:00:00Z',
  actualizadoEn: '2026-10-20T12:00:00Z',
};

/**
 * CL-Sprint4 04/11/2026: HU-06B. CafeteriaFacade con el repositorio HTTP real (provideCafeterias):
 * load() funciona con GET api/cafeterias en arreglo (Sprint4) y paginado (rama de Joseph), y si la
 * respuesta no se entiende, error() trae un mensaje útil en vez del de un TypeError.
 */
describe('provideCafeterias + CafeteriaFacade.load', () => {
  let facade: CafeteriaFacade;
  let http: HttpTestingController;
  const flushFirstPage = (body: object) =>
    http.expectOne((r) => r.url === '/api/cafeterias' && r.params.get('pagina') === '1').flush(body);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideCafeterias()],
    });
    facade = TestBed.inject(CafeteriaFacade);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('llena la lista con la respuesta en arreglo', () => {
    facade.load().subscribe();
    flushFirstPage([DTO]);
    expect(facade.list().map((c) => c.name)).toEqual(['Cafetería Central']);
    expect(facade.error()).toBeNull();
  });

  it('llena la lista con la respuesta paginada', () => {
    facade.load().subscribe();
    flushFirstPage({ items: [DTO], total: 1, pagina: 1, tamanoPagina: 100 });
    expect(facade.list().map((c) => c.name)).toEqual(['Cafetería Central']);
    expect(facade.error()).toBeNull();
  });

  it('con una respuesta desconocida deja un mensaje útil en error() y la lista intacta', () => {
    facade.load().subscribe({ error: () => undefined });
    flushFirstPage({ algo: 'inesperado' });

    expect(facade.error()).toContain('No se pudo leer la lista de cafeterías');
    expect(facade.error()).not.toMatch(/is not a function/);
    expect(facade.list()).toEqual([]);
    expect(facade.loading()).toBe(false);
  });
});
