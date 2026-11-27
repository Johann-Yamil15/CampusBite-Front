import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiError } from '@core/http/api-error';
import { ConexionService } from '@core/services/conexion.service';
import { MENSAJE_SIN_CONEXION, sinConexionInterceptor } from './sin-conexion.interceptor';

/** JJ-Sprint5 27/11/2026: sin conexión, las lecturas pasan (las responde el caché) y las escrituras no se intentan. */
describe('sinConexionInterceptor y ConexionService', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let conexion: ConexionService;
  let enLinea = true;

  const ponerEnLinea = (valor: boolean) => {
    enLinea = valor;
    window.dispatchEvent(new Event(valor ? 'online' : 'offline'));
  };

  beforeEach(() => {
    enLinea = true;
    vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => enLinea);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([sinConexionInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    conexion = TestBed.inject(ConexionService);
  });

  afterEach(() => {
    backend.verify();
    vi.restoreAllMocks();
  });

  it('sigue los eventos online/offline del navegador', () => {
    expect(conexion.enLinea()).toBe(true);
    ponerEnLinea(false);
    expect(conexion.enLinea()).toBe(false);
    ponerEnLinea(true);
    expect(conexion.enLinea()).toBe(true);
  });

  it('sin conexión, un GET sí sale (el service worker responde desde su caché)', () => {
    ponerEnLinea(false);
    http.get('/api/ordenes/mias').subscribe();
    backend.expectOne('/api/ordenes/mias').flush({ items: [] });
  });

  it('sin conexión, una escritura se rechaza al instante con un mensaje claro', () => {
    ponerEnLinea(false);
    let error: ApiError | null = null;
    http.post('/api/ordenes', {}).subscribe({ error: (e: ApiError) => (error = e) });
    backend.expectNone('/api/ordenes');
    expect(error).toEqual({ status: 0, message: MENSAJE_SIN_CONEXION });
  });

  it('con conexión, la escritura sale normal', () => {
    http.post('/api/ordenes', {}).subscribe();
    backend.expectOne('/api/ordenes').flush({});
  });
});
