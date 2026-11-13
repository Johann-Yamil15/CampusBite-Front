import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiError } from '@core/http/api-error';
import { CafeteriaDto } from '@features/cafeterias/data/dtos/cafeteria.dto';
import {
  CafeteriaHttpRepository,
  MAX_PAGINAS_CAFETERIAS,
  TAMANO_PAGINA_CAFETERIAS,
} from './cafeteria-http.repository';

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

  // CL-Sprint4 04/11/2026: HU-06B. GET api/cafeterias en arreglo (Sprint4) o paginado (rama de Joseph)
  describe('list', () => {
    const dto = (n: number): CafeteriaDto => ({ ...DTO, idCafeteria: `id-${n}`, nombre: `Caf ${n}` });
    const range = (from: number, count: number) =>
      Array.from({ length: count }, (_, i) => dto(from + i));
    const page = (items: CafeteriaDto[], total: number, pagina: number) => ({
      items,
      total,
      pagina,
      tamanoPagina: TAMANO_PAGINA_CAFETERIAS,
    });
    const expectPage = (pagina: number) =>
      http.expectOne(
        (r) =>
          r.method === 'GET' &&
          r.url === '/api/cafeterias' &&
          r.params.get('pagina') === String(pagina),
      );

    it('pide la página 1 con el tamaño máximo y solo activas', () => {
      repo.list(false).subscribe();
      const req = expectPage(1);
      expect(req.request.params.get('tamanoPagina')).toBe(String(TAMANO_PAGINA_CAFETERIAS));
      expect(req.request.params.has('incluirInactivas')).toBe(false);
      req.flush([]);
    });

    it('manda incluirInactivas=true si se piden las inactivas', () => {
      repo.list(true).subscribe();
      const req = expectPage(1);
      expect(req.request.params.get('incluirInactivas')).toBe('true');
      req.flush([]);
    });

    it('acepta la respuesta en arreglo (Sprint4) y no pide más páginas', () => {
      let names: string[] = [];
      repo.list(false).subscribe((list) => (names = list.map((c) => c.name)));
      expectPage(1).flush([DTO]);
      expect(names).toEqual(['Cafetería Central']);
    });

    it('acepta una sola página', () => {
      let names: string[] = [];
      repo.list(false).subscribe((list) => (names = list.map((c) => c.name)));
      expectPage(1).flush(page([dto(1), dto(2)], 2, 1));
      expect(names).toEqual(['Caf 1', 'Caf 2']);
    });

    it('recorre varias páginas en orden y junta todas', () => {
      let ids: string[] = [];
      repo.list(true).subscribe((list) => (ids = list.map((c) => c.id)));
      const total = TAMANO_PAGINA_CAFETERIAS * 2 + 1;

      const first = expectPage(1);
      first.flush(page(range(1, TAMANO_PAGINA_CAFETERIAS), total, 1));
      const second = expectPage(2);
      expect(second.request.params.get('incluirInactivas')).toBe('true');
      second.flush(page(range(101, TAMANO_PAGINA_CAFETERIAS), total, 2));
      expectPage(3).flush(page([dto(201)], total, 3));

      expect(ids.length).toBe(total);
      expect(ids[0]).toBe('id-1');
      expect(ids.at(-1)).toBe('id-201');
    });

    it('sigue pidiendo si el backend usa páginas más chicas que las pedidas', () => {
      let ids: string[] = [];
      repo.list(false).subscribe((list) => (ids = list.map((c) => c.id)));
      const small = (items: CafeteriaDto[], pagina: number) => ({ items, total: 3, pagina, tamanoPagina: 1 });
      expectPage(1).flush(small([dto(1)], 1));
      expectPage(2).flush(small([dto(2)], 2));
      expectPage(3).flush(small([dto(3)], 3));
      expect(ids).toEqual(['id-1', 'id-2', 'id-3']);
    });

    it('no repite una cafetería que se recorrió de página', () => {
      let ids: string[] = [];
      repo.list(false).subscribe((list) => (ids = list.map((c) => c.id)));
      const total = TAMANO_PAGINA_CAFETERIAS + 1;
      expectPage(1).flush(page(range(1, TAMANO_PAGINA_CAFETERIAS), total, 1));
      expectPage(2).flush(page([dto(100), dto(101)], total + 1, 2));
      expect(ids.length).toBe(TAMANO_PAGINA_CAFETERIAS + 1);
    });

    it('deja de pedir si llega una página vacía aunque total diga que faltan', () => {
      let count = -1;
      repo.list(false).subscribe((list) => (count = list.length));
      expectPage(1).flush(page([], 5, 1));
      expect(count).toBe(0);
    });

    it(`se detiene con un error claro al pasar de ${MAX_PAGINAS_CAFETERIAS} páginas`, () => {
      let error: ApiError | undefined;
      repo.list(false).subscribe({ error: (e: ApiError) => (error = e) });
      const huge = TAMANO_PAGINA_CAFETERIAS * (MAX_PAGINAS_CAFETERIAS + 10);

      for (let p = 1; p <= MAX_PAGINAS_CAFETERIAS; p++) {
        expectPage(p).flush(page(range(p * 1000, TAMANO_PAGINA_CAFETERIAS), huge, p));
      }

      expect(error?.message).toContain(`límite de ${MAX_PAGINAS_CAFETERIAS} páginas`);
      http.expectNone((r) => r.params.get('pagina') === String(MAX_PAGINAS_CAFETERIAS + 1));
    });

    it.each([
      ['un objeto sin items', { datos: [] }],
      ['items que no es arreglo', { items: 'x', total: 1, pagina: 1, tamanoPagina: 100 }],
      ['total inválido', { items: [], total: 'muchos', pagina: 1, tamanoPagina: 100 }],
      ['null', null],
      ['un texto', 'hola'],
    ])('falla con ApiError (no TypeError) si responde %s', (_, body) => {
      let error: unknown;
      repo.list(false).subscribe({ error: (e: unknown) => (error = e) });
      expectPage(1).flush(body);

      expect(error).not.toBeInstanceOf(TypeError);
      expect(error).toEqual({
        status: 200,
        message: expect.stringContaining('No se pudo leer la lista de cafeterías') as string,
      });
    });
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
