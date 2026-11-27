// CL-Sprint5 26/11/2026: pruebas de los errores sin red (status 0) y del corte de envíos sin internet.
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApiError, esErrorDeRed } from '@core/http/api-error';
import {
  MENSAJE_SIN_INTERNET,
  MENSAJE_SIN_SERVIDOR,
  errorInterceptor,
} from '@core/interceptors/error.interceptor';
import { sinConexionInterceptor } from '@core/interceptors/sin-conexion.interceptor';
import { ConexionService } from '@core/services/conexion.service';

describe('errorInterceptor + sinConexionInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  const evento = (tipo: 'online' | 'offline') => window.dispatchEvent(new Event(tipo));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor, sinConexionInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    // En la app la franja de conexión lo crea al arrancar; aquí se crea antes de simular los eventos
    TestBed.inject(ConexionService);
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    evento('online');
    backend.verify();
  });

  /** Hace la petición y devuelve el ApiError que llega a quien se suscribe. */
  function capturar(peticion: ReturnType<HttpClient['get']>): { error: ApiError | null } {
    const r: { error: ApiError | null } = { error: null };
    peticion.subscribe({ error: (e: ApiError) => (r.error = e) });
    return r;
  }

  it('status 0 sin internet: mensaje claro en español, no el del navegador', () => {
    const r = capturar(http.get('/api/menu'));
    evento('offline');
    backend.expectOne('/api/menu').error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    expect(r.error).toEqual({ status: 0, message: MENSAJE_SIN_INTERNET });
  });

  it('status 0 con internet: el servidor no respondió (aunque el cuerpo traiga "Failed to fetch")', () => {
    const r = capturar(http.get('/api/menu'));
    backend.expectOne('/api/menu').flush({ message: 'Failed to fetch' }, { status: 0, statusText: 'Unknown Error' });
    expect(r.error?.message).toBe(MENSAJE_SIN_SERVIDOR);
    expect(r.error?.noEnviado).toBeUndefined();
  });

  it('el 504 del service worker sin red da el mismo mensaje y cuenta como error de red', () => {
    evento('offline');
    const r = capturar(http.get('/api/auth/me'));
    backend.expectOne('/api/auth/me').flush(null, { status: 504, statusText: 'Gateway Timeout' });
    expect(r.error).toEqual({ status: 504, message: MENSAJE_SIN_INTERNET });
    expect(esErrorDeRed(r.error)).toBe(true);
  });

  it('sin internet no sale ningún POST: error 0 marcado como no enviado', () => {
    evento('offline');
    const r = capturar(http.post('/api/ordenes', { idCafeteria: 'c1' }));
    backend.expectNone('/api/ordenes');
    expect(r.error).toEqual({ status: 0, message: MENSAJE_SIN_INTERNET, noEnviado: true });
  });

  it('sin internet los GET sí salen (el service worker puede responder el menú)', () => {
    evento('offline');
    let menu: unknown = null;
    http.get('/api/menu').subscribe((m) => (menu = m));
    backend.expectOne('/api/menu').flush([{ idCafeteria: 'c1' }]);
    expect(menu).toEqual([{ idCafeteria: 'c1' }]);
  });

  it('los demás errores siguen igual', () => {
    const r = capturar(http.get('/api/cafeterias/x'));
    backend.expectOne('/api/cafeterias/x').flush(null, { status: 404, statusText: 'Not Found' });
    expect(r.error?.message).toBe('Recurso no encontrado.');
  });
});
