// FB-Sprint4 01/11/2026: Pruebas del servicio HTTP del menú del alumno.
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { MenuService } from './menu';
import { environment } from '../../environments/environment';

describe('MenuService', () => {
  let service: MenuService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MenuService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listarMenu hace GET a /menu', () => {
    service.listarMenu().subscribe(menu => expect(menu).toEqual([]));
    const req = http.expectOne(`${environment.apiUrl}/menu`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('menuCafeteria hace GET a /menu/:id', () => {
    service.menuCafeteria('c1').subscribe();
    http.expectOne(`${environment.apiUrl}/menu/c1`).flush({});
  });
});
