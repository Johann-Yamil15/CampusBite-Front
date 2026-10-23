import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CafeteriaDto } from '@features/cafeterias/data/dtos/cafeteria.dto';
import { CafeteriaHttpRepository } from './cafeteria-http.repository';

const ID = '00000000-0000-0000-0000-0000000000c1';

const DTO: CafeteriaDto = {
  idCafeteria: ID,
  nombre: 'Cafetería Central',
  ubicacion: 'Edificio principal',
  esDelCampus: true,
  puntoEntrega: 'Puerta 1',
  activa: true,
  metodosPago: ['Efectivo'],
  creadoEn: '2026-10-20T12:00:00Z',
  actualizadoEn: '2026-10-20T12:00:00Z',
};

const DATA = {
  name: 'Cafetería Central',
  location: 'Edificio principal',
  onCampus: true,
  pickupPoint: 'Puerta 1',
  paymentMethods: ['Efectivo' as const],
};

/** CL-Sprint3 20/10/2026: verifica rutas, verbos y cuerpos contra el contrato de TEC-08. */
describe('CafeteriaHttpRepository', () => {
  let repo: CafeteriaHttpRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), CafeteriaHttpRepository],
    });
    repo = TestBed.inject(CafeteriaHttpRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista solo activas sin mandar parámetros', () => {
    let names: string[] = [];
    repo.list(false).subscribe((list) => (names = list.map((c) => c.name)));

    const req = http.expectOne('/api/cafeterias');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys()).toEqual([]);
    req.flush([DTO]);
    expect(names).toEqual(['Cafetería Central']);
  });

  it('lista incluyendo inactivas con incluirInactivas=true', () => {
    repo.list(true).subscribe();
    const req = http.expectOne('/api/cafeterias?incluirInactivas=true');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('consulta por id', () => {
    repo.getById(ID).subscribe();
    const req = http.expectOne(`/api/cafeterias/${ID}`);
    expect(req.request.method).toBe('GET');
    req.flush(DTO);
  });

  it('crea con POST y el body del backend', () => {
    repo.create(DATA).subscribe();
    const req = http.expectOne('/api/cafeterias');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      nombre: 'Cafetería Central',
      ubicacion: 'Edificio principal',
      esDelCampus: true,
      puntoEntrega: 'Puerta 1',
      metodosPago: ['Efectivo'],
    });
    req.flush(DTO, { status: 201, statusText: 'Created' });
  });

  it('edita con PUT', () => {
    repo.update(ID, DATA).subscribe();
    const req = http.expectOne(`/api/cafeterias/${ID}`);
    expect(req.request.method).toBe('PUT');
    req.flush(DTO);
  });

  it('da de baja con DELETE y reactiva con POST /reactivar', () => {
    repo.deactivate(ID).subscribe();
    const del = http.expectOne(`/api/cafeterias/${ID}`);
    expect(del.request.method).toBe('DELETE');
    del.flush(null, { status: 204, statusText: 'No Content' });

    repo.reactivate(ID).subscribe();
    const post = http.expectOne(`/api/cafeterias/${ID}/reactivar`);
    expect(post.request.method).toBe('POST');
    post.flush(null, { status: 204, statusText: 'No Content' });
  });
});
